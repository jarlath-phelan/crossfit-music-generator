'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  onImageCapture: (base64: string, mediaType: string) => void
  onClear: () => void
  disabled?: boolean
  hasImage: boolean
}

const MAX_IMAGE_SIZE = 1024 * 1024 // 1MB after compression
const MAX_DIMENSION = 1568 // Claude Vision max recommended dimension

export function ImageUpload({ onImageCapture, onClear, disabled, hasImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback(async (file: File) => {
    const mediaType = file.type || 'image/jpeg'

    // Compress if needed
    const base64 = await compressImage(file)
    setPreview(base64)
    onImageCapture(base64.split(',')[1], mediaType) // Strip data:image/...;base64, prefix
  }, [onImageCapture])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }

  const handleClear = () => {
    setPreview(null)
    onClear()
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Workout whiteboard photo"
            className="w-full max-h-64 object-contain rounded-lg border bg-muted"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Camera capture (mobile-first) */}
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>

          {/* File picker */}
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Take photo of workout"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload workout image"
      />
    </div>
  )
}

/**
 * Compress an image file to fit within size and dimension constraints.
 * Returns a data URL (base64 with prefix).
 */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')

        // Scale down if needed
        let { width, height } = img
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        // Try JPEG compression at decreasing quality until under size limit
        let quality = 0.85
        let result = canvas.toDataURL('image/jpeg', quality)

        while (result.length > MAX_IMAGE_SIZE * 1.37 && quality > 0.3) {
          // 1.37 accounts for base64 overhead
          quality -= 0.1
          result = canvas.toDataURL('image/jpeg', quality)
        }

        resolve(result)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
