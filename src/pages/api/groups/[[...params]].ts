import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator'
import {
    Body,
    Catch, createHandler, DefaultValuePipe, Get, NotFoundException, Param, ParseNumberPipe, Post, Put, Query, SetHeader
} from 'next-api-decorators'

import { Group, PhoneNumbersOnGroups } from '@prisma/client'
import { ApiExceptionHandler, ApiResponse, error, NextAuthGuard, SessionUser, success } from '@/lib/api_helper'
import { getPrisma } from '@/lib/database'
import { PageRes } from '@/utils/request'
import { PhoneNumberShort } from '../phone_numbers/[[...params]]'
import { UserRole } from '@/types'
import { checkGroupManagePermission, generateGroupFilter } from '@/lib/permission'
import { env } from '@/constants/env'

export interface GroupInfo {
    id: string;
    name: string;
    after_call_feedback?: string;
    bluesea_api?: string;
    bluesea_gateway?: string;
    bluesea_token?: string;
    bluesea_record?: boolean;
    created_at: number;
    updated_at: number;
    numbers: number;
}

export interface GroupShort {
    id: string;
    name: string;
    after_call_feedback?: string;
    created_at: number;
    updated_at: number;
    numbers: number;
}

export interface GroupAdmin {
    id: string;
    email: string;
    assigned_at: Date;
    assigned_by: string;
}

export class CreateGroupInput {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    after_call_feedback?: string;
}

export class AddNumberToGroup {
    @IsString()
    @IsNotEmpty()
    number!: string;
}

export class AddAdminToGroup {
    @IsString()
    @IsNotEmpty()
    email!: string;
}

export class DeleteNumberFromGroup {
    @IsString()
    @IsNotEmpty()
    number!: string;
}

export class DeleteAdminFromGroup {
    @IsString()
    @IsNotEmpty()
    email!: string;
}

export class UpdateGroupInput {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsUrl()
    @IsOptional()
    after_call_feedback?: string;

    @IsString()
    @IsUrl()
    @IsOptional()
    bluesea_api?: string;

    @IsString()
    @IsUrl()
    @IsOptional()
    bluesea_gateway?: string;

    @IsString()
    @IsOptional()
    bluesea_token?: string;

    @IsBoolean()
    @IsOptional()
    bluesea_record?: boolean;
}

@NextAuthGuard()
@Catch(ApiExceptionHandler)
class GroupRouter {
    @Get('/one/:id')
    @SetHeader('Cache-Control', 'nostore')
    public async get_one(@SessionUser() user: SessionUser, @Param('id') id: string): Promise<ApiResponse<GroupInfo>> {
        if(!checkGroupManagePermission(user, id)) {
            return error('NO_PERMISSION')
        }

        const group: any = await getPrisma().group.findFirst({ where: { id }, include: { _count: { select: { numbers: true } } } })
        if (!group) {
            throw new NotFoundException('Group not found')
        }
        return success({
            id: id,
            name: group.name,
            after_call_feedback: group.after_call_feedback,
            bluesea_api: group.bluesea_api,
            bluesea_gateway: group.bluesea_gateway,
            bluesea_token: group.bluesea_token,
            bluesea_record: group.bluesea_record,
            hook: `${env.NEXTAUTH_URL}/api/bluesea/hook?group=${id}&token=${env.HOOK_TOKEN}`,
            created_at: group.created_at.getTime(),
            updated_at: group.updated_at?.getTime(),
            numbers: group._count.numbers
        })
    }

    @Get('/count')
    @SetHeader('Cache-Control', 'nostore')
    public async count(
        @SessionUser() user: SessionUser
    ): Promise<ApiResponse<number>> {
        const conditions = generateGroupFilter(user)
        const projects = await getPrisma().group.count({
            where: conditions
        })
        return success(projects)
    }

