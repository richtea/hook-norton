import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'

interface Header {
  key: string
  value: string
}

interface HeadersTableProps {
  headers: Record<string, string>
  onChange: (headers: Record<string, string>) => void
}

export function HeadersTable({ headers, onChange }: HeadersTableProps) {
  const headerArray = Object.entries(headers).map(([key, value]) => ({ key, value }))

  const updateHeader = (index: number, newHeader: Header) => {
    const updated = [...headerArray]
    updated[index] = newHeader
    const newHeaders = Object.fromEntries(
      updated.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value])
    )
    onChange(newHeaders)
  }

  const removeHeader = (index: number) => {
    const updated = headerArray.filter((_, i) => i !== index)
    const newHeaders = Object.fromEntries(
      updated.map((h) => [h.key.trim(), h.value])
    )
    onChange(newHeaders)
  }

  const addHeader = () => {
    const updated = [...headerArray, { key: '', value: '' }]
    const newHeaders = Object.fromEntries(
      updated.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value])
    )
    onChange(newHeaders)
    // Note: new empty row will be shown because we're displaying headerArray
  }

  // Always show an extra empty row for adding
  const displayArray = [...headerArray]
  if (displayArray.length === 0 || (displayArray[displayArray.length - 1].key || displayArray[displayArray.length - 1].value)) {
    displayArray.push({ key: '', value: '' })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Headers</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addHeader}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Header
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Key</TableHead>
              <TableHead className="w-2/3">Value</TableHead>
              <TableHead className="w-12 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayArray.map((header, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    placeholder="e.g., Content-Type"
                    value={header.key}
                    onChange={(e) =>
                      updateHeader(index, { ...header, key: e.target.value })
                    }
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="e.g., application/json"
                    value={header.value}
                    onChange={(e) =>
                      updateHeader(index, { ...header, value: e.target.value })
                    }
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="text-right">
                  {header.key && (
                    <button
                      type="button"
                      onClick={() => removeHeader(index)}
                      className="text-destructive hover:text-destructive/80"
                      aria-label="Delete header"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
