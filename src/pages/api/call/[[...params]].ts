import { PhoneNumberShort } from '../phone_numbers/[[...params]]'
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { IncomingMessage } from 'http'
import { base64url, EncryptJWT } from 'jose'
import {
  Body,
  Catch,
  createHandler,
  DefaultValuePipe,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseNumberPipe,
  Post,
  Query,
  Request,
  SetHeader,
} from 'next-api-decorators'
import { v4 } from 'uuid'
import { Call, CallState, PhoneNumberState } from '@prisma/client'
import { env } from '@/constants/env'
import { ApiExceptionHandler, ApiResponse, error, NextAuthNumberGuard, SessionPhoneNumber, success } from '@/lib/api_helper'
import { sendCancelCallNotification, sendIncomingCallNotification } from '@/lib/apns'
import { getPrisma } from '@/lib/database'
import { createLiveWebrtcToken, getBlueseaConfig } from '@/lib/live_api_helper'
import { sendSipCallNotification } from '@/lib/sip_notification'
import { PageRes } from '@/utils'

// First getting x-forwarded-for if exists, else getting remoteAddress
// If x-forwarded-for is array strings => using first
function getRemoteIp(req: IncomingMessage) {
  return req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress
}

export class LoginInput {
  @IsString()
  @IsNotEmpty()
  number!: string

  @IsString()
  name?: string

  @IsString()
  @IsNotEmpty()
  password!: string
}

export class AddDeviceInput {
  @IsString()
  @IsNotEmpty()
  token!: string

  @IsBoolean()
  @IsOptional()
  production?: boolean

  @IsBoolean()
  @IsOptional()
  active?: boolean
}

export class MakeCallInput {
  @IsString()
  type?: string
}

export interface MakeCallResponse {
  call: Call
  hook: string
  bluesea: {
    gateways: string | string[]
    room_id: string
    peer_id: string
    token: string
  }
}

export class InviteInput {
  @IsString()
  @IsNotEmpty()
  dest!: string

  @IsString()
  type?: string
}

export interface InviteCallResponse {
  call: Call
  hook: string
}

export enum CallHookAction {
  Cancel = 'CANCEL',
  Ringing = 'RINGING',
  Accept = 'ACCEPT',
  Reject = 'REJECT',
  Timeout = 'TIMEOUT',
  End = 'END',
}

export class CallHookInput {
  @IsEnum(CallHookAction)
  @IsNotEmpty()
  action!: CallHookAction

  @IsString()
  device?: string

  @IsString()
  network?: string

  @IsString()
  os_name?: string

  @IsString()
  os_version?: string
}

export interface CallLog {
  id: string
  type: string
  contact: string
  name: string
  outgoing: boolean
  created_at: number
  duration: number
}

export class DeleteLogInput {
  @IsString()
  @IsOptional()
  id?: string

  @IsArray()
  @IsOptional()
  ids?: string[]
}

async function get_source_for_sip(number: SessionPhoneNumber) {
  if (number.sip_out) {
    return number.number
  } else {
    const number_full = await getPrisma().phoneNumber.findUnique({
      where: {
        number: number.number,
      },
      include: {
        aliases: { where: { sip_out: true } },
      },
    })
    if (number_full && number_full.aliases.length > 0) {
      return number_full.aliases[0].number
    } else {
      return null
    }
  }
}

async function get_dest_for_sip(dest: string) {
  const number_full = await getPrisma().phoneNumber.findUnique({
    where: {
      number: dest,
    },
    include: {
      aliases: { where: { sip_in: true } },
    },
  })

  if (number_full) {
    if (number_full.sip_in) {
      return dest
    } else if (number_full.aliases.length > 0) {
      return number_full.aliases[0].number
    }
    return null
  }

  return dest
}

