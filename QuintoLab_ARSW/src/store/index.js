import { combineReducers, configureStore } from '@reduxjs/toolkit'
import blueprintsReducer from '../features/blueprints/blueprintsSlice.js'
import authReducer, { logout } from '../features/auth/authSlice.js'
import { onUnauthorized } from '../services/httpClient.js'

const rootReducer = combineReducers({
  blueprints: blueprintsReducer,
  auth: authReducer,
})

// Fábrica para poder crear stores aislados en los tests.
export const makeStore = (preloadedState) =>
  configureStore({ reducer: rootReducer, preloadedState })

const store = makeStore()

// Si el backend responde 401, el token ya no sirve: sincronizamos Redux.
onUnauthorized(() => store.dispatch(logout()))

export default store
