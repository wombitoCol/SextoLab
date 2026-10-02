// Punto único de cambio entre mock y API real.
// Cambia VITE_USE_MOCK en tu .env — no toques nada más en la app.
import * as apiclient from './apiclient.js'
import * as apimock from './apimock.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const blueprintsService = useMock ? apimock : apiclient

export default blueprintsService
