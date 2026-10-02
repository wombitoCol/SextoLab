import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import BlueprintForm from '../components/BlueprintForm.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { createBlueprint, fetchBlueprint } from '../features/blueprints/blueprintsSlice.js'

export default function CreateBlueprintPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error } = useSelector((s) => s.blueprints)

  const submit = async (bp) => {
    const result = await dispatch(createBlueprint(bp))
    if (createBlueprint.fulfilled.match(result)) {
      dispatch(fetchBlueprint({ author: bp.author, name: bp.name }))
      navigate('/')
    }
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <ErrorBanner message={error.save} />
      <BlueprintForm onSubmit={submit} submitting={status.save === 'loading'} />
    </div>
  )
}
