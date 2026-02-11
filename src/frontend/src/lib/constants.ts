export const API_BASE_URL = (() => {
  // Fallback for development
  return ''
})()

export const API_ENDPOINTS = {
  routes: {
    list: '/$$/api/routes',
    get: (method: string, path: string) => `/$$/api/routes/${method}/${encodeURIComponent(path)}`,
    create: (method: string, path: string) => `/$$/api/routes/${method}/${encodeURIComponent(path)}`,
    update: (method: string, path: string) => `/$$/api/routes/${method}/${encodeURIComponent(path)}`,
    delete: (method: string, path: string) => `/$$/api/routes/${method}/${encodeURIComponent(path)}`,
    deleteAll: '/$$/api/routes',
  },
  requests: {
    list: '/$$/api/requests',
    get: (id: string) => `/$$/api/requests/${id}`,
    delete: (id: string) => `/$$/api/requests/${id}`,
    deleteAll: '/$$/api/requests',
  },
  health: '/$$/api/health',
}

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
export type HttpMethod = (typeof HTTP_METHODS)[number]

export const COMMON_STATUS_CODES = [
  { code: 200, label: '200 OK' },
  { code: 201, label: '201 Created' },
  { code: 204, label: '204 No Content' },
  { code: 400, label: '400 Bad Request' },
  { code: 401, label: '401 Unauthorized' },
  { code: 403, label: '403 Forbidden' },
  { code: 404, label: '404 Not Found' },
  { code: 422, label: '422 Unprocessable Content' },
  { code: 500, label: '500 Internal Server Error' },
  { code: 502, label: '502 Bad Gateway' },
  { code: 503, label: '503 Service Unavailable' },
]

export const POLLING_INTERVAL = 30000 // 30 seconds
