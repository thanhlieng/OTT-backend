import { IsNotEmpty, IsString } from 'class-validator'
import {
    Body,
    Catch, createHandler, DefaultValuePipe, Get, ParseNumberPipe, Post, Query
} from 'next-api-decorators'

import { ApiExceptionHandler, ApiResponse, error, NextAuthNumberGuard, SessionPhoneNumber, success } from '@/lib/api_helper'
import { getPrisma } from '@/lib/database'
import { PageRes } from '@/utils/request'

export interface FavoriteInfo {
    id: string;
    number: string;
    created_at: number;
}

export class AddNumbersToFavorite {
    @IsString()
    @IsNotEmpty()
    numbers!: string[];
}

export class DeleteNumberFromFavorite {
    @IsString()
    @IsNotEmpty()
    number!: string;
}

@NextAuthNumberGuard()
@Catch(ApiExceptionHandler)
class FavoriteRouter {
    @Get("/numbers")
    public async get_numbers(
        @SessionPhoneNumber() number: SessionPhoneNumber,
        @Query('skip', DefaultValuePipe(0), ParseNumberPipe) skip: number,
        @Query('limit', DefaultValuePipe(100), ParseNumberPipe({ nullable: true })) limit?: number,
    ): Promise<ApiResponse<PageRes<FavoriteInfo>>> {
        const where = {
            number_id: number.number
        };
        const phone_numbers = await getPrisma().numbersInFavorites.findMany({
            where,
            orderBy: {
                created_at: 'asc'
            },
            skip,
            take: limit,
        })
        const count = await getPrisma().numbersInFavorites.count({ where })

        return success({
            skip,
            total: count,
            data: phone_numbers.map((n: any) => {
                return {
                    id: n.id,
                    number: n.contact_id,
                    created_at: n.created_at.getTime()
                }
            })
        })
    }

    @NextAuthNumberGuard()
    @Post("/add_numbers")
    public async add_numbers(
        @SessionPhoneNumber() number: SessionPhoneNumber,
        @Body() body: AddNumbersToFavorite,
    ): Promise<ApiResponse<number>> {
        const client = getPrisma()
        const favorite = await client.numbersInFavorites.createMany({
            data: body.numbers.map((n) => {
                return {
                    number_id: number.number,
                    contact_id: n
                }
            })
        })
        return success(favorite.count)
    }

    @NextAuthNumberGuard()
    @Post("/delete_number")
    public async delete_number(
        @SessionPhoneNumber() number: SessionPhoneNumber,
        @Body() body: DeleteNumberFromFavorite
    ): Promise<ApiResponse<{}>> {
        const client = getPrisma()
        const deleted = await client.numbersInFavorites.deleteMany({ where: { number_id: number.number, contact_id: body.number } })
        if(deleted.count > 0) {
            return success({})
        } else {
            return error("Phone not found")
        }
    }
}

export default createHandler(FavoriteRouter)
