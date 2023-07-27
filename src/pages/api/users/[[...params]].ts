import { IsEnum } from 'class-validator'
import {
  Body,
  Catch,
  createHandler,
  DefaultValuePipe,
  Get,
  Param,
  ParseNumberPipe,
  Post,
  Put,
  Query,
  SetHeader,
} from 'next-api-decorators'
import { ApiExceptionHandler, ApiResponse, NextAuthGuard, SessionUser, success } from '@/lib/api_helper'
import { getPrisma } from '@/lib/database'
import { genHashPass } from '@/lib/hash_helper'
import { AllowUserManagerRole, UserInfo, UserRole, UserStatus } from '@/types'
import { PageRes } from '@/utils/request'

export class UpdateUserStatusInput {
  @IsEnum(UserStatus)
  status!: string
}

export class UpdateUserRoleInput {
  @IsEnum(UserRole)
  role!: string
}

export class CreateUser {
  @IsEnum(UserRole)
  username!: string
  name!: string
  password!: string
  email?: string
}

@NextAuthGuard()
@Catch(ApiExceptionHandler)
class UserRouter {
  @Get('')
  @SetHeader('Cache-Control', 'nostore')
  public async get_list_tiny(
    @SessionUser() user: SessionUser,
    @Query('skip', DefaultValuePipe(0), ParseNumberPipe) skip: number,
    @Query('limit', DefaultValuePipe(100), ParseNumberPipe({ nullable: true })) limit?: number,
    @Query('search') search?: string
  ): Promise<ApiResponse<PageRes<UserInfo>>> {
    if (!AllowUserManagerRole(user.role)) {
      return { status: false, error: 'NO_PERMISSION' }
    }
    let conditions: any = {}
    if (search) {
      conditions = {
        AND: [
          {
            OR: [{ name: { contains: search } }],
          },
          conditions,
        ],
      }
    }
    const users = await getPrisma().user.findMany({
      where: conditions,
      skip,
      take: limit,
    })
    console.group(JSON.stringify(users))
    const count = await getPrisma().user.count()

    // @ts-ignore
    return success({
      skip,
      total: count,
      data: users.map((u: any) => {
        return {
          id: u.id,
          email: u.email,
          image: u.image,
          status: u.status as UserStatus,
          created_at: u.created_at.getTime(),
          role: u.role as UserRole,
        }
      }),
    })
  }

  @Get('/:id')
  @SetHeader('Cache-Control', 'nostore')
  public async get_one(@SessionUser() user: SessionUser, @Param('id') id: string): Promise<ApiResponse<UserInfo>> {
    if (!AllowUserManagerRole(user.role)) {
      return { status: false, error: 'NO_PERMISSION' }
    }

    const target_user: any = await getPrisma().user.findUnique({
      where: { id },
    })

    // @ts-ignore
    return success({
      id: target_user.id,
      email: target_user.email,
      created_at: target_user.created_at.getTime(),
      status: target_user.status as UserStatus,
      role: target_user.role as UserRole,
    })
  }

  @Put('/:id/status')
  @SetHeader('Cache-Control', 'nostore')
  public async update_status(
    @SessionUser() user: SessionUser,
    @Param('id') id: string,
    @Body() body: UpdateUserStatusInput
  ): Promise<ApiResponse<any>> {
    if (!AllowUserManagerRole(user.role)) {
      return { status: false, error: 'NO_PERMISSION' }
    }
    if (user.id == id) {
      return { status: false, error: 'CANNOT_UPDATE_STATUS_YOURSELF' }
    }
    const target_user = await getPrisma().user.findUnique({ where: { id } })
    if (target_user?.role === UserRole.SUPPER_ADMIN && user.role === UserRole.ADMIN) {
      return { status: false, error: 'NO_PERMISSION' }
    }
    await getPrisma().user.update({ where: { id }, data: { status: body.status } })
    return success({})
  }

  @Post('/create')
  // @SetHeader('Cache-Control', 'nostore')
  public async create_admin(@Body() body: CreateUser): Promise<ApiResponse<any>> {
    console.log(body)
    const target_user = await getPrisma().user.findUnique({ where: { username: body.username } })
    if (target_user) {
      return { status: false, error: 'EXISTED' }
    }
    const hashed_password = await genHashPass(body.password)
    const data = { ...body, password: hashed_password }
    await getPrisma().user.create({
      data,
    })
    return success({})
  }

  @Put('/:id/role')
  @SetHeader('Cache-Control', 'nostore')
  public async update_admin(
    @SessionUser() user: SessionUser,
    @Param('id') id: string,
    @Body() body: UpdateUserRoleInput
  ): Promise<ApiResponse<any>> {
    if (user.role !== UserRole.SUPPER_ADMIN) {
      return { status: false, error: 'NO_PERMISSION' }
    }
    if (user.id == id) {
      return { status: false, error: 'CANNOT_UPDATE_STATUS_YOURSELF' }
    }
    const target_user = await getPrisma().user.findUnique({ where: { id } })
    if (target_user?.role === UserRole.SUPPER_ADMIN) {
      return { status: false, error: 'NO_PERMISSION' }
    }
    await getPrisma().user.update({
      where: { id },
      data: {
        role: body.role,
      },
    })
    return success({})
  }
}

export default createHandler(UserRouter)
