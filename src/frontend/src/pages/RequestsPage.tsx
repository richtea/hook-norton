import { useState, useCallback, useRef } from 'react'
import { useClearRequests } from '@/api/hooks'
import { RequestsList } from '@/components/requests/RequestsList'
import { RequestDetails } from '@/components/requests/RequestDetails'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { RequestSummary } from '@/types'
import { testIds } from '@/lib/testIds'
import { apiClient } from '@/api/client'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export function RequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<any>(undefined)
  const [selectedSummary, setSelectedSummary] = useState<RequestSummary | undefined>(undefined)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const clearMutation = useClearRequests()

  // Keyboard shortcuts
  useKeyboardShortcuts({
    search: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    },
  })

  const handleSelectRequest = useCallback(async (summary: RequestSummary) => {
    setSelectedSummary(summary)
    setIsLoadingDetail(true)
    setError(null)
    try {
      const detail = await apiClient.getRequest(summary.id)
      setSelectedRequest(detail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load request')
      setSelectedRequest(undefined)
    } finally {
      setIsLoadingDetail(false)
    }
  }, [])

  const handleClearAllConfirm = async () => {
    try {
      await clearMutation.mutateAsync()
      setConfirmClearAll(false)
      setSelectedRequest(undefined)
      setSelectedSummary(undefined)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clear all failed')
    }
  }

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      {/* Header Actions */}
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-2xl font-bold">Request History</h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmClearAll(true)}
          disabled={clearMutation.isPending}
          className="gap-1"
          data-testid={testIds.requestsClearAllButton}
        >
          <Trash2 className="h-4 w-4" />
          Clear All
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          title="Error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 gap-4 px-4 pb-4 overflow-hidden">
        {/* Left pane: Requests List */}
        <div className="w-1/3 flex flex-col rounded-lg border border-border overflow-hidden">
          <RequestsList
            onSelectRequest={handleSelectRequest}
            selectedRequest={selectedSummary}
            searchInputRef={searchInputRef}
          />
        </div>

        {/* Right pane: Request Details */}
        <div className="flex-1 rounded-lg border border-border overflow-hidden bg-background">
          {isLoadingDetail ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading request details...</p>
            </div>
          ) : selectedRequest ? (
            <RequestDetails request={selectedRequest} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                Select a request to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Clear All Dialog */}
      <ConfirmDialog
        open={confirmClearAll}
        title="Clear All Requests?"
        description="This will permanently delete all request history. This action cannot be undone."
        onOpenChange={setConfirmClearAll}
        onConfirm={handleClearAllConfirm}
        isLoading={clearMutation.isPending}
        variant="destructive"
        actionLabel="Clear All"
        cancelLabel="Cancel"
      />
    </div>
  )
}
