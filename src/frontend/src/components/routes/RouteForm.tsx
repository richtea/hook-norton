import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HeadersTable } from './HeadersTable'
import { ResponseEditor } from './ResponseEditor'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { HTTP_METHODS } from '@/lib/constants'
import type { RouteConfiguration } from '@/types'
import { testIds } from '@/lib/testIds'

interface RouteFormProps {
  onSubmit: (data: {
    method: string
    pathPattern: string
    response: { statusCode: number; headers: Record<string, string>; body: string }
    enabled: boolean
  }) => Promise<void>
  initialMethod?: string
  initialPath?: string
  initialData?: RouteConfiguration
  isLoading?: boolean
  error?: string
  onCancel?: () => void
}

export function RouteForm({
  onSubmit,
  initialMethod = 'GET',
  initialPath = '',
  initialData,
  isLoading = false,
  error,
  onCancel,
}: RouteFormProps) {
  const [internalError, setInternalError] = useState<string | null>(null)

  const { control, handleSubmit } = useForm({
    defaultValues: {
      method: initialData?.method || initialMethod,
      pathPattern: initialData?.pathPattern || initialPath,
      statusCode: initialData?.response.statusCode || 200,
      headers: initialData?.response.headers || {},
      body: initialData?.response.body || '',
      enabled: initialData?.enabled ?? true,
    },
  })

  const onFormSubmit = async (formData: any) => {
    try {
      setInternalError(null)
      await onSubmit({
        method: formData.method,
        pathPattern: formData.pathPattern,
        response: {
          statusCode: Number(formData.statusCode),
          headers: formData.headers,
          body: formData.body,
        },
        enabled: formData.enabled,
      })
    } catch (err) {
      setInternalError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const displayError = error || internalError

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} data-testid={testIds.routeFormPage}>
      <div className="space-y-6">
        {displayError && (
          <ErrorAlert
            message={displayError}
            onDismiss={() => setInternalError(null)}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Route Configuration</CardTitle>
            <CardDescription>Define the route pattern and response</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Method & Path Row */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="method">HTTP Method</Label>
                <Controller
                  name="method"
                  control={control}
                  disabled={!!initialData}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!!initialData}>
                      <SelectTrigger
                        id="method"
                        data-testid={testIds.routeFormMethodInput}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HTTP_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Cannot be changed for existing routes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="path">Path Pattern</Label>
                <Controller
                  name="pathPattern"
                  control={control}
                  disabled={!!initialData}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="path"
                      placeholder="/api/users/*"
                      data-testid={testIds.routeFormPathInput}
                      disabled={!!initialData}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Supports wildcards (*). Cannot be changed for existing routes.
                </p>
              </div>
            </div>

            {/* Status Code & Enabled Row */}
            <div className="grid gap-4 md:max-w-md">
              <div className="space-y-2">
                <Label htmlFor="statusCode">Status Code</Label>
                <Controller
                  name="statusCode"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="statusCode"
                      type="number"
                      min="100"
                      max="599"
                      data-testid={testIds.routeFormStatusCodeInput}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Between 100 and 599
                </p>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Controller
                  name="enabled"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Checkbox
                        id="enabled"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid={testIds.routeFormEnabledCheckbox}
                      />
                      <Label htmlFor="enabled" className="cursor-pointer">
                        Enabled
                      </Label>
                    </>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Headers */}
        <Card>
          <CardHeader>
            <CardTitle>Response Headers</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="headers"
              control={control}
              render={({ field }) => (
                <HeadersTable
                  headers={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Response Body */}
        <Card>
          <CardHeader>
            <CardTitle>Response Body</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="body"
              control={control}
              render={({ field }) => (
                <ResponseEditor
                  value={field.value}
                  onChange={field.onChange}
                  testId={testIds.routeFormBodyEditor}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              data-testid={testIds.routeFormCancelButton}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            data-testid={testIds.routeFormSubmitButton}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              initialData ? 'Update Route' : 'Create Route'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
