import { useEffect, useEffectEvent, useState } from 'react'
import { useRequests } from '@/api/hooks'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw } from 'lucide-react'
import type { RequestSummary } from '@/types'
import { testIds } from '@/lib/testIds'
import { formatTimestamp } from '@/lib/utils'
import { LoadingSkeleton } from '@/components/common/SkeletonLoading'
import type { RefObject } from 'react'

interface RequestsListProps {
  onSelectRequest: (request: RequestSummary) => void
  selectedRequest?: RequestSummary
  searchInputRef?: RefObject<HTMLInputElement | null>
}

export function RequestsList({
  onSelectRequest,
  selectedRequest,
  searchInputRef,
}: RequestsListProps) {
  const { data, isLoading, error, refetch } = useRequests()
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [pathSearch, setPathSearch] = useState<string>('')
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

  const requests = data?.requests || []

  const filteredRequests = requests.filter((request) => {
    const methodMatch = methodFilter === 'all' || request.method === methodFilter
    const pathMatch =
      !pathSearch ||
      request.path.toLowerCase().includes(pathSearch.toLowerCase())
    return methodMatch && pathMatch
  })

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

  const uniqueMethods = Array.from(
    new Set(requests.map((r) => r.method))
  ).sort()

  return (
    <div
      className="flex h-full flex-col border-r border-border bg-background"
      data-testid={testIds.requestsList}
    >
      {/* Header */}
      <div className="border-b border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Requests</h2>
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
            title="Refresh requests"            aria-label="Refresh requests list"            data-testid={testIds.requestRefreshButton}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <label htmlFor="method-filter" className="text-xs font-medium text-muted-foreground">
              Method
            </label>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger
                id="method-filter"
                className="mt-1.5"
                data-testid={testIds.requestMethodFilter}
              >
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {uniqueMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="path-search" className="text-xs font-medium text-muted-foreground">
              Path
            </label>
            <Input
              ref={searchInputRef}
              id="path-search"
              placeholder="Search paths..."
              value={pathSearch}
              onChange={(e) => setPathSearch(e.target.value)}
              className="mt-1.5"
              aria-label="Search requests by path"
              data-testid={testIds.requestPathSearch}
            />
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <ScrollArea className="flex-1">
        <div className="relative">
          {isLoading && !data ? (
            <LoadingSkeleton count={5} />
          ) : error ? (
            <div className="p-4 text-sm text-destructive">
              Error loading requests
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No requests found
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="w-16">Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead className="w-40">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    className={`cursor-pointer hover:bg-muted/50 border-b border-border/50 transition-colors ${
                      selectedRequest?.id === request.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => onSelectRequest(request)}
                    data-testid={testIds.requestListItem(request.method, request.path)}
                  >
                    <TableCell>
                      <Badge className={getMethodBadgeClass(request.method)}>
                        {request.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="truncate text-sm">
                      {request.path}
                      {request.queryString && (
                        <span className="text-muted-foreground">
                          ?{request.queryString}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(request.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
