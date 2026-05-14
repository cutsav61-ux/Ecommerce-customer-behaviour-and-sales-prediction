import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, CheckCircle, Download, Eye, Table, AlertCircle } from 'lucide-react'
import { datasetAPI } from '../utils/api'
import toast from 'react-hot-toast'

export default function UploadDataset() {
  const [uploading, setUploading] = useState(false)
  const [dataset, setDataset] = useState(null)
  const [loadingSample, setLoadingSample] = useState(false)

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await datasetAPI.upload(file)
      setDataset(res.data)
      toast.success(`✅ Dataset uploaded: ${res.data.rows} rows × ${res.data.columns.length} columns`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    maxFiles: 1
  })

  const loadSample = async () => {
    setLoadingSample(true)
    try {
      const res = await datasetAPI.getSample()
      setDataset(res.data)
      toast.success('Sample dataset loaded!')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoadingSample(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="animate-fade-in">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Upload Dataset</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Upload your CSV or Excel file to train ML models
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dropzone */}
        <div className="animate-slide-up">
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
              transition-all duration-300
              ${isDragActive ? 'border-brand-500 scale-[1.01]' : 'border-opacity-30'}
              ${uploading ? 'opacity-50 pointer-events-none' : ''}
            `}
            style={{
              borderColor: isDragActive ? '#4f6ef7' : 'var(--border)',
              background: isDragActive ? 'rgba(79,110,247,0.05)' : 'var(--surface)',
            }}
          >
            <input {...getInputProps()} />
            <div className={`flex flex-col items-center gap-3 ${isDragActive ? 'scale-105' : ''} transition-transform`}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(79,110,247,0.15), rgba(34,211,238,0.1))' }}>
                {uploading ? (
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={28} style={{ color: '#4f6ef7' }} />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  {uploading ? 'Processing...' : isDragActive ? 'Drop your file here!' : 'Drag & drop your dataset'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  CSV, Excel (.xlsx, .xls) — up to 50MB
                </p>
              </div>
              {!uploading && (
                <button className="btn-primary text-xs px-4 py-2 mt-1">Browse File</button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={loadSample} disabled={loadingSample} className="btn-secondary text-sm gap-2">
              {loadingSample ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <FileSpreadsheet size={16} />}
              Use Sample Data
            </button>
            <button onClick={datasetAPI.downloadSample} className="btn-secondary text-sm gap-2">
              <Download size={16} />
              Download Template
            </button>
          </div>
        </div>

        {/* Dataset info */}
        {dataset ? (
          <div className="space-y-4 animate-scale-in">
            {/* Summary */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={20} className="text-green-400" />
                <h3 className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                  {dataset.name}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Rows', dataset.rows?.toLocaleString()],
                  ['Columns', dataset.columns?.length],
                  ['Dataset ID', dataset.dataset_id?.slice(0, 14) + '...'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</p>
                    <p className="font-semibold text-sm font-mono mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Columns */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Table size={15} style={{ color: 'var(--text-muted)' }} />
                <h3 className="font-semibold text-sm">Columns Detected</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dataset.columns?.map(col => (
                  <span key={col} className="badge badge-info text-xs">{col}</span>
                ))}
              </div>
            </div>

            {/* Next step hint */}
            <div className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(79,110,247,0.08)', border: '1px solid rgba(79,110,247,0.2)' }}>
              <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#4f6ef7' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#4f6ef7' }}>Next Step</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Go to <strong>Train Models</strong> to train the ML models on this dataset.
                  Dataset ID: <code className="font-mono text-xs">{dataset.dataset_id}</code>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card flex flex-col items-center justify-center text-center py-12 animate-fade-in">
            <FileSpreadsheet size={40} style={{ color: 'var(--text-muted)' }} className="mb-3 opacity-40" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No dataset loaded yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Upload a file or use the sample dataset</p>
          </div>
        )}
      </div>

      {/* Preview table */}
      {dataset?.preview && (
        <div className="card animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={16} style={{ color: 'var(--text-muted)' }} />
            <h3 className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Data Preview (first 5 rows)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {dataset.columns?.map(col => (
                    <th key={col} className="text-left px-3 py-2.5 font-semibold whitespace-nowrap"
                      style={{ color: 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.preview?.map((row, i) => (
                  <tr key={i} className="transition-colors hover:bg-opacity-50"
                    style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface-2)' }}>
                    {dataset.columns?.map(col => (
                      <td key={col} className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: 'var(--text)' }}>
                        {row[col] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
