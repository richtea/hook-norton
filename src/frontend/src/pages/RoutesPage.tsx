import { useState, useCallback, useRef } from 'react'
import { useUpdateRoute, useDeleteRoute, useDeleteAllRoutes } from '@/api/hooks'
import { RoutesList } from '@/components/routes/RoutesList'
import { RouteDetails } from '@/components/routes/RouteDetails'
import { RouteForm } from '@/components/routes/RouteForm'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import type { RouteConfiguration } from '@/types'
import { testIds } from '@/lib/testIds'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

type FormMode = 'create' | 'edit' | null

interface RoutesPageProps {
  onNavigateTo?: (page: string) => void
}

export function RoutesPage({ onNavigateTo }: RoutesPageProps) {
  const [selectedRoute, setSelectedRoute] = useState<RouteConfiguration | undefined>(undefined)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [confirmDelete, setConfirmDelete] = useState<RouteConfiguration | null>(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState<RouteConfiguration[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const updateMutation = useUpdateRoute()
  const deleteMutation = useDeleteRoute()
  const deleteAllMutation = useDeleteAllRoutes()

  // Keyboard shortcuts
  useKeyboardShortcuts({
    search: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    },
    delete: () => {
      if (selectedRoute && !formMode) {
        setConfirmDelete(selectedRoute)
      }
    },
  })

  const handleUpdateRoute = useCallback(async (data: {
    method: string
    pathPattern: string
    response: { statusCode: number; headers: Record<string, string>; body: string }
    enabled: boolean
  }) => {
    if (!selectedRoute) return
    try {
      await updateMutation.mutateAsync({
        method: selectedRoute.method,
        path: selectedRoute.pathPattern,
        data: {
          response: data.response,
          enabled: data.enabled,
        },
      })
      setFormMode(null)
      setFormError(null)
      setSelectedRoute(undefined)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Update failed')
    }
  }, [selectedRoute, updateMutation])

  const handleDelete = async (route: RouteConfiguration) => {
    setConfirmDelete(route)
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return
    try {
      await deleteMutation.mutateAsync({
        method: confirmDelete.method,
        path: confirmDelete.pathPattern,
      })
      setConfirmDelete(null)
      if (selectedRoute?.method === confirmDelete.method && selectedRoute?.pathPattern === confirmDelete.pathPattern) {
        setSelectedRoute(undefined)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleDeleteSelected = (routes: RouteConfiguration[]) => {
    setConfirmDeleteSelected(routes)
  }

  const handleDeleteSelectedConfirm = async () => {
    try {
      for (const route of confirmDeleteSelected) {
        await deleteMutation.mutateAsync({
          method: route.method,
          path: route.pathPattern,
        })
      }
      setConfirmDeleteSelected([])
      setSelectedRoute(undefined)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleDeleteAllConfirm = async () => {
    try {
      await deleteAllMutation.mutateAsync()
      setConfirmDeleteAll(false)
      setSelectedRoute(undefined)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Delete all failed')
    }
  }

  const isEditingSelected = formMode === 'edit' && selectedRoute

  if (formMode === 'edit' && isEditingSelected) {
    return (
      <div className="flex h-full flex-col gap-4 p-6 overflow-y-auto" data-testid={testIds.routesPage}>
        {formError && (
          <ErrorAlert message={formError} onDismiss={() => setFormError(null)} />
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Edit Route</h1>
          <Button
            variant="outline"
            onClick={() => {
              setFormMode(null)
              setFormError(null)
            }}
          >
            Back
          </Button>
        </div>
        <RouteForm
          initialData={selectedRoute}
          onSubmit={handleUpdateRoute}
          isLoading={updateMutation.isPending}
          error={formError || undefined}
          onCancel={() => {
            setFormMode(null)
            setFormError(null)
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4 border-t border-border" data-testid={testIds.routesPage}>
      {/* Left Pane - Routes List */}
      <div className="w-1/3 min-w-72 overflow-hidden border-r border-border">
        <RoutesList
          onSelectRoute={(route) => {
            setSelectedRoute(route)
            setFormMode(null)
          }}
          selectedRoute={selectedRoute}
          onDeleteSelected={handleDeleteSelected}
          searchInputRef={searchInputRef}
        />
      </div>

      {/* Right Pane - Details or Empty State */}
      <div className="flex-1 overflow-hidden">
        {selectedRoute ? (
          <RouteDetails
            route={selectedRoute}
            onEdit={(route) => {
              setSelectedRoute(route)
              setFormMode('edit')
            }}
            onDelete={handleDelete}
            loading={deleteMutation.isPending}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 h-full">
            <p className="text-muted-foreground">Select a route to view details</p>
            <Button
              onClick={() => onNavigateTo?.('route-form')}
              className="gap-2"
              data-testid={testIds.routeNewButton}
            >
              <Plus className="h-4 w-4" />
              New Route
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteAll(true)}
              className="gap-2"
              data-testid={testIds.routeClearAllButton}
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete Route"
        description={`Are you sure you want to delete the route ${confirmDelete?.method} ${confirmDelete?.pathPattern}?`}
        actionLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={confirmDeleteSelected.length > 0}
        onOpenChange={(open) => !open && setConfirmDeleteSelected([])}
        title="Delete Selected Routes"
        description={`Are you sure you want to delete ${confirmDeleteSelected.length} route(s)?`}
        actionLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteSelectedConfirm}
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={confirmDeleteAll}
        onOpenChange={setConfirmDeleteAll}
        title="Clear All Routes"
        description="Are you sure you want to delete all routes? This action cannot be undone."
        actionLabel="Clear All"
        variant="destructive"
        onConfirm={handleDeleteAllConfirm}
        isLoading={deleteAllMutation.isPending}
      />
    </div>
  )
}