@Catch(ApiExceptionHandler)
class CallRouter {
  @Post('/login')
  @SetHeader('Cache-Control', 'nostore')
  async login(@Body() body: LoginInput): Promise<ApiResponse<string>> {
    const phone_number = await getPrisma().phoneNumber.findFirst({ where: { number: body.number } })
    if (!phone_number) {
      throw new NotFoundException('PhoneNumber not found')
    }
    if (phone_number.password != body.password) {
      throw new NotFoundException('Wrong password')
    }
    if (phone_number.state == PhoneNumberState.SUSPENDED) {
      throw new NotFoundException('PhoneNumber is suspended')
    }
    await getPrisma().phoneNumber.update({ where: { number: body.number }, data: { name: body.name || body.number } })
    const call_token = await new EncryptJWT({ number: body.number })
      .setIssuer('call')
      .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
      .encrypt(base64url.decode(env.JWT_SECRET))
    console.log(call_token)

    return success(call_token)
  }

  @Get('/fetch_name')
  @SetHeader('Cache-Control', 'nostore')
  async fetch_name(@Query('number') number: string): Promise<ApiResponse<string>> {
    const phone_number: any = await getPrisma().phoneNumber.findFirst({ where: { number } })
    console.log(phone_number)

    return success(phone_number.name)
  }

  @NextAuthNumberGuard()
  @Get('/fetch_me')
  @SetHeader('Cache-Control', 'nostore')
  async fetch_me(@SessionPhoneNumber() number: SessionPhoneNumber): Promise<ApiResponse<SessionPhoneNumber>> {
    return success(number)
  }

  @NextAuthNumberGuard()
  @Post('/device')
  @SetHeader('Cache-Control', 'nostore')
  async add_device(
    @SessionPhoneNumber() number: SessionPhoneNumber,
    @Body() body: AddDeviceInput
  ): Promise<ApiResponse<{}>> {
    console.log('body', body, number)

    await getPrisma().pushToken.upsert({
      where: { token: body.token },
      update: { number_id: number.number, production: body.production, active: body.active, updated_at: new Date() },
      create: { token: body.token, production: body.production, active: body.active, number_id: number.number },
    })
    return success({})
  }

  @NextAuthNumberGuard()
  @Get('/contacts')
  @SetHeader('Cache-Control', 'nostore')
  public async contacts(
    @SessionPhoneNumber() number: SessionPhoneNumber,
    @Query('skip', DefaultValuePipe(0), ParseNumberPipe) skip: number,
    @Query('limit', DefaultValuePipe(100), ParseNumberPipe({ nullable: true })) limit?: number
  ): Promise<ApiResponse<PageRes<PhoneNumberShort>>> {
    const phone_number = await getPrisma().phoneNumber.findUnique({
      where: { number: number.number },
      include: { groups: true },
    })
    console.log('233232', phone_number)

    if (!phone_number) {
      return error('Phone number not found')
    }
    const where = {
      groups: {
        some: {
          group_id: {
            in: phone_number.groups.map((g) => g.group_id),
          },
        },
      },
      number: {
        not: number.number,
      },
      state: PhoneNumberState.ACTIVE,
    }
    const phone_numbers = await getPrisma().phoneNumber.findMany({
      where,
      include: {
        _count: {
          select: {
            push_tokens: true,
          },
        },
        groups: {
          include: {
            group: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limit,
    })
    const count = await getPrisma().phoneNumber.count({
      where,
    })

    console.log("gggggggggggggggggggggggggg", phone_numbers);
    

    // @ts-ignore
    return success({
      skip,
      total: count,
      data: phone_numbers.map((n) => {
        return {
          number: n.number,
          state: n.state,
          name: n.name,
          sip_in: n.sip_in,
          sip_out: n.sip_out,
          alias_for_number: n.alias_for_number,
          avatar: n.avatar,
          created_at: n.created_at.getTime(),
          updated_at: n.updated_at?.getTime(),
          push_tokens: n._count.push_tokens,
          groups: n.groups.map((g) => g.group.name),
          is_register: true,
        }
      }),
    })
  }

  @NextAuthNumberGuard()
  @Get('/recents')
  @SetHeader('Cache-Control', 'nostore')
  public async recents(
    @SessionPhoneNumber() number: SessionPhoneNumber,
    @Query('skip', DefaultValuePipe(0), ParseNumberPipe) skip: number,
    @Query('limit', DefaultValuePipe(100), ParseNumberPipe({ nullable: true })) limit?: number
  ): Promise<ApiResponse<PageRes<CallLog>>> {
    const phone_number = await getPrisma().phoneNumber.findUnique({
      where: { number: number.number },
      include: { groups: true },
    })
    if (!phone_number) {
      return error('Phone number not found')
    }
    const where = {
      OR: [
        {
          from_number: number.number,
        },
        {
          to_number: number.number,
        },
      ],
    }
    const calls = await getPrisma().call.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        from: true,
        to: true,
        sessions: true,
      },
      skip,
      take: limit,
    })
    const count = await getPrisma().call.count({
      where,
    })

    return success({
      skip,
      total: count,
      data: calls.map((n) => {
        const joined_ts: any = n.sessions.filter((s) => s.joined_at !== null).map((s) => s.joined_at?.getTime())
        const leaved_ts: any = n.sessions.filter((s) => s.leaved_at !== null).map((s) => s.leaved_at?.getTime())
        let duration = 0
        if (joined_ts.length >= 2 && leaved_ts.length >= 2) {
          joined_ts.sort()
          leaved_ts.sort()
          duration = leaved_ts?.[1] - joined_ts?.[1]
        }

        return {
          id: n.id,
          type: n.type,
          contact: n.from_number != number.number ? n.from_number : n.to_number,
          name: n.from_number != number.number ? n.from?.name || n.from_number : n.to?.name || n.to_number,
          outgoing: n.from_number == number.number,
          created_at: n.created_at.getTime(),
          state: n.state,
          duration,
        }
      }),
    })
  }

