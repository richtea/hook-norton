import { useEffect, useEffectEvent, useState } from 'react'
import { useRoutes } from '@/api/hooks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { LoadingSkeleton } from '@/components/common/SkeletonLoading'
import { RefreshCw, ChevronRight } from 'lucide-react'
import type { RouteConfiguration } from '@/types'
import { testIds } from '@/lib/testIds'
import { HTTP_METHODS } from '@/lib/constants'
import type { RefObject } from 'react'

interface RoutesListProps {
  onSelectRoute: (route: RouteConfiguration) => void
  selectedRoute?: RouteConfiguration
  onDeleteSelected: (routes: RouteConfiguration[]) => void
  searchInputRef?: RefObject<HTMLInputElement | null>
}

export function RoutesList({
  onSelectRoute,
  selectedRoute,
  onDeleteSelected,
  searchInputRef,
}: RoutesListProps) {
  const { data, isLoading, error, refetch } = useRoutes()
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [pathSearch, setPathSearch] = useState<string>('')
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set())
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [secondsAgo, setSecondsAgo] = useState(0)

  // Update "seconds ago" counter
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)
      setSecondsAgo(diff)
    }, 1000)
    return () => clearInterval(interval)
  }, [lastUpdated])

  const syncLastUpdated = useEffectEvent(() => {
    setLastUpdated(new Date())
    setSecondsAgo(0)
  })

  useEffect(() => {
    if (data) {
      syncLastUpdated()
    }
  }, [data])

  const routes = data?.routes || []

  const filteredRoutes = routes.filter((route) => {
    const methodMatch = methodFilter === 'all' || route.method === methodFilter
    const pathMatch =
      !pathSearch ||
      route.pathPattern.toLowerCase().includes(pathSearch.toLowerCase())
    return methodMatch && pathMatch
  })

  const toggleAllRoutes = () => {
    if (selectedRoutes.size === filteredRoutes.length) {
      setSelectedRoutes(new Set())
    } else {
      const keys = new Set(
        filteredRoutes.map((r) => `${r.method}:${r.pathPattern}`)
      )
      setSelectedRoutes(keys)
    }
  }

  const getMethodBadgeClass = (method: string) => {
    const baseColors = {
      GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      PATCH:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      HEAD: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      OPTIONS:
        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    }
    return baseColors[method as keyof typeof baseColors] || baseColors.GET
  }

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Routes</h2>
            {data && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated {secondsAgo}s ago
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh routes"            aria-label="Refresh routes list"            data-testid={testIds.routeRefreshButton}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger
              className="h-9"
              aria-label="Filter routes by HTTP method"
              data-testid={testIds.routeMethodFilter}
            >
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {HTTP_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            ref={searchInputRef}
            placeholder="Search path..."
            value={pathSearch}
            onChange={(e) => setPathSearch(e.target.value)}
            className="h-9"
            aria-label="Search routes by path"
            data-testid={testIds.routePathSearch}
          />
        </div>

        {selectedRoutes.size > 0 && (
          <div className="flex items-center justify-between rounded bg-muted p-2 text-sm">
            <span>{selectedRoutes.size} selected</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                const toDelete = filteredRoutes.filter(
                  (r) => selectedRoutes.has(`${r.method}:${r.pathPattern}`)
                )
                onDeleteSelected(toDelete)
                setSelectedRoutes(new Set())
              }}
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading && !data ? (
          <LoadingSkeleton count={5} />
        ) : error ? (
          <div className="p-4">
            <ErrorAlert message={error.message} />
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
            <p className="text-sm">No routes found</p>
            {routes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMethodFilter('all')
                  setPathSearch('')
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <Table data-testid={testIds.routesList}>
            <TableHeader className="sticky top-0">
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRoutes.size === filteredRoutes.length}
                    onCheckedChange={toggleAllRoutes}
                    data-testid={testIds.routeSelectAllCheckbox}
                  />
                </TableHead>
                <TableHead className="w-20">Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead className="text-right w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoutes.map((route) => {
                const isSelected = selectedRoute?.method === route.method && selectedRoute?.pathPattern === route.pathPattern
                const key = `${route.method}:${route.pathPattern}`
                return (
                  <TableRow
                    key={key}
                    className={`cursor-pointer ${isSelected ? 'bg-accent' : ''}`}
                    onClick={() => onSelectRoute(route)}
                    data-testid={testIds.routeListItem(route.method, route.pathPattern)}
                  >
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      className="text-center"
                    >
                      <Checkbox
                        checked={selectedRoutes.has(key)}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            const newSet = new Set(selectedRoutes)
                            newSet.add(key)
                            setSelectedRoutes(newSet)
                          } else {
                            const newSet = new Set(selectedRoutes)
                            newSet.delete(key)
                            setSelectedRoutes(newSet)
                          }
                        }}
                        data-testid={testIds.routeCheckbox(
                          route.method,
                          route.pathPattern
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge className={getMethodBadgeClass(route.method)}>
                        {route.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="truncate text-sm">
                      {route.pathPattern}
                    </TableCell>
                    <TableCell className="text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
