import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/app/page'
import RegisterPage from '@/app/register/page'
import ForgotPasswordPage from '@/app/forgot-password/page'
import DashboardLayout from '@/app/dashboard/layout'
import DashboardPage from '@/app/dashboard/page'
import RequestsPage from '@/app/dashboard/requests/page'
import NewRequestPage from '@/app/dashboard/requests/new/page'
import TeamsPage from '@/app/dashboard/teams/page'
import NewTeamPage from '@/app/dashboard/teams/new/page'
import TeamPage from '@/app/dashboard/team/page'
import TeamDetailPage from '@/app/dashboard/team/[id]/page'
import UsersPage from '@/app/dashboard/users/page'
import NewUserPage from '@/app/dashboard/users/new/page'
import SettingsPage from '@/app/dashboard/settings/page'
import TasksPage from '@/app/dashboard/tasks/page'
import NewTaskPage from '@/app/dashboard/tasks/new/page'
import TaskDetailPage from '@/app/dashboard/tasks/[id]/page'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="requests/new" element={<NewRequestPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="teams/new" element={<NewTeamPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="team/:id" element={<TeamDetailPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/new" element={<NewUserPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/new" element={<NewTaskPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
