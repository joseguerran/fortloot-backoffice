'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4">Error</h1>
            <p className="text-xl text-gray-400 mb-8">Algo salió mal</p>
            <button
              onClick={() => reset()}
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
