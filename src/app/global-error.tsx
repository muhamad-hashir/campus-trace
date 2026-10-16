'use client'

// Root error boundary: renders when the layout itself throws. Next requires
// its own <html> and <body> here, outside the normal root layout.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: '#fafafa',
          color: '#0a0a0a',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 420 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            CampusTrace hit an unexpected error
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '1.5rem' }}>
            Please try again. If the problem persists, come back in a few minutes.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#171717',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
