import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { fetchBlueprint } from '../features/blueprints/blueprintsSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'

export default function BlueprintDetailPage() {
  const { author, name } = useParams()
  const dispatch = useDispatch()
  const { current: bp, status, error } = useSelector((s) => s.blueprints)
  const load = () => dispatch(fetchBlueprint({ author, name }))

  useEffect(() => {
    dispatch(fetchBlueprint({ author, name }))
  }, [author, name, dispatch])

  if (error.current) return <ErrorBanner message={error.current} onRetry={load} />

  // `current` puede ser otro plano mientras llega el nuevo.
  if (status.current === 'loading' || bp?.author !== author || bp?.name !== name)
    return (
      <div className="card">
        <p className="muted">Cargando...</p>
      </div>
    )

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{bp.name}</h2>
      <p>
        <strong>Autor:</strong> {bp.author}
      </p>
      <p>
        <strong>Puntos:</strong> {bp.points?.length || 0}
      </p>
      <BlueprintCanvas points={bp.points || []} />
    </div>
  )
}
