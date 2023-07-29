import { IsBoolean, IsNotEmpty, IsString } from 'class-validator'
import {
  Body,
  Catch,
  createHandler,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseNumberPipe,
  Post,
  Put,
  Query,
  SetHeader,
} from 'next-api-decorators'
import { PhoneNumber, PhoneNumberState, PushToken } from '@prisma/client'
import { ApiExceptionHandler, ApiResponse, NextAuthGuard, SessionUser, success } from '@/lib/api_helper'
import { getPrisma } from '@/lib/database'
import { checkNumberManagePermission } from '@/lib/permission'
import { UserRole } from '@/types'
import { PageRes } from '@/utils/request'
import _ from 'lodash'

function generateManagedNumberFilter(user: SessionUser) {
  if (user.role == UserRole.SUPPER_ADMIN) {
    return {}
  }
  if (user.role == UserRole.ADMIN) {
    return {
      manage_by_id: {
        in: user.groups.map((g) => g.group_id),
      },
    }
  }
  return {
    id: 'none',
  }
}

function getDifferenceGroup(array1 : any, array2 : any) {
  return array1.filter((object1 :any)=> {
    return !array2.some((object2:any) => {
      return object1.id === object2.id;
    });
  });
}

export interface PhoneNumberInfo {
  number: string
  name: string
  sip_in: boolean
  sip_out: boolean
  alias_for_number?: string
  avatar?: string
  password: string
  created_at: number
  updated_at: number
  groups: string[]
  push_tokens: PushToken[]
  state: PhoneNumberState
  manage_by?: string
}

export interface PhoneNumberShort {
  number: string
  state: PhoneNumberState
  name: string
  sip_in: boolean
  sip_out: boolean
  alias_for_number?: string
  avatar: string
  created_at: number
  updated_at: number
  push_tokens: number
  groups: string[]
  manage_by?: string
}

export class CreatePhoneNumberInput {
  @IsString()
  @IsNotEmpty()
  number!: string

  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsNotEmpty()
  password!: string
}

export class UpdatePhoneNumberInput {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsBoolean()
  sip_in!: boolean

  @IsBoolean()
  sip_out!: boolean

  @IsString()
  alias_for_number?: string

  @IsString()
  @IsNotEmpty()
  avatar!: string

  @IsString()
  @IsNotEmpty()
  password!: string

  @IsString()
  @IsNotEmpty()
  state!: PhoneNumberState

  @IsString()
  manage_by?: string

  groups?: string[]
}

@NextAuthGuard()
@Catch(ApiExceptionHandler)
class PhoneNumberRouter {
  @Get('/one/:number')
  @SetHeader('Cache-Control', 'nostore')
  public async get_one(
    @SessionUser() user: SessionUser,
    @Param('number') number: string
  ): Promise<ApiResponse<PhoneNumberInfo>> {
    const phone_number: any = await getPrisma().phoneNumber.findFirst({
      where: { number },
      include: { push_tokens: true, manage_by: true, groups: { include: { group: true } } },
    })
    if (!phone_number) {
      throw new NotFoundException('PhoneNumber not found')
    }
    if (!checkNumberManagePermission(user, phone_number)) {
      return { status: false, error: 'NO_PERMISSION' }
    }

    return success({
      number: number,
      name: phone_number.name,
      sip_in: phone_number.sip_in,
      sip_out: phone_number.sip_out,
      alias_for_number: phone_number.alias_for_number,
      avatar: phone_number.avatar,
      password: phone_number.password,
      created_at: phone_number.created_at.getTime(),
      updated_at: phone_number.updated_at?.getTime(),
      push_tokens: phone_number.push_tokens,
      groups: phone_number.groups.map((g: any) => g.group.name),
      state: phone_number.state,
      manage_by: phone_number.manage_by?.name,
    })
  }

  @Get('/count')
  @SetHeader('Cache-Control', 'nostore')
  public async count(@SessionUser() user: SessionUser): Promise<ApiResponse<number>> {
    const conditions = generateManagedNumberFilter(user)
    const projects = await getPrisma().phoneNumber.count({
      where: conditions,
    })
    return success(projects)
  }

  @Get('/list')
  @SetHeader('Cache-Control', 'nostore')
  public async get_list(
    @SessionUser() user: SessionUser,
    @Query('skip', DefaultValuePipe(0), ParseNumberPipe) skip: number,
    @Query('limit', DefaultValuePipe(100), ParseNumberPipe({ nullable: true })) limit?: number,
    @Query('search') search?: string
  ): Promise<ApiResponse<PageRes<PhoneNumberShort>>> {
    let conditions: any = generateManagedNumberFilter(user)
    if (search) {
      conditions = {
        AND: [
          {
            OR: [
              { number: { contains: search } },
              { alias_for_number: { contains: search } },
              { name: { contains: search } },
            ],
          },
          conditions,
        ],
      }
    }
    const phone_numbers: any = await getPrisma().phoneNumber.findMany({
      where: conditions,
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
        manage_by: true,
      },
      skip,
      take: limit,
      orderBy: {
        number: 'asc',
      },
    })
    const count: any = await getPrisma().phoneNumber.count({ where: conditions })

