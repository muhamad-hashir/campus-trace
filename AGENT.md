# AGENT.md: CampusTrace Web Application Specification

## 1. Project Overview & Objective
Build a web application named **CampusTrace** using **Next.js (App Router)**, **React**, **Tailwind CSS**, and **Supabase** for university students to post, search, and reclaim lost and found items on campus.

---

## 2. Tech Stack Requirements
* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS + Lucide React Icons
* **Backend / Database / Auth / Storage:** Supabase
  * `@supabase/supabase-js` & `@supabase/ssr`
* **Image Compression:** `browser-image-compression`

---

## 3. Database Schema (Supabase PostgreSQL)

### `profiles`
* `id` (uuid, Primary Key, references `auth.users`)
* `username` (text, UNIQUE)
* `full_name` (text)
* `email` (text)
* `student_id` (text, optional)
* `phone` (text, optional)
* `created_at` (timestamp)

### `items`
* `id` (uuid, Primary Key)
* `user_id` (uuid, references `profiles.id`)
* `title` (text)
* `description` (text)
* `category` (text) -> e.g., *Electronics, Keys, Wallet/Cards, ID Card, Clothing, Books, Accessories, Other*
* `type` (text) -> `'LOST'` | `'FOUND'`
* `location` (text) -> Specific campus spot (e.g., *Library 2nd Floor, Main Cafeteria, CS Dept Lab 3*)
* `date_occurred` (date) -> Date lost or found
* `image_url` (text, optional)
* `status` (text) -> `'OPEN'` | `'RESOLVED'`
* `created_at` (timestamp)

---

## 4. Key Core Features & UI Components

### Branding
* App Name: **CampusTrace**

### Auth Pages
* `/login` & `/signup`
  * Support email and password authentication with Supabase Auth.
  * Signup form must collect `email`, `password`, `username`, and `full_name`.

### Feed / Home Page (`/`)
* Grid view of lost/found cards with clear status badges (`[LOST - Red]`, `[FOUND - Green]`, `[RESOLVED - Gray]`).
* Filter bar: Filter by Type (*All*, *Lost*, *Found*), Category, and Search Query.
* Cards should display the `username` of the person who posted the item.

### Item Detail Page (`/items/[id]`)
* Full details, location details, high-res image, owner details (including `username`), and contact info.

### Create Post Page (`/items/new`)
* Form with input fields for title, type (Lost/Found), category, location, date, description, and client-side compressed image upload to Supabase Storage bucket (`item-images`).

### User Dashboard (`/dashboard`)
* View "My Posts".
* Toggle item status from `OPEN` to `RESOLVED` when an item is returned.
* Delete or edit posts.

---

## 5. Security & Row-Level Security (RLS) Rules
1. **Items Table:**
   * `SELECT`: Public access (anyone can view active listings).
   * `INSERT`: Authenticated users only.
   * `UPDATE`/`DELETE`: Only the item creator (`auth.uid() == user_id`).
2. **Storage (`item-images` bucket):**
   * Allow public reading of images.
   * Restrict upload permissions to authenticated users.

---

## 6. Development Milestones for Agent

1. **Phase 1: Setup & Infrastructure**
   * Setup Supabase browser and server client context (`@supabase/ssr`).
   * Create base UI navigation bar with **CampusTrace** branding.

2. **Phase 2: Auth & Layout**
   * Implement `/login` and `/signup` pages.
   * Ensure signup inserts `username` and `full_name` into the user metadata so the database trigger can catch it.
   * Handle session persistence and middleware route protection.

3. **Phase 3: Core CRUD & Storage**
   * Build client-side compressed image upload component.
   * Build `/items/new` form logic and database submission.
   * Build main feed (`/`) with live search and category filtering.

4. **Phase 4: Item Details & Management**
   * Implement `/items/[id]` detail view.
   * Implement `/dashboard` for users to resolve or delete their listings.