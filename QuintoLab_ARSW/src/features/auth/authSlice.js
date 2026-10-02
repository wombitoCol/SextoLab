import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import blueprintsService from '../../services/blueprintsService.js'

const readToken = () => {
  try {
    return localStorage.getItem('token')
  } catch {
    return null
  }
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const token = await blueprintsService.login(username, password)
      if (!token) throw new Error('El servidor no devolvió un token')
      localStorage.setItem('token', token)
      return token
    } catch {
      return rejectWithValue('Credenciales inválidas o servidor no disponible')
    }
  },
)

const slice = createSlice({
  name: 'auth',
  initialState: { token: readToken(), status: 'idle', error: null },
  reducers: {
    logout: (s) => {
      localStorage.removeItem('token')
      s.token = null
      s.status = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => {
        s.status = 'loading'
        s.error = null
      })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'succeeded'
        s.token = a.payload
      })
      .addCase(login.rejected, (s, a) => {
        s.status = 'failed'
        s.error = a.payload
      })
  },
})

export const { logout } = slice.actions
export const selectIsAuthenticated = (s) => Boolean(s.auth.token)
export default slice.reducer
