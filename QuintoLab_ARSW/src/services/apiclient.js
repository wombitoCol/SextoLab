// Implementación real: consume el backend con Axios (Labs 3 y 4).
// Interfaz: getAll, getByAuthor, getByAuthorAndName, create, update, remove, login.
// Debe cumplir la misma interfaz que apimock.js.
import http from './httpClient.js'

export async function getAll() {
  const { data } = await http.get('/v1/blueprints')
  return data.data
}

export async function getByAuthor(author) {
  const { data } = await http.get(`/v1/blueprints/${encodeURIComponent(author)}`)
  return data.data
}

export async function getByAuthorAndName(author, name) {
  const { data } = await http.get(
    `/v1/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
  )
  return data.data
}

export async function create(blueprint) {
  const { data } = await http.post('/v1/blueprints', blueprint)
  return data.data
}

export async function update(author, name, blueprint) {
  const { data } = await http.put(
    `/v1/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
    blueprint,
  )
  return data?.data ?? { ...blueprint, author, name }
}

export async function remove(author, name) {
  await http.delete(`/v1/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`)
  return { author, name }
}

// El endpoint de auth vive fuera de /api (p. ej. http://localhost:8080/auth/login).
export async function login(username, password) {
  const authBaseURL = http.defaults.baseURL.replace(/\/api\/?$/, '')
  const { data } = await http.post('/auth/login', { username, password }, { baseURL: authBaseURL })
  return data.access_token ?? data.token
}
