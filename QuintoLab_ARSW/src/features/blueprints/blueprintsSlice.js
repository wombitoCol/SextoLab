import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import blueprintsService from '../../services/blueprintsService.js'

// Los errores de Axios traen el detalle del backend en response.data; el mock usa message.
const errorMessage = (err) => err?.response?.data?.message || err?.message || 'Error inesperado'

const withErrorMessage =
  (fn) =>
  async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg)
    } catch (err) {
      return rejectWithValue(errorMessage(err))
    }
  }

export const fetchAuthors = createAsyncThunk(
  'blueprints/fetchAuthors',
  withErrorMessage(async () => {
    const data = await blueprintsService.getAll()
    return [...new Set(data.map((bp) => bp.author))]
  }),
)

export const fetchByAuthor = createAsyncThunk(
  'blueprints/fetchByAuthor',
  withErrorMessage(async (author) => {
    const items = await blueprintsService.getByAuthor(author)
    return { author, items }
  }),
)

export const fetchBlueprint = createAsyncThunk(
  'blueprints/fetchBlueprint',
  withErrorMessage(({ author, name }) => blueprintsService.getByAuthorAndName(author, name)),
)

export const createBlueprint = createAsyncThunk(
  'blueprints/createBlueprint',
  withErrorMessage((payload) => blueprintsService.create(payload)),
)

// Optimistic: el reducer aplica el cambio en `pending` y lo revierte en `rejected`.
export const updateBlueprint = createAsyncThunk(
  'blueprints/updateBlueprint',
  withErrorMessage(({ author, name, points }) =>
    blueprintsService.update(author, name, { author, name, points }),
  ),
)

export const deleteBlueprint = createAsyncThunk(
  'blueprints/deleteBlueprint',
  withErrorMessage(({ author, name }) => blueprintsService.remove(author, name)),
)

const KEYS = ['authors', 'byAuthor', 'current', 'save']

export const initialState = {
  authors: [],
  byAuthor: {},
  current: null,
  status: Object.fromEntries(KEYS.map((k) => [k, 'idle'])),
  error: Object.fromEntries(KEYS.map((k) => [k, null])),
  // Snapshots para revertir updates optimistas, indexados por requestId.
  rollback: {},
}

const sameBp = (a, b) => a?.author === b?.author && a?.name === b?.name

const snapshot = (s, { author }) => ({
  author,
  list: s.byAuthor[author] ? JSON.parse(JSON.stringify(s.byAuthor[author])) : undefined,
  current: s.current ? JSON.parse(JSON.stringify(s.current)) : null,
})

const restore = (s, requestId) => {
  const snap = s.rollback[requestId]
  if (!snap) return
  if (snap.list !== undefined) s.byAuthor[snap.author] = snap.list
  s.current = snap.current
  delete s.rollback[requestId]
}

// Registra pending/fulfilled/rejected de un thunk sobre status[key]/error[key].
const track = (builder, thunk, key, { pending, fulfilled, rejected } = {}) => {
  builder
    .addCase(thunk.pending, (s, a) => {
      s.status[key] = 'loading'
      s.error[key] = null
      pending?.(s, a)
    })
    .addCase(thunk.fulfilled, (s, a) => {
      s.status[key] = 'succeeded'
      fulfilled?.(s, a)
    })
    .addCase(thunk.rejected, (s, a) => {
      s.status[key] = 'failed'
      s.error[key] = a.payload ?? a.error.message
      rejected?.(s, a)
    })
}

const slice = createSlice({
  name: 'blueprints',
  initialState,
  reducers: {
    clearError: (s, a) => {
      s.error[a.payload] = null
    },
  },
  extraReducers: (builder) => {
    track(builder, fetchAuthors, 'authors', {
      fulfilled: (s, a) => {
        s.authors = a.payload
      },
    })
    track(builder, fetchByAuthor, 'byAuthor', {
      fulfilled: (s, a) => {
        s.byAuthor[a.payload.author] = a.payload.items
      },
    })
    track(builder, fetchBlueprint, 'current', {
      fulfilled: (s, a) => {
        s.current = a.payload
      },
    })
    track(builder, createBlueprint, 'save', {
      fulfilled: (s, a) => {
        const bp = a.payload
        if (s.byAuthor[bp.author]) s.byAuthor[bp.author].push(bp)
        if (!s.authors.includes(bp.author)) s.authors.push(bp.author)
      },
    })
    track(builder, updateBlueprint, 'save', {
      pending: (s, a) => {
        const next = a.meta.arg
        s.rollback[a.meta.requestId] = snapshot(s, next)
        const list = s.byAuthor[next.author]
        const idx = list ? list.findIndex((bp) => sameBp(bp, next)) : -1
        if (idx !== -1) list[idx] = { ...list[idx], points: next.points }
        if (sameBp(s.current, next)) s.current.points = next.points
      },
      fulfilled: (s, a) => {
        delete s.rollback[a.meta.requestId]
      },
      rejected: (s, a) => restore(s, a.meta.requestId),
    })
    track(builder, deleteBlueprint, 'save', {
      pending: (s, a) => {
        const target = a.meta.arg
        s.rollback[a.meta.requestId] = snapshot(s, target)
        if (s.byAuthor[target.author]) {
          s.byAuthor[target.author] = s.byAuthor[target.author].filter((bp) => !sameBp(bp, target))
        }
        if (sameBp(s.current, target)) s.current = null
      },
      fulfilled: (s, a) => {
        delete s.rollback[a.meta.requestId]
      },
      rejected: (s, a) => restore(s, a.meta.requestId),
    })
  },
})

export const { clearError } = slice.actions

// ---- Selectors ----
const EMPTY = []
const selectByAuthor = (s) => s.blueprints.byAuthor

export const selectItemsByAuthor = (s, author) => s.blueprints.byAuthor[author] ?? EMPTY

export const selectTopBlueprints = createSelector([selectByAuthor], (byAuthor) =>
  Object.values(byAuthor)
    .flat()
    .map((bp) => ({ author: bp.author, name: bp.name, count: bp.points?.length ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5),
)

export default slice.reducer
