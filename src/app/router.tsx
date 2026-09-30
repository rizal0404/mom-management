import { createBrowserRouter } from 'react-router'

import { AppShell } from './AppShell'
import { UnsavedChangesProvider } from './UnsavedChangesProvider'
import { LoginPage } from '../modules/auth/LoginPage'
import { PasswordRecoveryRequestPage, PasswordUpdatePage } from '../modules/auth/AccountSecurityPages'
import { RequireActiveSession } from '../modules/auth/RequireActiveSession'
import { MeetingsPage } from '../modules/meetings/MeetingsPage'
import { MeetingTemplatesPage } from '../modules/meetings/MeetingTemplatesPage'
import { MeetingEditorPage } from '../modules/meetings/MeetingEditorPage'
import { ActionsPage } from '../modules/actions/ActionsPage'
import { ActionDetailPage } from '../modules/actions/ActionDetailPage'
import { DashboardPage } from '../modules/dashboard/DashboardPage'
import { RequireAdmin } from '../modules/users/RequireAdmin'
import { UserManagementPage } from '../modules/users/UserManagementPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RequireActiveSession />,
    children: [{
      element: <UnsavedChangesProvider><AppShell /></UnsavedChangesProvider>,
      children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'meetings',
        element: <MeetingsPage />,
      },
      {
        path: 'meeting-templates',
        element: <MeetingTemplatesPage />,
      },
      {
        path: 'meetings/new',
        element: <MeetingEditorPage />,
      },
      {
        path: 'meetings/:id',
        element: <MeetingEditorPage />,
      },
      {
        path: 'actions',
        element: <ActionsPage />,
      },
      {
        path: 'actions/:id',
        element: <ActionDetailPage />,
      },
      {
        element: <RequireAdmin />,
        children: [{ path: 'users', element: <UserManagementPage /> }],
      },
      ],
    }],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/account/recovery',
    element: <PasswordRecoveryRequestPage />,
  },
  {
    path: '/account/password',
    element: <PasswordUpdatePage />,
  },
])
