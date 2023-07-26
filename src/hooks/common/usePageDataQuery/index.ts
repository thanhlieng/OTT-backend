import axios from 'axios'
import qs from 'qs'
import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

const PAGE_SIZE = 10

type Arg = {
  url: string
  page?: number | string
  page_size?: number | string
  dependencies: any[]
  query?: any
  enabled?: boolean
}

export const usePageDataQuery = (arg: Arg) => {
  const fetcher = useCallback(async () => {
    const page_size = arg.page_size || PAGE_SIZE
    const limit = page_size
    const skip = Number(arg.page || 0) * Number(page_size)
    const query = qs.stringify({
      limit,
      skip,
      ...(arg.query || {}),
    })
    const res = await axios.get(`${arg.url}${query ? `?${query}` : ''}`)
    return res?.data?.data || null
  }, [arg])

  const fn = useQuery([...arg.dependencies], fetcher, {
    refetchOnWindowFocus: false,
    retry: 5,
    enabled: arg.enabled,
  })
  return {
    ...fn,
  }
}
