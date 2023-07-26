import { useEffect, useState } from 'react'

export interface RequestResponse<T> {
  status: boolean
  error?: string
  message?: string
  data?: T
}

export interface PageRes<T> {
  skip: number
  total: number
  data: T[]
}

export async function postData<T>(uri: string, data: any): Promise<T> {
  const res = await fetch(uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const res_json: RequestResponse<T> = await res.json()
  if (!res_json.status) {
    throw new Error(res_json.error)
  }
  return res_json.data || ({} as T)
}

export async function putData<T>(uri: string, data: any): Promise<T> {
  const res = await fetch(uri, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const res_json: RequestResponse<T> = await res.json()
  if (!res_json.status) {
    throw new Error(res_json.error)
  }
  return res_json.data || ({} as T)
}

export async function getData<T>(uri: string): Promise<T> {
  const res = await fetch(uri, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const res_json: RequestResponse<T> = await res.json()
  if (!res_json.status) {
    throw new Error(res_json.error)
  }
  return res_json.data || ({} as T)
}

type SwrRes<T> = [T | undefined, string | undefined, boolean]
export function useApi<T>(url: string, interval_ms?: number): SwrRes<T> {
  const [res, setRes] = useState([undefined, undefined, true] as SwrRes<T>)
  useEffect(() => {
    const load = async () => {
      try {
        const data_raw = await fetch(url)
        const data: RequestResponse<T> = await data_raw.json()
        if (data.status) {
          setRes([data.data, undefined, false])
        } else {
          setRes([undefined, data.message || data.error || 'Unknown error', false])
        }
      } catch (error) {
        setRes([undefined, error instanceof Error ? error.message : 'Unknown error', false])
      }
    }
    load()
    if (interval_ms) {
      const interval = setInterval(load, interval_ms)
      return () => {
        clearInterval(interval)
      }
    }
  }, [url, interval_ms, setRes])
  return res
}

type SwrPageRes<T> = [{ data: T[]; page: number; total: number } | undefined, string | undefined, boolean]
export function usePageApi<T>(
  url: string,
  query: any,
  page: number,
  page_size: number,
  interval_ms?: number
): SwrPageRes<T> {
  const connector = url.includes('?') ? '&' : '?'
  const [res, error, loading] = useApi<PageRes<T>>(
    url +
      connector +
      'limit=' +
      page_size +
      '&skip=' +
      page * page_size +
      (Object.keys(query).length > 0 ? '&' + new URLSearchParams(query).toString() : ''),
    interval_ms
  )
  return [res ? { data: res.data, page: res.skip / page_size, total: res.total } : undefined, error, loading]
}
