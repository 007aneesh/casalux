'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, X, Loader2, AlertCircle } from 'lucide-react'
import { useAuthedRequest } from '@/lib/hooks/useAuthedRequest'

export interface UploadedImage {
  publicId:  string
  url:       string
  width:     number
  height:    number
  isPrimary: boolean
  order:     number
}

interface Props {
  listingId:      string
  initialImages?: UploadedImage[]
  maxImages?:     number
  onChange?:      (images: UploadedImage[]) => void
}

interface FileState {
  id:       string
  file:     File
  preview:  string
  status:   'pending' | 'uploading' | 'done' | 'error'
  error?:   string
  uploaded?: UploadedImage
}

export default function ImageUploader({
  listingId,
  initialImages = [],
  maxImages = 10,
  onChange,
}: Props) {
  const authedRequest = useAuthedRequest()
  const inputRef      = useRef<HTMLInputElement>(null)
  const [files, setFiles]   = useState<FileState[]>([])
  const [saved, setSaved]   = useState<UploadedImage[]>(initialImages)
  const [dragging, setDragging] = useState(false)

  const allImages = [
    ...saved,
    ...files.filter(f => f.status === 'done' && f.uploaded).map(f => f.uploaded!),
  ]

  function updateFile(id: string, patch: Partial<FileState>) {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  async function uploadFile(fileState: FileState) {
    updateFile(fileState.id, { status: 'uploading' })
    try {
      // 1. Get signed params from our API
      const signRes = await authedRequest<{
        signature: string; timestamp: number
        cloudName: string; apiKey: string; folder: string
      }>('/uploads/sign', {
        method: 'POST',
        body: JSON.stringify({ folder: 'listings', resourceType: 'image' }),
      })

      if (!signRes.data) throw new Error('Failed to get upload signature')
      const { signature, timestamp, cloudName, apiKey, folder } = signRes.data

      // 2. Upload directly to Cloudinary (binary never touches our server)
      const fd = new FormData()
      fd.append('file',      fileState.file)
      fd.append('api_key',   apiKey)
      fd.append('timestamp', String(timestamp))
      fd.append('signature', signature)
      fd.append('folder',    folder)

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: fd }
      )
      if (!cloudRes.ok) throw new Error('Cloudinary upload failed')
      const cloud = await cloudRes.json()

      // 3. Confirm with our API — stores the asset in DB
      const confirmRes = await authedRequest<UploadedImage>('/uploads/confirm', {
        method: 'POST',
        body: JSON.stringify({
          publicId:     cloud.public_id,
          url:          cloud.url,
          secureUrl:    cloud.secure_url,
          resourceType: 'image',
          format:       cloud.format,
          bytes:        cloud.bytes,
          width:        cloud.width,
          height:       cloud.height,
          entityType:   'listing',
          entityId:     listingId,
          isPrimary:    allImages.length === 0,
          order:        allImages.length,
        }),
      })

      if (!confirmRes.data) throw new Error('Failed to confirm upload')

      const uploaded: UploadedImage = {
        publicId:  cloud.public_id,
        url:       cloud.secure_url,
        width:     cloud.width,
        height:    cloud.height,
        isPrimary: allImages.length === 0,
        order:     allImages.length,
      }
      updateFile(fileState.id, { status: 'done', uploaded })
      onChange?.([...allImages, uploaded])
    } catch (err: any) {
      updateFile(fileState.id, { status: 'error', error: err.message ?? 'Upload failed' })
    }
  }

  function addFiles(incoming: File[]) {
    const remaining = maxImages - allImages.length - files.filter(f => f.status !== 'error').length
    const toAdd = incoming.slice(0, Math.max(0, remaining))
    const newStates: FileState[] = toAdd.map(file => ({
      id:      `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status:  'pending',
    }))
    setFiles(prev => [...prev, ...newStates])
    newStates.forEach(fs => uploadFile(fs))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (dropped.length) addFiles(dropped)
  }, [allImages.length, files.length])

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'))
    if (picked.length) addFiles(picked)
    e.target.value = ''
  }

  function removeFile(id: string) {
    setFiles(prev => {
      const f = prev.find(x => x.id === id)
      if (f?.preview) URL.revokeObjectURL(f.preview)
      return prev.filter(x => x.id !== id)
    })
  }

  function removeSaved(publicId: string) {
    const updated = saved.filter(s => s.publicId !== publicId)
    setSaved(updated)
    onChange?.(updated)
  }

  const canAddMore = allImages.length + files.filter(f => f.status !== 'error' && f.status !== 'done').length < maxImages

  return (
    <div className="space-y-4">
      {/* Existing / uploaded images grid */}
      {(saved.length > 0 || files.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {/* Confirmed saved images */}
          {saved.map((img) => (
            <div key={img.publicId} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
              <Image src={img.url} alt="" fill className="object-cover" sizes="150px" />
              {img.isPrimary && (
                <span className="absolute bottom-1 left-1 bg-navy/80 text-white text-[10px] px-1.5 py-0.5 rounded-md">Cover</span>
              )}
              <button
                onClick={() => removeSaved(img.publicId)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* In-progress / done file uploads */}
          {files.map((f) => (
            <div key={f.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <Image src={f.preview} alt="" fill className={`object-cover transition-opacity ${f.status === 'uploading' ? 'opacity-50' : 'opacity-100'}`} sizes="150px" />
              {f.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              )}
              {f.status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/80 p-2 text-center">
                  <AlertCircle size={16} className="text-red-500 mb-1" />
                  <p className="text-[10px] text-red-600 leading-tight">{f.error}</p>
                </div>
              )}
              {(f.status === 'done' || f.status === 'error') && (
                <button
                  onClick={() => removeFile(f.id)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl px-6 py-10 cursor-pointer transition-colors ${
            dragging ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gray-400 bg-gray-50'
          }`}
        >
          <div className="h-12 w-12 rounded-xl bg-navy/5 flex items-center justify-center">
            <ImagePlus size={22} className="text-navy/50" />
          </div>
          <p className="text-sm font-medium text-navy">Drop photos here or click to browse</p>
          <p className="text-xs text-muted">JPG, PNG, WEBP up to 10 MB · up to {maxImages} photos</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onInputChange}
          />
        </div>
      )}

      {!canAddMore && (
        <p className="text-xs text-center text-muted">Maximum {maxImages} photos reached.</p>
      )}
    </div>
  )
}
