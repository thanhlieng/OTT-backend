import { PhoneNumber } from "@prisma/client";
import { UserRole } from "@/types";
import { SessionUser } from "./api_helper";

export const checkNumberManagePermission = (user: SessionUser, number: PhoneNumber) => {
    if(user.role == UserRole.SUPPER_ADMIN) {
        return true
    }
    if(user.role == UserRole.ADMIN) {
        if(user.groups.map(g => g.group_id).includes(number.manage_by_id || '')) {
            return true
        }
    }
    return false
}

export const checkGroupManagePermission = (user: SessionUser, group_id: string) => {
    if(user.role == UserRole.SUPPER_ADMIN) {
        return true
    }
    if(user.role == UserRole.ADMIN) {
        const group_ids = user.groups.map(g => g.group_id)
        if(group_ids.includes(group_id)) {
            return true
        }
    }
    return false
}

export const generateGroupFilter = (user: SessionUser) => {
    if(user.role == UserRole.SUPPER_ADMIN) {
        return {}
    }
    if(user.role == UserRole.ADMIN) {
        return {
            admins: {
                some: {
                    user_id: user.id
                }
            }
        }
    }
    return {
        id: "none"
    }
}