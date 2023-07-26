import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { getPrisma } from "./database";

export async function getUser(req: NextApiRequest) {
    const token = await getToken({req})
    if(token) {
        return getPrisma().user.findUnique({where: {id: token.sub}})
    }
}