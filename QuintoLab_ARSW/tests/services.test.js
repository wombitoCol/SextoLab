import { describe, it, expect } from 'vitest'
import * as apimock from '../src/services/apimock.js'
import * as apiclient from '../src/services/apiclient.js'

const METHODS = [
  'getAll',
  'getByAuthor',
  'getByAuthorAndName',
  'create',
  'update',
  'remove',
  'login',
]

describe('servicios', () => {
  it('apimock y apiclient exponen la misma interfaz', () => {
    for (const m of METHODS) {
      expect(typeof apimock[m]).toBe('function')
      expect(typeof apiclient[m]).toBe('function')
    }
  })

  it('apimock: create, update y remove modifican los datos en memoria', async () => {
    await apimock.create({ author: 'zoe', name: 'z', points: [] })
    await apimock.update('zoe', 'z', { points: [{ x: 1, y: 1 }] })
    expect((await apimock.getByAuthorAndName('zoe', 'z')).points).toHaveLength(1)
    await apimock.remove('zoe', 'z')
    await expect(apimock.getByAuthor('zoe')).rejects.toThrow(/zoe/)
  })
})
