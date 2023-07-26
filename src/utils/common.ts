import dayjs from 'dayjs'

export const formatCurrencyOrNumber = (x?: number) => {
  return x
    ?.toFixed(2)
    ?.replaceAll('.00', '')
    ?.toString()
    ?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export const downloadCsv = (filename: string, url: string) => {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const formatDate = (date: any) => date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss.SSS') : ''
