import { describe, it, expect } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
import BlueprintsPage from '../src/pages/BlueprintsPage.jsx'
import { renderWithStore } from './utils.jsx'

const search = (author) => {
  fireEvent.change(screen.getByPlaceholderText(/Author/i), { target: { value: author } })
  fireEvent.click(screen.getByText(/Get blueprints/i))
}

describe('BlueprintsPage (con apimock)', () => {
  it('despacha fetchByAuthor y lista los planos en la tabla', async () => {
    const { actions } = renderWithStore(<BlueprintsPage />)
    search('juan')

    expect(actions.map((a) => a.type)).toContain('blueprints/fetchByAuthor/pending')
    const pending = actions.find((a) => a.type === 'blueprints/fetchByAuthor/pending')
    expect(pending.meta.arg).toBe('juan')

    const row = await screen.findByRole('row', { name: /casa-1/ })
    expect(within(row).getByText('5')).toBeInTheDocument()
    expect(screen.getByText(/Total user points: 8/)).toBeInTheDocument()
  })

  it('Open actualiza el nombre del plano actual (estado global)', async () => {
    const { store } = renderWithStore(<BlueprintsPage />)
    search('juan')
    const row = await screen.findByRole('row', { name: /techo/ })
    fireEvent.click(within(row).getByText('Open'))

    expect(
      await screen.findByText('techo', { selector: '[data-testid=current-name]' }),
    ).toBeInTheDocument()
    expect(store.getState().blueprints.current.points).toHaveLength(3)
  })

  it('muestra un banner con Reintentar cuando el GET falla', async () => {
    const { actions } = renderWithStore(<BlueprintsPage />)
    search('nadie')

    const banner = await screen.findByRole('alert')
    expect(banner).toHaveTextContent(/nadie/)
    fireEvent.click(within(banner).getByText('Reintentar'))
    const retries = actions.filter((a) => a.type === 'blueprints/fetchByAuthor/pending')
    expect(retries).toHaveLength(2)
  })
})
