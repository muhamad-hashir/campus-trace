'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

// Current year for the footer. Empty during server render; useSyncExternalStore
// hydrates it client-side without an effect (new Date() is unstable in
// prerendered HTML under cacheComponents).
export default function FooterYear() {
  const year = useSyncExternalStore(
    emptySubscribe,
    () => new Date().getFullYear(),
    () => 0
  )

  return year ? <>© {year} CampusTrace</> : <>© CampusTrace</>
}
