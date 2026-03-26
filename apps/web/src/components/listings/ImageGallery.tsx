'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Grid2x2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ListingImage } from '@casalux/types'

interface ImageGalleryProps {
  images: ListingImage[]
  title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const sorted = [...images].sort((a, b) => a.order - b.order)
  const primary = sorted[0]
  const secondary = sorted.slice(1, 5)

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx)
    setLightboxOpen(true)
  }

  const prev = useCallback(() =>
    setLightboxIndex((i) => (i - 1 + sorted.length) % sorted.length), [sorted.length])
  const next = useCallback(() =>
    setLightboxIndex((i) => (i + 1) % sorted.length), [sorted.length])

  if (!primary) return null

  return (
    <>
      {/* Grid layout */}
      <div className="relative grid grid-cols-4 grid-rows-2 gap-2 h-[480px] rounded-2xl overflow-hidden">
        {/* Primary large image */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={primary.url}
            alt={title}
            fill
            className="object-cover group-hover:brightness-95 transition-all duration-200"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Secondary images */}
        {secondary.map((img, i) => (
          <div
            key={img.publicId}
            className="relative cursor-pointer group"
            onClick={() => openLightbox(i + 1)}
          >
            <Image
              src={img.url}
              alt={`${title} — photo ${i + 2}`}
              fill
              className="object-cover group-hover:brightness-95 transition-all duration-200"
              sizes="25vw"
            />
          </div>
        ))}

        {/* Show all photos button */}
        <button
          onClick={() => openLightbox(0)}
          className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-border text-foreground text-sm font-medium px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          <Grid2x2 className="h-4 w-4" />
          Show all {sorted.length} photos
        </button>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-white/70 text-sm font-medium">
              {lightboxIndex + 1} / {sorted.length}
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main image */}
          <div className="flex-1 relative flex items-center justify-center px-16">
            <div className="relative w-full h-full max-w-5xl mx-auto">
              <Image
                src={sorted[lightboxIndex].url}
                alt={`${title} — photo ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Nav arrows */}
            {sorted.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          <div className="flex items-center justify-center gap-2 px-6 py-4 overflow-x-auto">
            {sorted.map((img, i) => (
              <button
                key={img.publicId}
                onClick={() => setLightboxIndex(i)}
                className={cn(
                  'relative h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                  i === lightboxIndex ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-75'
                )}
              >
                <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