  @NextAuthNumberGuard()
  @Post('/recents/delete_log')
  @SetHeader('Cache-Control', 'nostore')
  public async delete(
    @SessionPhoneNumber() number: SessionPhoneNumber,
    @Body() body: DeleteLogInput
  ): Promise<ApiResponse<{}>> {
    const phone_number = await getPrisma().phoneNumber.findUnique({
      where: { number: number.number },
      include: { groups: true },
    })
    if (!phone_number) {
      return error('Phone number not found')
    }

    const ids = body.id ? [body.id] : body.ids
    if (!ids) {
      return error('Missing id')
    }

    const res = await getPrisma().call.deleteMany({
      where: {
        AND: [
          {
            id: { in: ids },
          },
          {
            OR: [
              {
                from_number: number.number,
              },
              {
                to_number: number.number,
              },
            ],
          },
        ],
      },
    })
    if (res.count == 0) {
      return error('Call not found')
    }
    return success({})
  }

  @NextAuthNumberGuard()
  @Post('/make/:dest')
  @SetHeader('Cache-Control', 'nostore')
  public async make_call(
    @SessionPhoneNumber() number: SessionPhoneNumber,
    @Param('dest') dest: string,
    @Body() body: MakeCallInput
  ): Promise<ApiResponse<MakeCallResponse>> {
    const type = body.type || 'audio'
    let dest_number = await getPrisma().phoneNumber.findUnique({
      where: { number: dest },
      include: {
        push_tokens: { where: { active: true } },
        alias_for: { include: { groups: true, push_tokens: { where: { active: true } } } },
        groups: true,
      },
    })
    console.log('before call', dest_number)

    if (dest_number && dest_number.alias_for) {
      dest_number = {
        ...dest_number.alias_for,
        alias_for: null,
      }
    }
    const after_call_feedback = number.groups[0]?.after_call_feedback
    const room = await getPrisma().room.create({
      data: {
        id: v4().toLowerCase(),
      },
    })

    const call_id = v4().toLowerCase()
    const call = await getPrisma().call.create({
      data: {
        id: call_id,
        room_id: room.id,
        type,
        state: CallState.WAITING,
        from_number: number.number,
        to_number: dest,
        feedback: after_call_feedback,
      },
    })
    // create stream session for both caller callee with room_id, call_id, number
    await getPrisma().streamSession.createMany({
      data: [
        { call_id, room_id: room.id, number: number.number },
        { call_id, room_id: room.id, number: dest },
      ],
    })
    console.log('Pass to here 0 ')
    const bluesea_config = await getBlueseaConfig(number.manage_by_id || dest_number?.manage_by_id || undefined)
    console.log('Pass to here', bluesea_config)
    const from_token = await createLiveWebrtcToken(room.id, number.number, bluesea_config)
    console.log('Pass to here1')
    const to_token = await createLiveWebrtcToken(room.id, dest, bluesea_config)
    console.log('Pass to here2')

    const hook = env.PUSH_CALLBACK_ENDPOINT + '/api/call/hook/' + call.id

    const noti_conf: any = {
      call_id: call.id,
      call_type: type,
      caller_id_name: number.name,
      caller_id_number: number.number,
      gateways: bluesea_config.bluesea_gateways,
      room_id: room.id,
      peer_id: dest,
      token: to_token,
      hook: hook + '?number=' + dest,
    }

    if (dest_number && dest_number.push_tokens.length > 0) {
      //TODO fallback if dont have reply
      dest_number.push_tokens.map((token: { token: string; production: boolean | null; id: any }) => {
        sendIncomingCallNotification(token.token, noti_conf, token.production).then(() => {
          console.log('Sent push to device', token.id)
        })
      })

      const call_id = call.id
      setTimeout(async () => {
        const source_sip = await get_source_for_sip(number)
        const dest_sip = await get_dest_for_sip(dest)
        if (source_sip && dest_sip) {
          noti_conf.caller_id_number = source_sip
          const call = await getPrisma().call.findUnique({ where: { id: call_id } })
          if (call && call.state == CallState.WAITING) {
            console.log('No ringing after 5 second => sending over sip', dest_sip)
            dest_number?.push_tokens.map((tk) => {
              sendCancelCallNotification(tk.token, call_id, type, number.name, number.number, !!tk.production).then(() => {
                console.log('Sent cancel push to device', tk.id)
              })
            })
            sendSipCallNotification(dest_sip, noti_conf).then(() => {
              console.log('Sent sip push to number', dest_sip)
            })
          }
        }
      }, env.PUSH_TIMEOUT)


      return success({
        call,
        hook: hook + '?number=' + number.number,
        bluesea: {
          gateways: bluesea_config.bluesea_gateways,
          room_id: room.id,
          peer_id: number.number,
          token: from_token,
        },
      })
    } else {
      const source_sip = await get_source_for_sip(number)
      const dest_sip = await get_dest_for_sip(dest)

      if (source_sip && dest_sip) {
        console.log('No push notification => sending over sip')
        noti_conf.caller_id_number = source_sip
        await sendSipCallNotification(dest_sip, noti_conf)
        console.log('Sent sip push to number', dest_sip)
        return success({
          call,
          hook: hook + '?number=' + number.number,
          bluesea: {
            gateways: bluesea_config.bluesea_gateways,
            room_id: room.id,
            peer_id: number.number,
            token: from_token,
          },
        })
      }
    }

    //Update all call to error
    await getPrisma().call.updateMany({
      where: {
        id: call_id,
        state: CallState.WAITING,
      },
      data: {
        state: CallState.ERROR,
      },
    })
    return error('Number not avaiable', 'Number not avaiable')
  }

