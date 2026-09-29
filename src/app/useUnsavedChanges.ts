import { useContext } from 'react'
import { unsavedChangesContext } from './unsavedChangesContext'

export function useUnsavedChanges() {
  const value = useContext(unsavedChangesContext)
  if (!value) throw new Error('useUnsavedChanges harus digunakan di dalam UnsavedChangesProvider')
  return value
}
