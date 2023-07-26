import axios from 'axios'

const instance = axios.create({
  // baseURL: window.location.origin,
  headers: {
    authorization: `Bearer ...`,
  },
})

export const api = instance