  // TODO protect this api
  @Get('/info/:call_id')
  @SetHeader('Cache-Control', 'nostore')
  async info_call(
    @SessionPhoneNumber() number: SessionPhoneNumber,
    @Param('call_id') call_id: string
  ): Promise<ApiResponse<Call>> {
    const call = await getPrisma().call.findUnique({
      where: { id: call_id },
    })
    // @ts-ignore
    return success(call)
  }

  // TODO protect this api
  @NextAuthNumberGuard()
  @Post('/invite/:room_id')
  @SetHeader('Cache-Control', 'nostore')
  async call_invite(
    @SessionPhoneNumber() number: SessionPhoneNumber,
    @Param('room_id') room_id: string,
    @Body() body: InviteInput
  ): Promise<ApiResponse<InviteCallResponse>> {
    const type = body.type || 'audio'
    const dest = body.dest
    let dest_number: any = await getPrisma().phoneNumber.findUnique({
      where: { number: dest },
      include: {
        push_tokens: { where: { active: true } },
        alias_for: { include: { groups: true, push_tokens: { where: { active: true } } } },
        groups: true,
      },
    })
    if (dest_number && dest_number.alias_for) {
      dest_number = {
        ...dest_number.alias_for,
        alias_for: null,
      }
    }
    const after_call_feedback = number.groups[0]?.after_call_feedback
    const room = await getPrisma().room.findUnique({
      where: {
        id: room_id,
      },
    })
    if (!room) {
      throw new Error('Room not found')
    }

    const invite_call_id = v4().toLowerCase()
    const invite_call = await getPrisma().call.create({
      data: {
        id: invite_call_id,
        room_id: room.id,
        type,
        state: CallState.WAITING,
        from_number: number.number,
        to_number: body.dest,
        feedback: after_call_feedback,
      },
    })
    // create stream session for both caller callee with room_id, call_id, number
    await getPrisma().streamSession.createMany({
      data: [{ call_id: invite_call_id, room_id: room.id, number: dest }],
    })

    const bluesea_config = await getBlueseaConfig(number.manage_by_id || dest_number?.manage_by_id || undefined)
    const to_token = await createLiveWebrtcToken(room_id, body.dest, bluesea_config)
    const hook = env.PUSH_CALLBACK_ENDPOINT + '/api/call/hook/' + invite_call_id

    const noti_conf: any = {
      call_id: invite_call.id,
      call_type: type,
      caller_id_name: number.name,
      caller_id_number: number.number,
      gateways: bluesea_config.bluesea_gateways,
      room_id: room_id,
      peer_id: body.dest,
      token: to_token,
      hook: hook + '?number=' + body.dest,
    }

    if (dest_number && dest_number.push_tokens.length > 0) {
      //TODO fallback if dont have reply
      dest_number.push_tokens.map((token: { token: string; production: boolean | null; id: any }) => {
        sendIncomingCallNotification(token.token, noti_conf, token.production).then(() => {
          console.log('Sent push to device', token.id)
        })
      })

      const call_id = invite_call_id
      setTimeout(async () => {
        const source_sip = await get_source_for_sip(number)
        const dest_sip = await get_dest_for_sip(dest)
        if (source_sip && dest_sip) {
          noti_conf.caller_id_number = source_sip
          const call = await getPrisma().call.findUnique({ where: { id: call_id } })
          if (call && call.state == CallState.WAITING) {
            console.log('No ringing after 5 second => sending over sip')
            dest_number.push_tokens.map((tk: { token: string; production: boolean; id: any }) => {
              sendCancelCallNotification(tk.token, call_id, type, number.name, number.number, tk.production).then(() => {
                console.log('Sent cancel push to device', tk.id)
              })
            })
            sendSipCallNotification(dest_sip, noti_conf).then(() => {
              console.log('Sent sip push to number', dest_sip)
            })
          }
        }
      }, env.PUSH_TIMEOUT)

      return success({
        call: invite_call,
        hook,
      })
    } else {
      //TODO handle sip call failed
      const source_sip = await get_source_for_sip(number)
      const dest_sip = await get_dest_for_sip(dest)
      if (source_sip && dest_sip) {
        console.log('No push notification => sending over sip')
        noti_conf.caller_id_number = source_sip
        await sendSipCallNotification(dest_sip, noti_conf)
        console.log('Sent sip push to number', dest_sip)
        return success({
          call: invite_call,
          hook,
        })
      }
    }

    //Update all call to error
    await getPrisma().call.updateMany({
      where: {
        room_id: room_id,
        id: invite_call_id,
        state: CallState.WAITING,
      },
      data: {
        state: CallState.ERROR,
      },
    })
    return error('Number not avaiable', 'Number not avaiable')
  }

