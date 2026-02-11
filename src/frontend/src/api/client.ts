import { API_BASE_URL, API_ENDPOINTS } from '@/lib/constants'
import type {
  RouteConfiguration,
  RequestRecord,
  RouteCollectionModel,
  RequestListModel,
  HealthResponse,
} from '@/types'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestInit {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: 'An error occurred',
      }))
      throw new Error(error.detail || `API error: ${response.status}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  // Routes endpoints
  async getRoutes(): Promise<RouteCollectionModel> {
    return this.request(API_ENDPOINTS.routes.list)
  }

  async getRoute(method: string, path: string): Promise<RouteConfiguration> {
    return this.request(API_ENDPOINTS.routes.get(method, path))
  }

  async createRoute(
    method: string,
    path: string,
    data: Omit<RouteConfiguration, 'method' | 'pathPattern'>,
  ): Promise<RouteConfiguration> {
    return this.request(API_ENDPOINTS.routes.create(method, path), {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateRoute(
    method: string,
    path: string,
    data: Omit<RouteConfiguration, 'method' | 'pathPattern'>,
  ): Promise<RouteConfiguration> {
    return this.request(API_ENDPOINTS.routes.update(method, path), {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteRoute(method: string, path: string): Promise<void> {
    return this.request(API_ENDPOINTS.routes.delete(method, path), {
      method: 'DELETE',
    })
  }

  async deleteAllRoutes(): Promise<void> {
    return this.request(API_ENDPOINTS.routes.deleteAll, {
      method: 'DELETE',
    })
  }

  // Requests endpoints
  async getRequests(): Promise<RequestListModel> {
    return this.request(API_ENDPOINTS.requests.list)
  }

  async getRequest(id: string): Promise<RequestRecord> {
    return this.request(API_ENDPOINTS.requests.get(id))
  }

  async deleteAllRequests(): Promise<void> {
    return this.request(API_ENDPOINTS.requests.deleteAll, {
      method: 'DELETE',
    })
  }

  // Health endpoint
  async getHealth(): Promise<HealthResponse> {
    return this.request(API_ENDPOINTS.health)
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
