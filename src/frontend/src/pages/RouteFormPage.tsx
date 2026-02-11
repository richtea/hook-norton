import { useCreateRoute } from '@/api/hooks'
import { RouteForm } from '@/components/routes/RouteForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { testIds } from '@/lib/testIds'

interface RouteFormPageProps {
  onSuccess?: () => void
  onCancel: () => void
}

export function RouteFormPage({ onSuccess, onCancel }: RouteFormPageProps) {
  const createMutation = useCreateRoute()

  const handleSubmit = async (data: {
    method: string
    pathPattern: string
    response: { statusCode: number; headers: Record<string, string>; body: string }
    enabled: boolean
  }) => {
    try {
      await createMutation.mutateAsync({
        method: data.method,
        path: data.pathPattern,
        data: {
          response: data.response,
          enabled: data.enabled,
        },
      })
      onSuccess?.()
    } catch (err) {
      console.error('Failed to create route:', err)
      throw err
    }
  }

  return (
    <div className="flex h-full flex-col" data-testid={testIds.routeFormPage}>
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="gap-2 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Route</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <RouteForm
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
          onCancel={onCancel}
        />
      </div>
    </div>
  )
}
