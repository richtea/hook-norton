export interface RouteConfiguration {
  method: string
  pathPattern: string
  response: RouteResponse
  enabled: boolean
  version?: number
}

export interface RouteResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}

export interface RequestRecord {
  id: string
  timestamp: string
  method: string
  path: string
  queryString: string
  headers: Record<string, string>
  body: string
}

export interface RequestSummary {
  id: string
  timestamp: string
  method: string
  path: string
  queryString: string
  bodyExcerpt: string
}

export interface RouteCollectionModel {
  routes: RouteConfiguration[]
}

export interface RequestListModel {
  requests: RequestSummary[]
  totalCount: number
}

export interface HealthResponse {
  status: string
  timestamp: string
}

export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
}
