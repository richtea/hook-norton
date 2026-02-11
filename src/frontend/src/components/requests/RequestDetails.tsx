import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, Check } from 'lucide-react'
import type { RequestRecord } from '@/types'
import { testIds } from '@/lib/testIds'
import { formatJSON, isValidJSON, formatTimestamp } from '@/lib/utils'

interface RequestDetailsProps {
  request: RequestRecord
}

export function RequestDetails({ request }: RequestDetailsProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(section)
      setTimeout(() => setCopiedSection(null), 2000)
    })
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

  const formatBodyDisplay = (body: string) => {
    if (!body) return '(empty)'
    if (isValidJSON(body)) {
      return formatJSON(body)
    }
    return body
  }

  return (
    <div
      className="flex h-full flex-col overflow-auto bg-background p-6 space-y-4"
      data-testid={testIds.requestDetailsPanel}
    >
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={getMethodBadgeClass(request.method)}>
              {request.method}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(request.timestamp)}
            </span>
          </div>
          <h2 className="break-all text-xl font-semibold">{request.path}</h2>
          {request.queryString && (
            <p className="text-sm text-muted-foreground font-mono">
              ?{request.queryString}
            </p>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6">
          {/* Query String */}
          {request.queryString && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Query String</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(request.queryString, 'query')
                    }
                    className="gap-1"
                  >
                    {copiedSection === 'query' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="overflow-auto rounded bg-muted p-3 text-xs font-mono text-foreground max-h-[200px]">
                  {request.queryString}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Headers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Headers</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(JSON.stringify(request.headers, null, 2), 'headers')
                  }
                  className="gap-1"
                >
                  {copiedSection === 'headers' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {Object.keys(request.headers).length === 0 ? (
                <p className="text-sm text-muted-foreground">(none)</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(request.headers).map(([key, value]) => (
                    <div key={key} className="space-y-1 rounded bg-muted p-2 text-sm">
                      <p className="font-mono font-semibold text-xs">{key}</p>
                      <p className="font-mono text-xs break-all">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Body */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Request Body</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(request.body, 'body')}
                  className="gap-1"
                >
                  {copiedSection === 'body' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded bg-muted p-3 text-xs font-mono text-foreground max-h-[300px]">
                {formatBodyDisplay(request.body)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