    @Get('/list')
    @SetHeader('Cache-Control', 'nostore')
    public async get_list(
        @SessionUser() user: SessionUser,
        @Query('skip', DefaultValuePipe(0), ParseNumberPipe) skip: number,
        @Query('limit', DefaultValuePipe(100), ParseNumberPipe({ nullable: true })) limit?: number,
        @Query('search') search?: string,
    ): Promise<ApiResponse<PageRes<GroupShort>>> {
        let conditions: any = generateGroupFilter(user)
        if(search) {
            conditions = {
                AND: [
                    {
                        OR: [
                            { name: { contains: search } },
                        ]
                    },
                    conditions
                ]
            }
        }
        const groups: any = await getPrisma().group.findMany({
            where: conditions,
            include: {
                _count: {
                    select: {
                        numbers: true
                    }
                }
            },
            skip,
            take: limit,
        })
        const count: any = await getPrisma().group.count({ where: conditions })

        return success({
            skip,
            total: count,
            data: groups.map((n: { id: any; name: any; after_call_feedback: any; created_at: { getTime: () => any }; updated_at: { getTime: () => any }; _count: { numbers: any } }) => {
                return {
                    id: n.id,
                    name: n.name,
                    after_call_feedback: n.after_call_feedback,
                    created_at: n.created_at.getTime(),
                    updated_at: n.updated_at?.getTime(),
                    numbers: n._count.numbers
                }
            })
        })
    }

    @Post()
    public async create_one(@SessionUser() user: SessionUser, @Body() body: CreateGroupInput): Promise<ApiResponse<Group>> {
        const client = getPrisma()
        const group = await client.group.create({ data: { name: body.name, after_call_feedback: body.after_call_feedback } });
        return success(group)
    }

    @Get('/:id/admins')
    public async get_admins(
        @SessionUser() user: SessionUser, 
        @Param('id') id: string,
        @Query('skip', DefaultValuePipe(0), ParseNumberPipe) skip: number,
        @Query('limit', DefaultValuePipe(100), ParseNumberPipe({ nullable: true })) limit?: number,
    ): Promise<ApiResponse<PageRes<GroupAdmin>>> {
        if(!checkGroupManagePermission(user, id)) {
            return { status: false, error: 'NO_PERMISSION' }
        }

        const where = {
            groups: {
                some: {
                    group_id: id
                }
            }
        };
        const admins: any = await getPrisma().user.findMany({
            where,
            include: {
                groups: {
                    where: {
                        group_id: id
                    }
                }
            },
            skip,
            take: limit,
        })
        const count = await getPrisma().user.count({ where })

        return success({
            skip,
            total: count,
            data: admins.map((a: any) => {
                return {
                    id: a.id,
                    email: a.email,
                    assigned_at: a.groups[0].assigned_at,
                    assigned_by: a.groups[0].assigned_by,
                }
            })
        })
    }

