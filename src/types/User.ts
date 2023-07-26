export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
    SUPPER_ADMIN = "SUPPER_ADMIN",
}

export const AllowUserManagerRole = (role: UserRole | string) => {
    return [UserRole.ADMIN, UserRole.SUPPER_ADMIN].indexOf(role as UserRole) >= 0
}

export const AllowSatelliteGenerate = (role: UserRole | string) => {
    return [UserRole.SUPPER_ADMIN].indexOf(role as UserRole) >= 0
}

export const AllowGetAllTransactions = (role: UserRole | string) => {
    return [UserRole.ADMIN, UserRole.SUPPER_ADMIN].indexOf(role as UserRole) >= 0
}

export enum UserStatus {
    INACTIVE = "INACTIVE",
    ACTIVED = "ACTIVED",
}

export const AllowApiStatus = (status: UserStatus | string) => {
    return [UserStatus.ACTIVED].indexOf(status as UserStatus) >= 0
}

export type UserInfo = {
    id: string,
    email: string,
    image?: string,
    created_at: number,
    status: UserStatus,
    role: UserRole,
}
