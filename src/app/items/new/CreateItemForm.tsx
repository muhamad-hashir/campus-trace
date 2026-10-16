'use client'

import { useState, useSyncExternalStore, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import imageCompression from 'browser-image-compression'
import {
  validateImageFile,
  validateImageBlob,
  ALLOWED_EXTENSIONS,
} from '@/utils/imageValidation'
import { Loader2, ImagePlus, MapPin, X, Check } from 'lucide-react'

const inputClasses =
  'w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-colors'

const CATEGORIES = [
  'Electronics',
  'Keys',
  'Wallet/Cards',
  'ID Card',
  'Clothing',
  'Books',
  'Accessories',
  'Other',
] as const

const emptySubscribe = () => () => {}

type ItemType = 'LOST' | 'FOUND'
type UploadStage = 'idle' | 'compressing' | 'uploading' | 'submitting'

// Today, as an ISO date string for the form's default. Empty during server
// render; useSyncExternalStore hydrates it client-side without an effect.
function useTodayISODate() {
  return useSyncExternalStore(
    emptySubscribe,
    () => new Date().toISOString().slice(0, 10),
    () => ''
  )
}

// Map raw Supabase/network errors to messages a student can act on.
function friendlyUploadError(err: unknown): string {
  const message = err instanceof Error ? err.message.toLowerCase() : ''

  if (message.includes('row-level security') || message.includes('permission')) {
    return 'You do not have permission to do that. Please sign in again and retry.'
  }
  if (message.includes('payload too large') || message.includes('exceeded')) {
    return 'The photo or post is too large. Try a smaller photo.'
  }
  if (message.includes('fetch') || message.includes('network')) {
    return 'Connection problem. Check your internet and try again.'
  }
  if (message.includes('duplicate')) {
    return 'This post was already created. Check your dashboard.'
  }
  return err instanceof Error && err.message
    ? err.message
    : 'Something went wrong. Please try again.'
}

export default function CreateItemForm() {
  const router = useRouter()
  const currentUserRef = useRef<{ id: string } | null>(null)

  const [title, setTitle] = useState('')
  const [itemType, setItemType] = useState<ItemType>('LOST')
  const [category, setCategory] = useState<string>('')
  const [location, setLocation] = useState('')
  const [dateOccurred, setDateOccurred] = useState(useTodayISODate())
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<UploadStage>('idle')

  const busy = stage !== 'idle'

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setError(null)

    if (imagePreview) URL.revokeObjectURL(imagePreview)
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      return
    }

    // First pass: extension, declared MIME type, and size — all synchronous.
    // A renamed .zip or .exe fails here immediately.
    const result = validateImageFile(file)
    if (!result.ok) {
      setError(result.reason)
      e.target.value = ''
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!category) {
      setError('Please choose a category.')
      return
    }

    const supabase = createClient()

    // Double-check the user is signed in (middleware also guards this route).
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be signed in to post an item.')
        return
      }
      currentUserRef.current = user
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
      return
    }

    const user = currentUserRef.current
    if (!user) {
      setError('You must be signed in to post an item.')
      return
    }

    try {
      // 1. Validate content and re-encode the image client-side before any upload.
      let imageUrl: string | null = null
      if (imageFile) {
        // Content check: the file's actual bytes must be a real image. This
        // catches archives/executables renamed to .jpg that the first pass
        // could not see (a spoofed browser MIME type).
        setStage('compressing')
        const blobResult = await validateImageBlob(imageFile)
        if (!blobResult.ok) {
          setError(blobResult.reason)
          setStage('idle')
          removeImage()
          return
        }

        // Re-encode through the compression pipeline: canvas output is a
        // genuine JPEG, so any non-image payload is stripped before upload.
        const compressed = await imageCompression(imageFile, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: 'image/jpeg',
        })

        // Final gate: verify the bytes that will actually be uploaded.
        const compressedCheck = await validateImageBlob(compressed)
        if (!compressedCheck.ok) {
          setError(compressedCheck.reason)
          setStage('idle')
          removeImage()
          return
        }

        // 2. Upload the verified JPEG to the item-images storage bucket.
        setStage('uploading')
        const path = `${user.id}/${Date.now()}-photo.jpg`

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(path, compressed, {
            contentType: 'image/jpeg',
            upsert: false,
          })

        if (uploadError) {
          throw uploadError
        }

        const { data } = supabase.storage.from('item-images').getPublicUrl(path)
        imageUrl = data.publicUrl
      }

      // 3. Insert the item row.
      setStage('submitting')
      const { data, error: insertError } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          title,
          description,
          category,
          type: itemType,
          location,
          date_occurred: dateOccurred,
          image_url: imageUrl,
          status: 'OPEN',
        })
        .select('id')
        .single()

      if (insertError) {
        throw insertError
      }

      removeImage()
      router.push('/items/' + data.id)
      router.refresh()
    } catch (err) {
      setError(friendlyUploadError(err))
      setStage('idle')
      return
    }

    setStage('idle')
  }

  const stageLabel =
    stage === 'compressing'
      ? 'Compressing image...'
      : stage === 'uploading'
        ? 'Uploading image...'
        : stage === 'submitting'
          ? 'Creating post...'
          : 'Post Item'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Post an Item</h1>
          <p className="text-sm text-gray-600 mt-1">
            Report something you lost or found around campus.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What happened?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setItemType('LOST')}
                aria-pressed={itemType === 'LOST'}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  itemType === 'LOST'
                    ? 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {itemType === 'LOST' && <Check className="w-4 h-4" aria-hidden="true" />}
                I Lost Something
              </button>
              <button
                type="button"
                onClick={() => setItemType('FOUND')}
                aria-pressed={itemType === 'FOUND'}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  itemType === 'FOUND'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {itemType === 'FOUND' && <Check className="w-4 h-4" aria-hidden="true" />}
                I Found Something
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Black Dell laptop charger"
              className={inputClasses}
            />
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
                Category
              </label>
              <select
                id="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClasses}
              >
                <option value="" disabled>
                  Select a category
                </option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                <input
                  id="location"
                  type="text"
                  required
                  maxLength={120}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Library 2nd Floor"
                  className='w-full pl-9 pr-3.5 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-colors'
                />
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="date-occurred"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Date {itemType === 'LOST' ? 'lost' : 'found'}
            </label>
            <input
              id="date-occurred"
              type="date"
              required
              value={dateOccurred}
              onChange={(e) => setDateOccurred(e.target.value)}
              className={`${inputClasses} sm:w-56`}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="description"
              required
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item: color, brand, stickers, contents, where exactly it was left or picked up..."
              className={`${inputClasses} resize-none leading-relaxed`}
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Photo <span className="text-gray-400 font-normal">(optional, compressed before upload)</span>
            </label>
            {imagePreview ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Selected item preview"
                  className="h-40 rounded-lg border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove image"
                  className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-500 cursor-pointer transition-colors">
                <ImagePlus className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">Click to choose a photo</span>
                <input
                  type="file"
                  accept={ALLOWED_EXTENSIONS.join(',')}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-7 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {stageLabel}
          </button>
        </form>
      </div>
    </div>
  )
}
