import { AdminsOnGroups, Group } from "@prisma/client";
import { env } from "@/constants/env";
import { AllowApiStatus, UserRole, UserStatus } from "@/types";
import { base64url, jwtDecrypt } from "jose";
import { NextApiRequest, NextApiResponse } from "next";
import { createMiddlewareDecorator, createParamDecorator, NextFunction, UnauthorizedException } from "next-api-decorators";
import { getToken } from "next-auth/jwt";
import { getPrisma } from "./database";

export interface SessionUser {
    id: string,
    name: string,
    email: string,
    role: UserRole,
    status: UserStatus,
    groups: AdminsOnGroups[],
}

export interface SessionPhoneNumber {
    number: string,
    sip_out: boolean,
    name?: string,
    avatar?: string,
    groups: Group[],
    manage_by_id?: string,
}

export interface ApiResponse<T> {
    status: boolean,
    data?: T
    error?: string,
    message?: string,
}

export function success<T>(data: T): ApiResponse<T> {
    return { status: true, data }
}

export function error(error: string, message?: string): ApiResponse<any> {
    return { status: false, error, message }
}

declare module 'next' {
    interface NextApiRequest {
        user: SessionUser
    }
}

declare module 'next' {
    interface NextApiRequest {
        number: SessionPhoneNumber
    }
}

export const SessionUser = createParamDecorator<SessionUser>(
    req => req.user
);

export const SessionPhoneNumber = createParamDecorator<SessionPhoneNumber>(
    req => req.number
);

export function ApiExceptionHandler(
    error: unknown,
    req: NextApiRequest,
    res: NextApiResponse
) {
    console.error(error)
    const error_str = error instanceof Error ? error.message : 'An unknown error occurred.'
    res.status(200).json({ status: false, error: error_str })
}

export const NextAuthNumberGuard = createMiddlewareDecorator(async (req: NextApiRequest, _res: NextApiResponse, next: NextFunction) => {
    if (req.query.service_token) {
        if (req.query.service_token !== env.SIP_SERVICE_TOKEN) {
            throw new UnauthorizedException()
        }
        const number = req.query.phone_number as string
        if (!number) {
            throw new UnauthorizedException()
        }
        const phone_number = await getPrisma().phoneNumber.findUnique({ where: { number }, include: { groups: { include: { group: true } } } })
        if (phone_number) {
            // @ts-ignore
            req.number = {
                ...phone_number,
                groups: phone_number.groups.map((g: { group: any }) => g.group)
            }
        } else {
            req.number = {
                number,
                sip_out: true,
                groups: []
            };
        }
        return next();
    }

    const token = await jwtDecrypt(req.query.token as string, base64url.decode(env.JWT_SECRET), { issuer: 'call' })
    if (!token || !token.payload.number) {
        throw new UnauthorizedException()
    }
    const phone_number = await getPrisma().phoneNumber.findUnique({ where: { number: token.payload.number as string }, include: { groups: { include: { group: true }}} });
    if (!phone_number) {
        throw new UnauthorizedException()
    }

    // @ts-ignore
    req.number = {
        ...phone_number,
        groups: phone_number.groups.map((g: { group: any }) => g.group)
    }
    return next()
})

export const NextAuthGuard = createMiddlewareDecorator(async (req: NextApiRequest, res: NextApiResponse, next: NextFunction) => {
    const token = await getToken({ req, secret: env.JWT_SECRET })
    if (!token || !token.name) {
        throw new UnauthorizedException();
    }
    const user = await getPrisma().user.findUnique({ where: { id: token.sub }, include: { groups: true } })
    if (!user) {
        throw new UnauthorizedException();
    }
    if (user.email == env.SUPPER_ADMIN_EMAIL && user.status != UserStatus.ACTIVED && user.role != UserRole.SUPPER_ADMIN) {
        await getPrisma().user.update({
            where: { id: user.id },
            data: {
                status: UserStatus.ACTIVED,
                role: UserRole.SUPPER_ADMIN,
            }
        })
        user.status = UserStatus.ACTIVED
        user.role = UserRole.SUPPER_ADMIN
    }
    if (!AllowApiStatus(user.status)) {
        throw new UnauthorizedException()
    }

    req.user = { 
        id: token.sub || '', 
        name: token.name, 
        email: token.email || '', 
        role: user.role as UserRole, 
        status: user.status as UserStatus,
        groups: user.groups,
    }
    return next()
});