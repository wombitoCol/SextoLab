// Implementación mock: datos de prueba en memoria, sin backend.
// Debe cumplir la misma interfaz que apiclient.js.

const DB = [
  {
    author: 'juan',
    name: 'casa-1',
    points: [
      { x: 20, y: 20 },
      { x: 200, y: 20 },
      { x: 200, y: 150 },
      { x: 20, y: 150 },
      { x: 20, y: 20 },
    ],
  },
  {
    author: 'juan',
    name: 'techo',
    points: [
      { x: 20, y: 150 },
      { x: 110, y: 60 },
      { x: 200, y: 150 },
    ],
  },
  {
    author: 'maria',
    name: 'garage',
    points: [
      { x: 40, y: 40 },
      { x: 260, y: 40 },
      { x: 260, y: 180 },
    ],
  },
]

// Simula latencia de red para que loading/error se sientan reales en la UI.
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

// Copias para que Redux (que congela su estado) nunca comparta objetos con DB.
const clone = (v) => structuredClone(v)

const notFound = (msg) => {
  const err = new Error(msg)
  err.response = { status: 404 }
  return err
}

export async function getAll() {
  await delay()
  return clone(DB)
}

export async function getByAuthor(author) {
  await delay()
  const items = DB.filter((bp) => bp.author === author)
  if (!items.length) throw notFound(`No se encontraron blueprints para el autor "${author}"`)
  return clone(items)
}

export async function getByAuthorAndName(author, name) {
  await delay()
  const bp = DB.find((b) => b.author === author && b.name === name)
  if (!bp) throw notFound(`Blueprint "${name}" de "${author}" no encontrado`)
  return clone(bp)
}

export async function create(blueprint) {
  await delay()
  if (DB.some((b) => b.author === blueprint.author && b.name === blueprint.name)) {
    const err = new Error(`Ya existe el blueprint "${blueprint.name}" de "${blueprint.author}"`)
    err.response = { status: 409 }
    throw err
  }
  DB.push(clone(blueprint))
  return clone(blueprint)
}

export async function update(author, name, blueprint) {
  await delay()
  const idx = DB.findIndex((b) => b.author === author && b.name === name)
  if (idx === -1) throw notFound(`Blueprint "${name}" de "${author}" no encontrado`)
  DB[idx] = { ...clone(blueprint), author, name }
  return clone(DB[idx])
}

export async function remove(author, name) {
  await delay()
  const idx = DB.findIndex((b) => b.author === author && b.name === name)
  if (idx === -1) throw notFound(`Blueprint "${name}" de "${author}" no encontrado`)
  DB.splice(idx, 1)
  return { author, name }
}

// Login simulado: cualquier usuario/contraseña no vacíos obtiene un token falso.
export async function login(username, password) {
  await delay()
  if (!username || !password) {
    const err = new Error('Credenciales inválidas')
    err.response = { status: 401 }
    throw err
  }
  return `mock-token-${username}`
}
