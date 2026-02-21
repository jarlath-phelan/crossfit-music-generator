'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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
  const [viewfinderActive, setViewfinderActive] = useState(false)
  const [hasGetUserMedia, setHasGetUserMedia] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setHasGetUserMedia(!!navigator.mediaDevices?.getUserMedia)
  }, [])

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setViewfinderActive(false)
  }, [])

  useEffect(() => {
    return stopStream
  }, [stopStream])

  const processImage = useCallback(async (file: File) => {
    const mediaType = file.type || 'image/jpeg'
    const base64 = await compressImage(file)
    setPreview(base64)
    onImageCapture(base64.split(',')[1], mediaType)
  }, [onImageCapture])

  const openViewfinder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      setViewfinderActive(true)
      // Wait for video element to mount, then attach stream
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
    } catch {
      // getUserMedia failed (denied or unavailable) — fall back to file input
      cameraInputRef.current?.click()
    }
  }, [])

  const captureFromViewfinder = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    let width = video.videoWidth
    let height = video.videoHeight

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0, width, height)

    let quality = 0.85
    let result = canvas.toDataURL('image/jpeg', quality)
    while (result.length > MAX_IMAGE_SIZE * 1.37 && quality > 0.3) {
      quality -= 0.1
      result = canvas.toDataURL('image/jpeg', quality)
    }

    stopStream()
    setPreview(result)
    onImageCapture(result.split(',')[1], 'image/jpeg')
  }, [stopStream, onImageCapture])

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

  const handleTakePhoto = () => {
    if (hasGetUserMedia) {
      openViewfinder()
    } else {
      cameraInputRef.current?.click()
    }
  }

  if (viewfinderActive) {
    return (
      <div className="relative rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-h-80 object-contain"
        />
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-4 p-4 bg-gradient-to-t from-black/70">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/20"
            onClick={() => stopStream()}
            aria-label="Cancel"
          >
            <X className="h-5 w-5" />
          </Button>
          <button
            type="button"
            className="h-14 w-14 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 transition-colors"
            onClick={captureFromViewfinder}
            aria-label="Capture photo"
          />
        </div>
      </div>
    )
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
          {/* Camera capture (live viewfinder or fallback) */}
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleTakePhoto}
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
