import axios from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useApp } from '@/components'

type Arg = {
  url: string
  method: 'POST' | 'PUT' | 'DELETE'
  data?: any
}

export const useActionMutation = ({
  dependencies,
  refetchQueries,
}: {
  dependencies: string[]
  refetchQueries?: string[]
}) => {
  const { message } = useApp()
  const queryClient = useQueryClient()

  const fetcher = async (arg: Arg) => {
    const res = await axios({
      method: arg.method,
      url: arg.url,
      data: {
        ...arg.data,
      },
    })
    return res.data
  }

  const fn = useMutation(dependencies, {
    mutationFn: fetcher,
    onSuccess: (res) => {
      refetchQueries && queryClient.refetchQueries(refetchQueries)
      if (res?.error) {
        message.error(res?.error)
        return
      }
      message.success('Success')
    },
    onError: () => {
      message.error('Something went wrong. Please try again later')
    },
    retry: false,
  })
  return { ...fn }
}
