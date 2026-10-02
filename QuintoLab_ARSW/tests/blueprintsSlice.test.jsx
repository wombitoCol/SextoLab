import { describe, it, expect } from 'vitest'
import reducer, {
  deleteBlueprint,
  fetchByAuthor,
  initialState,
  selectTopBlueprints,
  updateBlueprint,
} from '../src/features/blueprints/blueprintsSlice.js'

const bp = (name, n, author = 'ana') => ({
  author,
  name,
  points: Array.from({ length: n }, (_, i) => ({ x: i, y: i })),
})

const loaded = () => ({
  ...initialState,
  byAuthor: { ana: [bp('a', 2), bp('b', 4)] },
  current: bp('a', 2),
})

// Acciones de thunk construidas a mano para probar los reducers de forma pura.
const act = (thunk, phase, arg, extra = {}) => ({
  type: thunk[phase].type,
  meta: { arg, requestId: 'req-1', requestStatus: phase },
  ...extra,
})

describe('blueprints slice', () => {
  it('should initialize correctly', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.authors).toEqual([])
    expect(state.status.byAuthor).toBe('idle')
  })

  it('fetchByAuthor: pending → loading, fulfilled guarda items por autor', () => {
    let s = reducer(initialState, act(fetchByAuthor, 'pending', 'ana'))
    expect(s.status.byAuthor).toBe('loading')
    s = reducer(
      s,
      act(fetchByAuthor, 'fulfilled', 'ana', { payload: { author: 'ana', items: [bp('a', 1)] } }),
    )
    expect(s.status.byAuthor).toBe('succeeded')
    expect(s.byAuthor.ana).toHaveLength(1)
  })

  it('fetchByAuthor: rejected guarda el error', () => {
    const s = reducer(initialState, act(fetchByAuthor, 'rejected', 'x', { payload: 'boom' }))
    expect(s.status.byAuthor).toBe('failed')
    expect(s.error.byAuthor).toBe('boom')
  })

  it('updateBlueprint aplica el cambio de forma optimista y lo confirma', () => {
    const arg = { author: 'ana', name: 'a', points: [{ x: 9, y: 9 }] }
    let s = reducer(loaded(), act(updateBlueprint, 'pending', arg))
    expect(s.byAuthor.ana[0].points).toEqual(arg.points)
    expect(s.current.points).toEqual(arg.points)
    s = reducer(s, act(updateBlueprint, 'fulfilled', arg, { payload: arg }))
    expect(s.current.points).toEqual(arg.points)
    expect(s.rollback).toEqual({})
  })

  it('updateBlueprint revierte si el servidor falla', () => {
    const arg = { author: 'ana', name: 'a', points: [{ x: 9, y: 9 }] }
    let s = reducer(loaded(), act(updateBlueprint, 'pending', arg))
    s = reducer(s, act(updateBlueprint, 'rejected', arg, { payload: 'nope' }))
    expect(s.byAuthor.ana[0].points).toHaveLength(2)
    expect(s.current.points).toHaveLength(2)
    expect(s.error.save).toBe('nope')
  })

  it('deleteBlueprint quita el plano de forma optimista y revierte si falla', () => {
    const arg = { author: 'ana', name: 'a' }
    let s = reducer(loaded(), act(deleteBlueprint, 'pending', arg))
    expect(s.byAuthor.ana.map((b) => b.name)).toEqual(['b'])
    expect(s.current).toBeNull()
    s = reducer(s, act(deleteBlueprint, 'rejected', arg, { payload: 'nope' }))
    expect(s.byAuthor.ana.map((b) => b.name)).toEqual(['a', 'b'])
    expect(s.current.name).toBe('a')
  })

  it('selectTopBlueprints devuelve el top-5 por puntos y está memoizado', () => {
    const blueprints = {
      ...initialState,
      byAuthor: {
        ana: [bp('a', 1), bp('b', 7), bp('c', 3)],
        leo: [bp('d', 9, 'leo'), bp('e', 2, 'leo'), bp('f', 5, 'leo')],
      },
    }
    const state = { blueprints }
    const top = selectTopBlueprints(state)
    expect(top.map((t) => t.name)).toEqual(['d', 'b', 'f', 'c', 'e'])
    expect(selectTopBlueprints(state)).toBe(top)
  })
})
