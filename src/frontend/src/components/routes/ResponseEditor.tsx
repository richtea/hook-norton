import { useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { isValidJSON, formatJSON } from '@/lib/utils'

interface ResponseEditorProps {
  value: string
  onChange: (value: string) => void
  testId?: string
}

export function ResponseEditor({ value, onChange, testId }: ResponseEditorProps) {
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleFormat = () => {
    if (isValidJSON(value)) {
      onChange(formatJSON(value))
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Simple syntax highlighting visualization via custom styling
  const isValid = value === '' || isValidJSON(value)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Response Body</label>
        <div className="flex gap-2">
          {isValid && value && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFormat}
            >
              Format
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className="rounded-md border" style={{ borderColor: isValid ? '' : '#ef4444' }}>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='{"status": "ok"}'
          className="font-mono text-sm"
          style={{ minHeight: '200px' }}
          data-testid={testId}
        />
        {!isValid && value && (
          <div className="bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Invalid JSON
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Supports JSON or plain text. Use "Format" button to pretty-print JSON.
      </p>
    </div>
  )
}
