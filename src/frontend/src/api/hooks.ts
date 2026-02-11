import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { apiClient } from './client'
import type {
  RouteConfiguration,
  RouteCollectionModel,
  RequestListModel,
} from '@/types'
import { POLLING_INTERVAL } from '@/lib/constants'

const QUERY_KEYS = {
  routes: ['routes'],
  route: (method: string, path: string) => ['route', method, path],
  requests: ['requests'],
  request: (id: string) => ['request', id],
  health: ['health'],
}

// Routes queries
export function useRoutes(options?: Partial<UseQueryOptions<RouteCollectionModel>>) {
  return useQuery({
    queryKey: QUERY_KEYS.routes,
    queryFn: () => apiClient.getRoutes(),
    refetchInterval: POLLING_INTERVAL,
    staleTime: POLLING_INTERVAL,
    ...options,
  })
}

export function useRoute(method: string, path: string) {
  return useQuery({
    queryKey: QUERY_KEYS.route(method, path),
    queryFn: () => apiClient.getRoute(method, path),
    enabled: !!method && !!path,
  })
}

// Routes mutations
export function useCreateRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      method,
      path,
      data,
    }: {
      method: string
      path: string
      data: Omit<RouteConfiguration, 'method' | 'pathPattern'>
    }) => apiClient.createRoute(method, path, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.routes })
    },
  })
}

export function useUpdateRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      method,
      path,
      data,
    }: {
      method: string
      path: string
      data: Omit<RouteConfiguration, 'method' | 'pathPattern'>
    }) => apiClient.updateRoute(method, path, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.routes })
    },
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ method, path }: { method: string; path: string }) =>
      apiClient.deleteRoute(method, path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.routes })
    },
  })
}

export function useDeleteAllRoutes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.deleteAllRoutes(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.routes })
    },
  })
}

// Requests queries
export function useRequests(options?: Partial<UseQueryOptions<RequestListModel>>) {
  return useQuery({
    queryKey: QUERY_KEYS.requests,
    queryFn: () => apiClient.getRequests(),
    refetchInterval: POLLING_INTERVAL,
    staleTime: POLLING_INTERVAL,
    ...options,
  })
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.request(id),
    queryFn: () => apiClient.getRequest(id),
    enabled: !!id,
  })
}

// Requests mutations
export function useClearRequests() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.deleteAllRequests(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.requests })
    },
  })
}

// Health
export function useHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.health,
    queryFn: () => apiClient.getHealth(),
    refetchInterval: POLLING_INTERVAL,
  })
}