    @Get('/:id/numbers')
    public async get_numbers(
        @SessionUser() user: SessionUser, 
        @Param('id') id: string,
        @Query('skip', DefaultValuePipe(0), ParseNumberPipe) skip: number,
        @Query('limit', DefaultValuePipe(100), ParseNumberPipe({ nullable: true })) limit?: number,
    ): Promise<ApiResponse<PageRes<PhoneNumberShort>>> {
        if(!checkGroupManagePermission(user, id)) {
            return { status: false, error: 'NO_PERMISSION' }
        }

        const where = {
            groups: {
                some: {
                    group_id: id
                }
            }
        };
        const phone_numbers: any = await getPrisma().phoneNumber.findMany({
            where,
            include: {
                _count: {
                    select: {
                        push_tokens: true
                    }
                },
                groups: {
                    include: {
                        group: true
                    }
                },
                manage_by: true
            },
            skip,
            take: limit,
        })
        const count: any = await getPrisma().phoneNumber.count({ where })

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
            })
        })
    }

    @Post('/:id/add_admin')
    public async add_admin(@SessionUser() user: SessionUser, @Param('id') id: string, @Body() body: AddAdminToGroup): Promise<ApiResponse<string>> {
        if(!checkGroupManagePermission(user, id)) {
            return { status: false, error: 'NO_PERMISSION' }
        }

        const client = getPrisma()
        const admin = await client.user.findUnique({ where: { email: body.email } })
        if(!admin) {
            return error('Admin not found')
        }
        await client.adminsOnGroups.create({ data: { group_id: id, user_id: admin.id, assigned_by: user.id } })
        return success('OK')
    }

    // Only supper admin can call
    @Post('/:id/manage_number')
    public async manage_number(@SessionUser() user: SessionUser, @Param('id') id: string, @Body() body: AddNumberToGroup): Promise<ApiResponse<string>> {
        if(user.role !== UserRole.SUPPER_ADMIN) {
            return { status: false, error: 'NO_PERMISSION' }
        }

        const client = getPrisma()
        const res = await client.phoneNumber.updateMany({ where: { number: body.number }, data: { manage_by_id: id }});
        if(res.count == 0) {
            return error('Phone number or group not found')
        }
        return success('ok')
    }

    @Post('/:id/add_number')
    public async add_number(@SessionUser() user: SessionUser, @Param('id') id: string, @Body() body: AddNumberToGroup): Promise<ApiResponse<PhoneNumbersOnGroups>> {
        if(!checkGroupManagePermission(user, id)) {
            return { status: false, error: 'NO_PERMISSION' }
        }

        const client = getPrisma()
        if(await client.phoneNumber.count({ where: { number: body.number }}) == 0) {
            return error('Phone number not found')
        }
        if (await client.phoneNumbersOnGroups.count({ where: { group_id: id, number_id: body.number } }) > 0) {
            return error('Already added')
        }
        const group = await client.phoneNumbersOnGroups.create({ data: { group_id: id, number_id: body.number, assigned_by: user.id } })
        return success(group)
    }

    @Post('/:id/delete_admin')
    public async delete_admin(@SessionUser() user: SessionUser, @Param('id') id: string, @Body() body: DeleteAdminFromGroup): Promise<ApiResponse<{}>> {
        if(!checkGroupManagePermission(user, id)) {
            return { status: false, error: 'NO_PERMISSION' }
        }

        const client = getPrisma()
        const admin = await client.user.findUnique({ where: { email: body.email } })
        const deleted = await client.adminsOnGroups.deleteMany({ where: { group_id: id, user_id: admin?.id } })
        if(deleted.count > 0) {
            return success({})
        } else {
            return error('Phone not found')
        }
    }

    @Post('/:id/delete_number')
    public async delete_number(@SessionUser() user: SessionUser, @Param('id') id: string, @Body() body: DeleteNumberFromGroup): Promise<ApiResponse<{}>> {
        if(!checkGroupManagePermission(user, id)) {
            return { status: false, error: 'NO_PERMISSION' }
        }

        const client = getPrisma()
        const deleted = await client.phoneNumbersOnGroups.deleteMany({ where: { group_id: id, number_id: body.number } })
        if(deleted.count > 0) {
            return success({})
        } else {
            return error('Phone not found')
        }
    }

    @Put('/:id')
    @SetHeader('Cache-Control', 'nostore')
    public async update_one(@SessionUser() user: SessionUser, @Param('id') id: string, @Body() body: UpdateGroupInput): Promise<ApiResponse<GroupInfo>> {
        if(!checkGroupManagePermission(user, id)) {
            return { status: false, error: 'NO_PERMISSION' }
        }

        const group = await getPrisma().group.findFirst({ where: { id }, include: { _count: { select: { numbers: true } } } })
        if (!group) {
            throw new NotFoundException('Number not found')
        }

        const group_updated: any = await getPrisma().group.update({
            where: { id }, data: {
                name: body.name,
                after_call_feedback: body.after_call_feedback,
                bluesea_api: body.bluesea_api,
                bluesea_gateway: body.bluesea_gateway,
                bluesea_token: body.bluesea_token,
                bluesea_record: body.bluesea_record,
                updated_at: new Date()
            }
        })

        return success({
            id: group_updated.id,
            name: group_updated.name,
            created_at: group_updated.created_at.getTime(),
            updated_at: group_updated.updated_at?.getTime(),
            numbers: group._count.numbers
        })
    }
}

export default createHandler(GroupRouter)
