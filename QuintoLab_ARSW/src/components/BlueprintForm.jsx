import { useState } from 'react'
import BlueprintCanvas from './BlueprintCanvas.jsx'

const parsePoints = (json) => {
  try {
    const points = JSON.parse(json)
    return Array.isArray(points) ? points : null
  } catch {
    return null
  }
}

export default function BlueprintForm({ onSubmit, submitting = false }) {
  const [author, setAuthor] = useState('')
  const [name, setName] = useState('')
  const [pointsJSON, setPointsJSON] = useState('[{"x":10,"y":10},{"x":40,"y":60}]')
  const [error, setError] = useState(null)

  const points = parsePoints(pointsJSON)

  const addPoint = (p) => setPointsJSON(JSON.stringify([...(points ?? []), p]))

  const handle = (e) => {
    e.preventDefault()
    if (!points) return setError('JSON de puntos inválido')
    if (!author.trim() || !name.trim()) return setError('Autor y nombre son obligatorios')
    setError(null)
    onSubmit({ author: author.trim(), name: name.trim(), points })
  }

  return (
    <form onSubmit={handle} className="card">
      <h3 style={{ marginTop: 0 }}>Crear Blueprint</h3>
      <div className="grid cols-2">
        <div>
          <label htmlFor="bp-author">Autor</label>
          <input
            id="bp-author"
            className="input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="juan.perez"
          />
        </div>
        <div>
          <label htmlFor="bp-name">Nombre</label>
          <input
            id="bp-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mi-dibujo"
          />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Dibuja haciendo click en el lienzo</label>
        <BlueprintCanvas id="blueprint-form-canvas" points={points ?? []} onAddPoint={addPoint} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label htmlFor="bp-points">Puntos (JSON)</label>
        <textarea
          id="bp-points"
          className="input"
          rows="4"
          value={pointsJSON}
          onChange={(e) => setPointsJSON(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-error" role="alert">
          {error}
        </p>
      )}
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn primary" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" className="btn" onClick={() => setPointsJSON('[]')}>
          Limpiar lienzo
        </button>
      </div>
    </form>
  )
}
