import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  deleteBlueprint,
  fetchAuthors,
  fetchByAuthor,
  fetchBlueprint,
  selectItemsByAuthor,
  selectTopBlueprints,
  updateBlueprint,
} from '../features/blueprints/blueprintsSlice.js'
import { selectIsAuthenticated } from '../features/auth/authSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { createStompClient, subscribeBlueprint, publishDraw } from '../lib/stompClient.js'

// Backend del broker STOMP (SextoLab) — puerto distinto al del CRUD (Lab 4).
const STOMP_BASE = import.meta.env.VITE_STOMP_BASE || 'http://localhost:8081'

const RT_STATUS_LABEL = {
  off: 'desconectado',
  connecting: 'conectando...',
  connected: 'en vivo',
  error: 'sin conexión (reintentando)',
}

export default function BlueprintsPage() {
  const dispatch = useDispatch()
  const { current, status, error, authors } = useSelector((s) => s.blueprints)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const top = useSelector(selectTopBlueprints)
  const [authorInput, setAuthorInput] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState('')
  const items = useSelector((s) => selectItemsByAuthor(s, selectedAuthor))
  // Puntos del plano actual aún sin guardar: los propios (click) y los que llegan en vivo por STOMP.
  // Se guarda una sola lista para que los puntos remotos no se pierdan mientras uno también dibuja.
  const [working, setWorking] = useState(null)
  const [rtMode, setRtMode] = useState('stomp')
  const [rtStatus, setRtStatus] = useState('off')
  const stompRef = useRef(null)
  // El callback de la suscripción vive más que un render: lee los puntos guardados desde un ref.
  const savedPointsRef = useRef([])
  savedPointsRef.current = current?.points ?? []

  useEffect(() => {
    dispatch(fetchAuthors())
  }, [dispatch])

  useEffect(() => {
    setWorking(null)
  }, [current?.author, current?.name])

  // Conexión STOMP: se suscribe al plano abierto (tópico blueprints.{author}.{name}).
  useEffect(() => {
    if (rtMode !== 'stomp' || !current?.author || !current?.name) {
      setRtStatus('off')
      return undefined
    }
    const { author, name } = current
    const client = createStompClient(STOMP_BASE, { onStatus: setRtStatus })
    stompRef.current = client
    let unsubscribe
    client.onConnect = () => {
      setRtStatus('connected')
      console.info(`STOMP: suscrito a blueprints.${author}.${name}`)
      unsubscribe = subscribeBlueprint(client, author, name, (msg) => {
        // El backend manda solo el/los punto(s) nuevo(s) en cada mensaje, no el historial
        // completo — hay que ir acumulando del lado del cliente.
        setWorking((prev) => [...(prev ?? savedPointsRef.current), ...msg.points])
      })
    }
    client.activate()
    return () => {
      unsubscribe?.()
      client.deactivate()
      stompRef.current = null
    }
  }, [current?.author, current?.name, rtMode])

  const addPoint = (p) => {
    // Con STOMP conectado el punto vuelve por el tópico (también a esta pestaña), así que
    // no se agrega localmente para no duplicarlo. Sin conexión, se dibuja solo en local.
    if (rtMode === 'stomp' && publishDraw(stompRef.current, current.author, current.name, p)) return
    setWorking((prev) => [...(prev ?? savedPointsRef.current), p])
  }

  const totalPoints = useMemo(
    () => items.reduce((acc, bp) => acc + (bp.points?.length || 0), 0),
    [items],
  )

  const getBlueprints = (e) => {
    e?.preventDefault()
    const author = authorInput.trim()
    if (!author) return
    setSelectedAuthor(author)
    dispatch(fetchByAuthor(author))
  }

  const openBlueprint = (bp) => {
    dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))
  }

  const saveWorking = () => {
    dispatch(updateBlueprint({ author: current.author, name: current.name, points: working }))
    setWorking(null)
  }

  const removeCurrent = () => {
    if (!window.confirm(`¿Eliminar "${current.name}"?`)) return
    dispatch(deleteBlueprint({ author: current.author, name: current.name }))
  }

  const canvasPoints = working ?? current?.points ?? []
  const loadingList = status.byAuthor === 'loading'

  return (
    <div className="layout">
      <section className="grid" style={{ gap: 16, alignContent: 'start' }}>
        <form className="card" onSubmit={getBlueprints}>
          <h2 style={{ marginTop: 0 }}>Blueprints</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="input"
              placeholder="Author"
              list="known-authors"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
            />
            <datalist id="known-authors">
              {authors.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            <button className="btn primary" disabled={loadingList}>
              Get blueprints
            </button>
          </div>
          <ErrorBanner message={error.authors} onRetry={() => dispatch(fetchAuthors())} />
        </form>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            {selectedAuthor ? `${selectedAuthor}'s blueprints:` : 'Results'}
          </h3>
          <ErrorBanner
            message={error.byAuthor}
            onRetry={() => dispatch(fetchByAuthor(selectedAuthor))}
          />
          {loadingList && <p className="muted">Cargando...</p>}
          {!items.length && !loadingList && !error.byAuthor && <p>Sin resultados.</p>}
          {!!items.length && (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Blueprint name</th>
                    <th className="num">Number of points</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((bp) => (
                    <tr
                      key={bp.name}
                      className={
                        current?.author === bp.author && current?.name === bp.name
                          ? 'selected'
                          : undefined
                      }
                    >
                      <td>{bp.name}</td>
                      <td className="num">{bp.points?.length || 0}</td>
                      <td className="num">
                        <button className="btn" onClick={() => openBlueprint(bp)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ marginTop: 12, fontWeight: 700 }}>Total user points: {totalPoints}</p>
        </div>

        {!!top.length && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Top 5 por número de puntos</h3>
            <ol className="top-list">
              {top.map((bp) => (
                <li key={`${bp.author}/${bp.name}`}>
                  <span>
                    {bp.name} <span className="muted">({bp.author})</span>
                  </span>
                  <span className="badge">{bp.count}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>
          Current blueprint: <span data-testid="current-name">{current?.name || '—'}</span>
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <label htmlFor="rt-mode">Tiempo real:</label>
          <select
            id="rt-mode"
            className="input"
            style={{ width: 'auto' }}
            value={rtMode}
            onChange={(e) => setRtMode(e.target.value)}
          >
            <option value="none">None</option>
            <option value="stomp">STOMP (Spring)</option>
          </select>
          <span className="badge" data-testid="rt-status">
            {RT_STATUS_LABEL[rtStatus]}
          </span>
        </div>
        <ErrorBanner message={error.current} />
        <ErrorBanner
          message={error.save && `No se pudo guardar: ${error.save}. Cambios revertidos.`}
        />
        {status.current === 'loading' && <p className="muted">Cargando plano...</p>}
        <BlueprintCanvas
          points={canvasPoints}
          onAddPoint={current && isAuthenticated ? addPoint : undefined}
        />
        {current && isAuthenticated && (
          <div className="actions" style={{ marginTop: 12 }}>
            <Link className="btn" to="/blueprints/new">
              Crear
            </Link>
            <button className="btn primary" disabled={!working} onClick={saveWorking}>
              Guardar cambios
            </button>
            <button className="btn" disabled={!working} onClick={() => setWorking(null)}>
              Descartar
            </button>
            <button className="btn danger" onClick={removeCurrent}>
              Eliminar
            </button>
          </div>
        )}
        {current && !isAuthenticated && (
          <p className="muted">Inicia sesión para editar o eliminar este plano.</p>
        )}
      </section>
    </div>
  )
}
