'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle, AlertCircle, FileWarning } from 'lucide-react'
import toast from 'react-hot-toast'
import type { DataUpload } from '@/types/velorix'

export type ReportType =
  | 'sub_ib_report'
  | 'ib_accounts_report'
  | 'rebate_report'
  | 'ib_report'

const ENDPOINT_MAP: Record<ReportType, string> = {
  sub_ib_report: '/api/uploads/sub-ib',
  ib_accounts_report: '/api/uploads/ib-accounts',
  rebate_report: '/api/uploads/rebate',
  ib_report: '/api/uploads/ib-report',
}

type UploadShellProps = {
  reportType: ReportType
  title: string
  description: string
  expectedColumns: string[]
  sampleFilename: string
  recentUploads: DataUpload[]
}

type UploadResult = {
  rows_parsed: number
  rows_imported: number
  rows_rejected: number
  rejection_reasons?: Array<{ row: number; reason: string }>
  message?: string
}

export function UploadShell({
  reportType,
  title,
  description,
  expectedColumns,
  sampleFilename,
  recentUploads,
}: UploadShellProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      // Basic validation
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        toast.error('Please upload an .xlsx file')
        return
      }

      const endpoint = ENDPOINT_MAP[reportType]
      const formData = new FormData()
      formData.append('file', file)

      setIsUploading(true)
      setResult(null)

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          // 404 means the parser endpoint doesn't exist yet (Phase 2.2.3-5 still in build)
          if (response.status === 404) {
            throw new Error('Parser for this report type not yet built. Coming in Phase 2.2.3-5.')
          }
          const errorBody = await response.text()
          throw new Error(errorBody || `Upload failed: ${response.status}`)
        }

        const data = (await response.json()) as UploadResult
        setResult(data)
        toast.success(`Uploaded ${file.name}`)
        router.refresh()  // Refreshes recent uploads sidebar
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        toast.error(message)
        setResult({
          rows_parsed: 0,
          rows_imported: 0,
          rows_rejected: 0,
          message,
        })
      } finally {
        setIsUploading(false)
      }
    },
    [reportType, router]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Main column: drop zone + result */}
      <div className="min-w-0 space-y-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-card border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-brand-blue bg-brand-blue/5'
              : 'border-border bg-surface hover:bg-surface-2 hover:border-border-bright'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
          {isUploading ? (
            <p className="text-text">Uploading and parsing...</p>
          ) : (
            <>
              <p className="text-text font-medium">
                Drop XLSX file here, or click to select
              </p>
              <p className="text-text-dim text-sm mt-1">
                Example: {sampleFilename}
              </p>
            </>
          )}
        </div>

        {/* Result panel */}
        {result && (
          <div className="rounded-card bg-surface border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              {result.rows_rejected > 0 ? (
                <FileWarning className="w-5 h-5 text-warning" />
              ) : result.rows_imported > 0 ? (
                <CheckCircle className="w-5 h-5 text-success-bright" />
              ) : (
                <AlertCircle className="w-5 h-5 text-text-muted" />
              )}
              <h3 className="font-display font-semibold text-text">
                Upload result
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-card bg-surface-2 p-3">
                <p className="text-xs uppercase tracking-wider text-text-muted">
                  Parsed
                </p>
                <p className="text-text font-mono text-xl tabular-nums mt-1">
                  {result.rows_parsed.toLocaleString()}
                </p>
              </div>
              <div className="rounded-card bg-surface-2 p-3">
                <p className="text-xs uppercase tracking-wider text-text-muted">
                  Imported
                </p>
                <p className="text-text font-mono text-xl tabular-nums mt-1 text-success-bright">
                  {result.rows_imported.toLocaleString()}
                </p>
              </div>
              <div className="rounded-card bg-surface-2 p-3">
                <p className="text-xs uppercase tracking-wider text-text-muted">
                  Rejected
                </p>
                <p
                  className={`font-mono text-xl tabular-nums mt-1 ${
                    result.rows_rejected > 0 ? 'text-warning' : 'text-text'
                  }`}
                >
                  {result.rows_rejected.toLocaleString()}
                </p>
              </div>
            </div>

            {result.message && (
              <p className="text-text-dim text-sm mb-3">{result.message}</p>
            )}

            {result.rejection_reasons && result.rejection_reasons.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted font-medium mb-2">
                  Rejected rows
                </p>
                <div className="rounded-card bg-surface-2 max-h-60 overflow-y-auto">
                  {result.rejection_reasons.map((rej, i) => (
                    <div
                      key={i}
                      className={`px-3 py-2 text-sm ${
                        i !== result.rejection_reasons!.length - 1
                          ? 'border-b border-border'
                          : ''
                      }`}
                    >
                      <span className="text-text-muted font-mono text-xs">
                        Row {rej.row}:
                      </span>{' '}
                      <span className="text-text-dim">{rej.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expected columns documentation */}
        <div className="rounded-card bg-surface border border-border p-5">
          <h3 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
            Expected columns
          </h3>
          <div className="flex flex-wrap gap-2">
            {expectedColumns.map((col) => (
              <span
                key={col}
                className="text-xs px-2 py-1 rounded-btn bg-surface-2 text-text-dim font-mono"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar: recent uploads */}
      <aside className="min-w-0">
        <h3 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">
          Recent uploads
        </h3>
        {recentUploads.length === 0 ? (
          <div className="rounded-card bg-surface border border-border p-5 text-center">
            <FileText className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-text-dim text-sm">No uploads yet</p>
          </div>
        ) : (
          <div className="rounded-card bg-surface border border-border overflow-hidden">
            {recentUploads.map((upload, i) => {
              const isLast = i === recentUploads.length - 1
              const dateStr = upload.created_at
                ? new Date(upload.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'

              const statusColor =
                upload.processing_status === 'completed'
                  ? 'text-success-bright'
                  : upload.processing_status === 'failed'
                  ? 'text-warning'
                  : 'text-text-dim'

              return (
                <div
                  key={upload.id}
                  className={`p-3 ${!isLast ? 'border-b border-border' : ''}`}
                >
                  <p className="text-text text-sm truncate font-mono">
                    {upload.original_filename ?? 'unknown'}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-text-muted text-xs">{dateStr}</p>
                    <p className={`text-xs font-mono ${statusColor}`}>
                      {upload.processing_status}
                    </p>
                  </div>
                  {(upload.rows_imported ?? 0) > 0 && (
                    <p className="text-text-dim text-xs mt-1 font-mono">
                      {upload.rows_imported?.toLocaleString()} imported
                      {(upload.rows_rejected ?? 0) > 0 && (
                        <span className="text-warning">
                          {' · '}
                          {upload.rows_rejected?.toLocaleString()} rejected
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </aside>
    </div>
  )
}
