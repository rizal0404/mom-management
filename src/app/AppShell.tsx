import { useState } from 'react'
import { NavLink, Outlet, useBlocker, useLocation } from 'react-router'
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UsersRound,
  X,
} from 'lucide-react'
import { useAuth } from '../modules/auth/AuthProvider'
import { useUnsavedChanges } from './useUnsavedChanges'

const navigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Notula', to: '/meetings', icon: ClipboardList, end: false },
  { label: 'Tindak lanjut', to: '/actions', icon: ClipboardList, end: false },
]

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/meetings': 'Rapat',
  '/meetings/new': 'Buat draf rapat',
  '/actions': 'Tindak lanjut',
  '/users': 'Kelola pengguna',
  '/login': 'Login',
}

function getPageTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith('/meetings/')) return 'Detail notula'
  if (pathname.startsWith('/actions/')) return 'Detail tindak lanjut'
  return 'MOM Tracker'
}

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { pathname } = useLocation()
  const { logout, profile } = useAuth()
  const visibleNavigation = profile?.role === 'ADMIN'
    ? [...navigation, { label: 'Kelola pengguna', to: '/users', icon: UsersRound, end: true }]
    : navigation
  const { isDirty, setDirty, shouldBlockNavigation } = useUnsavedChanges()
  const blocker = useBlocker(shouldBlockNavigation)
  const [logoutPending, setLogoutPending] = useState(false)
  const pageTitle = getPageTitle(pathname)

  const cancelLeave = () => {
    if (logoutPending) setLogoutPending(false)
    else if (blocker.state === 'blocked') blocker.reset()
  }

  const leaveWithoutSaving = () => {
    setDirty(false)
    if (logoutPending) {
      setLogoutPending(false)
      void logout()
    } else if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }

  return (
    <div className={`app-shell ${isCollapsed ? 'app-shell--collapsed' : ''}`}>
      {isSidebarOpen && (
        <button
          aria-label="Tutup navigasi"
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="brand-mark" aria-hidden="true">M</div>
          <span>MOM Tracker</span>
          <button
            aria-label="Ciutkan sidebar"
            className="icon-button sidebar__collapse"
            onClick={() => setIsCollapsed((value) => !value)}
            title={isCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
            type="button"
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <div className="sidebar__section-label">Ruang kerja</div>
        <nav aria-label="Navigasi utama" className="sidebar__nav">
          {visibleNavigation.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
              end={end}
              key={to}
              onClick={() => setIsSidebarOpen(false)}
              to={to}
            >
              <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="profile-card">
            <div className="avatar" aria-hidden="true">{profile?.display_name.slice(0, 1).toUpperCase()}</div>
            <div className="profile-card__copy">
              <strong>{profile?.display_name}</strong>
              <span>{profile?.role === 'ADMIN' ? 'Administrator' : 'Anggota aktif'}</span>
            </div>
          </div>
          <button className="nav-link nav-link--muted nav-link--button" onClick={() => { if (isDirty) setLogoutPending(true); else void logout() }} type="button">
            <LogOut aria-hidden="true" size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            aria-label="Buka navigasi"
            className="icon-button topbar__menu"
            onClick={() => setIsSidebarOpen(true)}
            type="button"
          >
            <Menu size={21} />
          </button>
          <div>
            <p className="topbar__context">MOM &amp; Follow-up</p>
            <h1>{pageTitle}</h1>
          </div>
          {isSidebarOpen && (
            <button
              aria-label="Tutup navigasi"
              className="icon-button topbar__close"
              onClick={() => setIsSidebarOpen(false)}
              type="button"
            >
              <X size={21} />
            </button>
          )}
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {(blocker.state === 'blocked' || logoutPending) && (
        <div className="modal-backdrop" onClick={cancelLeave}>
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-changes-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="unsaved-changes-title">Perubahan belum disimpan</h3>
            <p>Anda memiliki perubahan draf yang belum disimpan. Tinggalkan halaman tanpa menyimpan?</p>
            <div className="modal-actions">
              <button className="button button--quiet" type="button" onClick={cancelLeave}>Batal</button>
              <button className="button button--primary" type="button" onClick={leaveWithoutSaving}>Tinggalkan tanpa menyimpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
