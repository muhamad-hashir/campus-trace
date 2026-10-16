/**
 * Strict image-upload validation for the `item-images` storage bucket.
 *
 * Defense in depth: anything that is not a genuine JPEG, PNG, or WebP is
 * rejected — by extension, by declared MIME type, and by magic-byte content
 * sniffing. A `.zip` (or any other payload) renamed to `.jpg` fails the
 * content check even when the browser reports a spoofed `image/*` type.
 * SVG is deliberately excluded: it can embed scripts and is served inline
 * by the public bucket, so it is an XSS vector, not just an image.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const

/** Hard cap before compression, to keep the client-side pipeline cheap. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

export type ImageValidationResult =
  | { ok: true; mime: string }
  | { ok: false; reason: string }

function extensionOf(name: string): string {
  const index = name.lastIndexOf('.')
  return index === -1 ? '' : name.slice(index).toLowerCase()
}

/**
 * Synchronous first-pass checks on the picked file: extension allowlist,
 * declared MIME allowlist, and size cap. Content bytes are checked separately
 * (async) via `sniffImageMime`.
 */
export function validateImageFile(file: {
  name: string
  type: string
  size: number
}): ImageValidationResult {
  if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name) as (typeof ALLOWED_EXTENSIONS)[number])) {
    return {
      ok: false,
      reason: 'Only JPG, PNG, or WebP photos are allowed.',
    }
  }

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      reason: 'That file is not a supported photo (JPG, PNG, or WebP).',
    }
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      reason: 'Photo is too large. Please choose one under 10 MB.',
    }
  }

  return { ok: true, mime: file.type }
}

interface SignatureRule {
  mime: string
  check: (b: Uint8Array) => boolean
}

/** First-byte signatures for the allowed formats. */
const SIGNATURES: SignatureRule[] = [
  // JPEG: FF D8 FF (+ any third byte variant such as E0/E1/EE/DB)
  {
    mime: 'image/jpeg',
    check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  {
    mime: 'image/png',
    check: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  // WebP: "RIFF" .... "WEBP"
  {
    mime: 'image/webp',
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
]

/**
 * Reads the leading bytes of a Blob and returns the image MIME type its
 * content actually is, or null when the bytes match no allowed signature.
 * This is what catches renamed archives/executables regardless of the
 * filename or the browser-reported MIME type.
 */
export async function sniffImageMime(blob: Blob): Promise<string | null> {
  const header = new Uint8Array(await blob.slice(0, 16).arrayBuffer())
  if (header.length < 12) return null

  for (const rule of SIGNATURES) {
    if (rule.check(header)) return rule.mime
  }
  return null
}

/**
 * Full content validation for a Blob that is about to be uploaded: its bytes
 * must match one of the allowed image signatures.
 */
export async function validateImageBlob(blob: Blob): Promise<ImageValidationResult> {
  const mime = await sniffImageMime(blob)
  if (!mime) {
    return {
      ok: false,
      reason: "That file's contents are not a real photo (JPG, PNG, or WebP). If you renamed another file type, please pick the original photo instead.",
    }
  }
  return { ok: true, mime }
}
