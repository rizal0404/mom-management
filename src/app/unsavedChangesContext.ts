import { createContext } from 'react'

export type UnsavedChangesContextValue = {
  isDirty: boolean
  setDirty: (dirty: boolean) => void
  allowNextNavigation: () => void
  shouldBlockNavigation: () => boolean
}

export const unsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null)
