export default function ErrorBanner({ message, onRetry, retryLabel = 'Reintentar' }) {
  if (!message) return null
  return (
    <div className="banner error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  )
}