  async append_hook_log(
    call_id: string,
    room_id: string,
    number: string,
    body: CallHookInput,
    success: boolean,
    error?: string,
    user_agent?: string,
    remote_ip?: string
  ) {
    await getPrisma().callActionLogs.create({
      data: {
        call_id,
        room_id,
        number,
        action: body.action,
        success,
        error,
        ip: remote_ip,
        user_agent,
        device: body.device,
        os_name: body.os_name,
        os_version: body.os_version,
        network: body.network,
      },
    })
  }

  async update_call_state_transaction(call_id: string, from_state: CallState[], to_state: CallState) {
    const success = await getPrisma().$transaction(async (tx) => {
      const call = await tx.call.findUnique({
        where: { id: call_id },
      })

      if (call && from_state.includes(call.state)) {
        await tx.call.update({
          where: { id: call_id },
          data: { state: to_state },
        })
        return true
      } else {
        return false
      }
    })
    return success
  }

  // TODO protect this api
  @Post('/hook/:call_id')
  @SetHeader('Cache-Control', 'nostore')
  async call_hook(
    @Param('call_id') call_id: string,
    @Query('number') number: string,
    @Body() body: CallHookInput,
    @Header('user-agent') ua: string,
    @Request() req: IncomingMessage
  ): Promise<ApiResponse<Call>> {
    const remote_ip = getRemoteIp(req)


    const call = await getPrisma().call.findUnique({
      where: { id: call_id },
      include: {
        from: {
          include: { push_tokens: true },
        },
        to: {
          include: {
            push_tokens: { where: { active: true } },
            alias_for: { include: { push_tokens: { where: { active: true } } } },
          },
        },
      },
    })
    if (!call) {
      throw new Error('CallId not found')
    }
    switch (body.action) {
      case CallHookAction.Cancel: {
        const update_success = await this.update_call_state_transaction(
          call_id,
          [CallState.RINGING, CallState.WAITING],
          CallState.CANCELED
        )
        if (call.to && update_success) {
          this.append_hook_log(call_id, call.room_id, number, body, true, undefined, ua, remote_ip)
          call.to.push_tokens.concat(call.to.alias_for?.push_tokens || []).map((tk: any) => {
            sendCancelCallNotification(tk.token, call_id, call.type, call.from?.name, call.from_number, tk.production).then(
              () => {
                console.log('Sent cancel push to device', tk.id)
              }
            )
          })
        } else {
          this.append_hook_log(
            call_id,
            call.room_id,
            number,
            body,
            false,
            'No call with ringing or waiting state',
            ua,
            remote_ip
          )
        }
        break
      }
      case CallHookAction.Ringing: {
        if (await this.update_call_state_transaction(call_id, [CallState.WAITING], CallState.RINGING)) {
          this.append_hook_log(call_id, call.room_id, number, body, true, undefined, ua, remote_ip)
        } else {
          this.append_hook_log(call_id, call.room_id, number, body, false, 'No call with waiting state', ua, remote_ip)
        }
        break
      }
      case CallHookAction.Accept: {
        if (await this.update_call_state_transaction(call_id, [CallState.RINGING, CallState.WAITING], CallState.ACCEPTED)) {
          this.append_hook_log(call_id, call.room_id, number, body, true, undefined, ua, remote_ip)
        } else {
          this.append_hook_log(
            call_id,
            call.room_id,
            number,
            body,
            false,
            'No call with ringing or waiting state',
            ua,
            remote_ip
          )
        }
        break
      }
      case CallHookAction.Reject: {
        if (await this.update_call_state_transaction(call_id, [CallState.RINGING, CallState.WAITING], CallState.REJECTED)) {
          this.append_hook_log(call_id, call.room_id, number, body, true, undefined, ua, remote_ip)
        } else {
          this.append_hook_log(
            call_id,
            call.room_id,
            number,
            body,
            false,
            'No call with ringing or waiting state',
            ua,
            remote_ip
          )
        }
        break
      }
      case CallHookAction.End: {
        if (await this.update_call_state_transaction(call_id, [CallState.ACCEPTED], CallState.ENDED)) {
          this.append_hook_log(call_id, call.room_id, number, body, true, undefined, ua, remote_ip)
        } else {
          this.append_hook_log(call_id, call.room_id, number, body, false, 'No call with accepted state', ua, remote_ip)
        }
        break
      }
      case CallHookAction.Timeout: {
        if (await this.update_call_state_transaction(call_id, [CallState.RINGING, CallState.WAITING], CallState.TIMEOUT)) {
          this.append_hook_log(call_id, call.room_id, number, body, true, undefined, ua, remote_ip)
        } else {
          this.append_hook_log(
            call_id,
            call.room_id,
            number,
            body,
            false,
            'No call with ringing or waiting state',
            ua,
            remote_ip
          )
        }
        break
      }
    }
    const new_call: any = await getPrisma().call.findUnique({
      where: { id: call_id },
    })

    return success(new_call)
  }
}

export default createHandler(CallRouter)
