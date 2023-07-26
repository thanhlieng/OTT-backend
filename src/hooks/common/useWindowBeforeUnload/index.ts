import { useCallback, useEffect } from 'react'

export const useWindowBeforeUnload = () => {
  const onBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = 'Leaving this page will reset the wizard'
  }, [])

  useEffect(() => {
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [onBeforeUnload])
}
