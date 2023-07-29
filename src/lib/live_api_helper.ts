import { getPrisma } from './database'
import request from 'request'
import { env } from '@/constants/env'

export interface BlueseConfig {
  bluesea_api: string
  bluesea_gateways: string[]
  bluesea_token: string
  bluesea_record: boolean
}

export async function callLiveApi<T>(api: string, api_path: string, token: string, body: any): Promise<T> {
  const url = `${api}/app/${api_path}?app_secret=${token}`
  const options = {
    method: 'POST',
    url: url,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
  console.log('12321321321', url)

  return await new Promise((resolve, reject) => {
    request(options, function (error: any, response: any) {
      if (error) {
        return reject(new Error(error))
      }
      try {
        const data = JSON.parse(response.body)
        if (data.status === true) {
          resolve(data.data)
        } else {
          reject(new Error(data.message || data.error || 'Unknown error'))
        }
      } catch (err) {
        reject(err)
      }
    })
  })
}

export async function callGatewayApi<T>(gateway: string, api_path: string, body: any): Promise<T> {
  const url = `${gateway}/${api_path}`
  const options = {
    method: 'POST',
    url: url,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
  return await new Promise((resolve, reject) => {
    request(options, function (error: any, response: any) {
      if (error) {
        return reject(new Error(error))
      }
      try {
        const data = JSON.parse(response.body)
        if (data.status === true) {
          resolve(data.data)
        } else {
          reject(new Error(data.message || data.error || 'Unknown error'))
        }
      } catch (err) {
        console.log('Parse error', url, response.body, err)
        reject(err)
      }
    })
  })
}

export async function createLiveWebrtcToken(room: string, peer: string, config: BlueseConfig): Promise<string> {
  const res = await callLiveApi<{ token: string }>(config.bluesea_api, 'webrtc_session', config.bluesea_token, {
    room,
    peer,
    record: config.bluesea_record,
  })
  return res.token
}

export async function createComposeToken(room: string, config: BlueseConfig): Promise<string> {
  const res = await callLiveApi<{ token: string }>(config.bluesea_api, 'compose_session', config.bluesea_token, {
    room,
  })
  return res.token
}

export async function submitComposeRecord(source: string, token: string, config: BlueseConfig): Promise<string> {
  const res = await callGatewayApi<string>(config.bluesea_gateways[0], 'compose/submit', {
    token,
    source,
  })
  return res
}

export async function getBlueseaConfig(group?: string): Promise<BlueseConfig> {
  console.log('2323', env.BLUESEA_GATEWAYS, group)

  if (group) {
    const prisma = getPrisma()
    const group_info = await prisma.group.findUnique({
      where: { id: group },
      select: { bluesea_api: true, bluesea_gateway: true, bluesea_token: true, bluesea_record: true },
    })
    if (!!group_info && !!group_info.bluesea_api && !!group_info.bluesea_gateway && !!group_info.bluesea_token) {
      return {
        bluesea_api: group_info.bluesea_api,
        bluesea_gateways: group_info.bluesea_gateway.split(';'),
        bluesea_token: group_info.bluesea_token,
        bluesea_record: !!group_info.bluesea_record,
      }
    }
  }

  return {
    bluesea_api: env.BLUESEA_API,
    bluesea_gateways: [env.BLUESEA_GATEWAYS],
    bluesea_token: env.BLUESEA_TOKEN,
    bluesea_record: env.BLUESEA_RECORD,
  }
}
