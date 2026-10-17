'use client'
// What the pieces of the shell offer the screens inside it: the menu, and "back to all games", which first asks if
// a round is under way.
import { createContext, useContext } from 'react'

export type Shell = {
  openMenu: () => void
  /** Back to the front screen. A round under way asks first ("Finish this one first?"). */
  goHome: () => void
}

export const ShellCtx = createContext<Shell>({ openMenu: () => {}, goHome: () => {} })
export const useShell = () => useContext(ShellCtx)
