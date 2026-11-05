const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const pendingGets = new Map()

export async function api(path, { token, ...options } = {}) {
  const request = async () => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const data = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.message || 'Something went wrong. Please try again.')
  return data
  }

  const key = `${token || ''}:${API_URL}${path}`
  if (options.method && options.method.toUpperCase() !== 'GET') {
    pendingGets.delete(key)
    return request()
  }
  if (pendingGets.has(key)) return pendingGets.get(key)
  const pending = request()
  pendingGets.set(key, pending)
  try {
    return await pending
  } finally {
    if (pendingGets.get(key) === pending) pendingGets.delete(key)
  }
}

export const json = (method, body) => ({ method, body: JSON.stringify(body) })
