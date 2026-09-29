import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { unsavedChangesContext } from './unsavedChangesContext'

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [isDirty, setDirty] = useState(false)
  const bypassNextNavigation = useRef(false)
  const allowNextNavigation = useCallback(() => { bypassNextNavigation.current = true }, [])
  const shouldBlockNavigation = useCallback(() => {
    if (bypassNextNavigation.current) {
      bypassNextNavigation.current = false
      return false
    }
    return isDirty
  }, [isDirty])
  const value = useMemo(() => ({ isDirty, setDirty, allowNextNavigation, shouldBlockNavigation }), [allowNextNavigation, isDirty, shouldBlockNavigation])

  return <unsavedChangesContext.Provider value={value}>{children}</unsavedChangesContext.Provider>
}
