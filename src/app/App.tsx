import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { router } from './router'
import { useUi } from '../store/store'
import { useReducedMotion } from '../theme/motion'

export function App() {
  const reduced = useReducedMotion()
  const override = useUi((s) => s.reducedMotion)
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced)
  }, [reduced])
  return (
    <MotionConfig reducedMotion={override === null ? 'user' : override ? 'always' : 'never'}>
      <RouterProvider router={router} />
    </MotionConfig>
  )
}
