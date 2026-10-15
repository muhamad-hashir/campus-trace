'use client'

import { useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import imageCompression from 'browser-image-compression'
import { Loader2, ImagePlus, MapPin, X, Check } from 'lucide-react'

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

export default function CreateItemForm() {
  const router = useRouter()

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

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
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
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in to post an item.')
      return
    }

    try {
      // 1. Compress the image client-side before any upload.
      let imageUrl: string | null = null
      if (imageFile) {
        setStage('compressing')
        const compressed = await imageCompression(imageFile, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: 'image/jpeg',
        })

        // 2. Upload to the item-images storage bucket.
        setStage('uploading')
        const ext = (compressed.name.split('.').pop() ?? 'jpg').toLowerCase()
        const safeName = compressed.name.replace(/[^a-zA-Z0-9._-]/g, '_').split('.')[0]
        const path = `${user.id}/${Date.now()}-${safeName}.${ext === 'jpeg' ? 'jpg' : ext}`

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
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      )
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
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Post an Item</h1>
          <p className="text-gray-500 mt-1">
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
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition ${
                  itemType === 'LOST'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {itemType === 'LOST' && <Check className="w-4 h-4" />}
                I Lost Something
              </button>
              <button
                type="button"
                onClick={() => setItemType('FOUND')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition ${
                  itemType === 'FOUND'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {itemType === 'FOUND' && <Check className="w-4 h-4" />}
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
              className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="location"
                  type="text"
                  required
                  maxLength={120}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Library 2nd Floor"
                  className="w-full pl-9 pr-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
              className="w-full sm:w-56 px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
              className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
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
                  className="h-40 rounded-xl border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove image"
                  className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/40 text-gray-500 cursor-pointer transition">
                <ImagePlus className="w-6 h-6" />
                <span className="text-sm">Click to choose a photo</span>
                <input
                  type="file"
                  accept="image/*"
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
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {stageLabel}
          </button>
        </form>
      </div>
    </div>
  )
}
