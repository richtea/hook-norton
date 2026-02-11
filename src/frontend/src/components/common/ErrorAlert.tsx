import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { testIds } from '@/lib/testIds'

interface ErrorAlertProps {
  title?: string
  message: string
  onDismiss?: () => void
}

export function ErrorAlert({
  title = 'Error',
  message,
  onDismiss,
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive" data-testid={testIds.errorAlert}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between">
        <span>{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        )}
      </AlertDescription>
    </Alert>
  )
}
