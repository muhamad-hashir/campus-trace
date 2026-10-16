# CampusTrace — Campus Lost & Found

CampusTrace is a web app for university students to post, search, and reclaim lost and found items on campus. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase** (Auth, Postgres, Storage).

## Features

- **Email/password auth** — sign up with `username` + `full_name` (stored on the `profiles` table via a DB trigger), email confirmation flow, session persistence, and protected routes.
- **Post items** — report something *Lost* or *Found* with title, category, location, date, description, and an optional photo. Images are validated (extension, MIME type, and magic-byte content check), then re-encoded and compressed client-side (`browser-image-compression`) before upload to Supabase Storage.
- **Live feed** — home page lists items newest-first with a debounced search bar (title + description), Type filter (All / Lost / Found), and Category filter. Status badges: LOST (red), FOUND (green), RESOLVED (gray).
- **Item details** — full item view with large image and a contact card (`mailto:` / `tel:`) for the poster.
- **Dashboard** — private per-user page: view your posts, mark items Resolved (and reopen), or delete them (removes the Storage image too).
- **Hardened uploads** — only genuine JPEG / PNG / WebP photos are accepted; renamed archives, executables, SVGs, and other payloads are rejected by content, not just by filename (see [Upload Security](#upload-security)).
- **Graceful error handling** — styled 404 and error boundaries with retry, plus inline, human-readable error messages for auth and upload failures.

## Tech Stack

| Layer      | Tech                                                        |
| ---------- | ----------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Cache Components), React 19         |
| Language   | TypeScript                                                  |
| Styling    | Tailwind CSS 4 + lucide-react icons                         |
| Auth/DB    | Supabase (`@supabase/ssr`, `@supabase/supabase-js`)         |
| Storage    | Supabase Storage — public `item-images` bucket              |
| Images     | `browser-image-compression` (client-side, ≤0.6 MB / 1600px) |

## Project Structure

```
src/
├── app/
│   ├── auth/confirm/route.ts    # Email-confirmation code → session exchange
│   ├── dashboard/               # Per-user management (resolve/delete)
│   ├── items/[id]/page.tsx      # Item detail page
│   ├── items/new/               # Create post (form + validation + upload)
│   ├── login/                   # Sign in (+ Suspense-wrapped form)
│   ├── signup/                  # Sign up (passes metadata to profiles trigger)
│   ├── error.tsx                # Route error boundary (retry / go home)
│   ├── global-error.tsx         # Root boundary for layout-level crashes
│   ├── not-found.tsx            # Styled 404
│   ├── layout.tsx               # Root layout with session-aware Navbar
│   ├── page.tsx                 # Feed: query + filters + card grid
│   └── globals.css              # Tailwind + autofill/color-scheme fixes
├── components/
│   ├── FeedFilters.tsx          # Debounced search + type/category filters
│   ├── ItemCard.tsx             # Feed card
│   ├── Navbar.tsx               # Session-aware server navbar
│   ├── NavbarUserMenu.tsx       # User dropdown + sign out
│   └── FooterYear.tsx           # Prerender-safe copyright year
├── middleware.ts                # Session refresh + route protection
└── utils/
    ├── imageValidation.ts       # Upload allowlist + magic-byte sniffing
    └── supabase/
        ├── client.ts            # Browser client
        └── server.ts            # Server/RSC client
```

## Database Schema (Supabase)

- **`profiles`** — `id` (uuid, PK → `auth.users`), `username` (unique), `full_name`, `email`, optional `student_id`, `phone`, `created_at`.
- **`items`** — `id`, `user_id` (→ `profiles.id`), `title`, `description`, `category`, `type` (`LOST`/`FOUND`), `location`, `date_occurred`, `image_url` (optional), `status` (`OPEN`/`RESOLVED`), `created_at`.

A database trigger copies the signup metadata (`username`, `full_name`) from `auth.users` into `profiles`.

### Row-Level Security

| Table / Bucket        | Policy                                                        |
| --------------------- | ------------------------------------------------------------- |
| `items` SELECT        | Public                                                        |
| `items` INSERT        | Authenticated users                                           |
| `items` UPDATE/DELETE | Creator only (`auth.uid() = user_id`)                         |
| `item-images`         | Public read; uploads restricted to authenticated users        |

## Upload Security

Anyone can upload to a shared bucket, so the upload path assumes hostile input and validates it at three independent layers **before** anything is sent to Storage:

1. **File allowlist** — only `.jpg`, `.jpeg`, `.png`, `.webp` extensions and matching declared MIME types are accepted (`src/utils/imageValidation.ts`). SVG is deliberately excluded: browsers render it inline, so an uploaded SVG can carry scripts — a stored-XSS vector, not just a picture. GIF and everything else are also excluded.
2. **Size cap** — files over 10 MB are rejected before any processing.
3. **Magic-byte content sniffing** — the file's leading bytes are compared against the real JPEG (`FF D8 FF`), PNG (`89 50 4E 47 …`), and WebP (`RIFF…WEBP`) signatures. A `.zip`, `.exe`, or any other payload renamed to `.jpg` fails here even if it declares a spoofed `image/*` MIME type.

The picked file is then **re-encoded to a clean JPEG** through the canvas-based compression pipeline — so the object that lands in the bucket is always genuine JPEG pixels with any non-image payload stripped — and the compressed blob is sniffed a final time before upload. Upload paths are namespaced per user (`<user.id>/<timestamp>-photo.jpg`) and sanitized.

**Defense in depth (recommended, one-time in the Supabase dashboard):** the client checks above stop honest mistakes and scripted abuse through the app, but a bucket policy is what stops a direct API call with stolen keys. In **Storage → `item-images` → Settings**:

- Set **Allowed MIME types** to `image/jpeg, image/png, image/webp`.
- Set **File size limit** to 10 MB.
- Keep the bucket policy: public `SELECT`, `INSERT` restricted to authenticated users.

## Error Handling

| Layer             | Behavior                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Route errors      | `src/app/error.tsx` — styled boundary with **Try again** (resets the segment) and a link to the feed |
| Layout crashes    | `src/app/global-error.tsx` — minimal root boundary, always renderable                                |
| Missing pages     | `src/app/not-found.tsx` — styled 404 (unknown routes and deleted items)                               |
| Uploads           | Inline, actionable messages for each rejection reason (type, size, content, permission, network)      |
| Auth              | Sign-in/up errors render in the form; sign-out failures still route to `/login` and refresh session   |
| Dashboard actions | Resolve/reopen/delete failures surface inline without losing the row                                  |

Errors also `console.error` with the Next.js `digest` so production incidents can be correlated with server logs.

## Getting Started

### 1. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Create the `profiles` and `items` tables (schema above) with the RLS policies from the table above, plus the signup-metadata trigger on `auth.users`.
3. Create a **public** Storage bucket named `item-images` (authenticated uploads only).

### 2. Set environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your project URL and anon (publishable) key from **Supabase → Settings → API**.

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command           | Purpose                            |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Dev server (Turbopack)             |
| `npm run build`   | Production build                   |
| `npm run start`   | Serve the production build         |
| `npm run lint`    | ESLint (next/core-web-vitals + TS) |
| `npx tsc --noEmit`| Typecheck                          |

## Deployment Notes

- Next.js 16 runs with `cacheComponents: true`; pages that read `Date.now()` (inside Supabase's session checks) call `await connection()` to opt into request-time rendering.
- All env vars are `NEXT_PUBLIC_*` (safe for the browser); never expose the service-role key.