    return success({
      skip,
      total: count,
      data: phone_numbers.map((n: any) => {
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
          groups: n.groups.map((g: any) => g.group.name),
          manage_by: n.manage_by?.name,
        }
      }),
    })
  }

  @Post()
  public async create_one(
    @SessionUser() user: SessionUser,
    @Body() body: CreatePhoneNumberInput
  ): Promise<ApiResponse<PhoneNumber>> {
    let manage_group: string | undefined = undefined
    if (user.role == UserRole.SUPPER_ADMIN) {
      //
    } else if (user.role == UserRole.ADMIN && user.groups.length > 0) {
      manage_group = user.groups[0].group_id
    } else {
      return { status: false, error: 'NO_PERMISSION' }
    }

    const client = getPrisma()
    const phone_number = await client.phoneNumber.upsert({
      where: { number: body.number },
      update: {},
      create: {
        number: body.number,
        name: body.name,
        password: body.password,
        manage_by_id: manage_group,
      },
    })
    return success(phone_number)
  }

  @Put('/:number')
  @SetHeader('Cache-Control', 'nostore')
  public async update_one(
    @SessionUser() user: SessionUser,
    @Param('number') number: string,
    @Body() body: UpdatePhoneNumberInput
  ): Promise<ApiResponse<PhoneNumberInfo>> {

    console.log("this is", body);
    
    const phone_number = await getPrisma().phoneNumber.findFirst({
      where: { number },
      include: { push_tokens: true, groups: { include: { group: true } } },
    })
    if (!phone_number) {
      throw new NotFoundException('Number not found')
    }

    console.log('123321', phone_number)

    if (!checkNumberManagePermission(user, phone_number)) {
      return { status: false, error: 'NO_PERMISSION' }
    }

    const manage_group = await getPrisma().group.findFirst({ where: { name: body.manage_by } })
    if (!!body.manage_by && !manage_group) {
      throw new NotFoundException('Manage group not found')
    }

    const groupFromBody = await getPrisma().group.findMany({where: {
      name: {
        in: body.groups,
      }
    }})

    const groupDiffFromDB =  phone_number.groups.filter((object1 :any)=> {
      return !groupFromBody.some((object2:any) => {
        return object1.group_id === object2.id;
      });
    });

    const groupDiffFromReq = groupFromBody.filter((object1 :any)=> {
      return !phone_number.groups.some((object2:any) => {
        return object1.id === object2.group_id;
      });
    });

    if(groupDiffFromDB.length > 0){
      await getPrisma().phoneNumbersOnGroups.deleteMany({
        where: {
          group_id: {
            in: groupDiffFromDB.map(x => x.group_id)
          },
          number_id: number
        }
      })
    }

    if(groupDiffFromReq.length > 0) {
      await getPrisma().phoneNumbersOnGroups.createMany({
        data: groupDiffFromReq.map(x => {
          return {
            number_id: number,
            group_id: x.id,
            assigned_by: user.id
          }
        })
      })
    }

    let groupAfterUpdate : string[] | undefined | any

    if(groupDiffFromDB.length < 1 && groupDiffFromReq.length < 1){
      groupAfterUpdate = body.groups
    } else {

      const getAllUserGroup = await getPrisma().phoneNumbersOnGroups.findMany({
        where: {
          number_id : number
        }, include: {group: true}
      })
      groupAfterUpdate = getAllUserGroup.map(ele => ele.group.name)
      
    }


    
    

    const number_updated: any = await getPrisma().phoneNumber.update({
      where: { number },
      data: {
        name: body.name,
        sip_in: body.sip_in,
        sip_out: body.sip_out,
        alias_for_number: body.alias_for_number,
        avatar: body.avatar,
        password: body.password,
        updated_at: new Date(),
        state: body.state,
        manage_by_id: manage_group?.id,
      },
    })

    return success({
      number: number_updated.number,
      name: number_updated.name,
      sip_in: number_updated.sip_in,
      sip_out: number_updated.sip_out,
      alias_for_number: number_updated.alias_for_number,
      password: number_updated.password,
      created_at: number_updated.created_at.getTime(),
      updated_at: number_updated.updated_at?.getTime(),
      push_tokens: phone_number.push_tokens,
      groups: groupAfterUpdate,
      state: number_updated.state,
    })
  }
}

export default createHandler(PhoneNumberRouter)
