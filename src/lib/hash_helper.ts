import bcrypt from 'bcrypt'
import { isEmpty } from 'lodash'

const SALT_ROUND = 11

export async function genHashPass(pass: string | Buffer) {
  if (isEmpty(pass)) return
  const salt = bcrypt.genSaltSync(SALT_ROUND)
  const hashedPass = bcrypt.hashSync(pass, salt)
  return hashedPass
}

export async function comparePass(pass: string | Buffer, hashed: string) {
  if (isEmpty(pass)) return
  return await bcrypt.compare(pass, hashed)
}
