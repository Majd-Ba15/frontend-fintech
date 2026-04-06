'use client';

import { useAuth } from '@/lib/auth-context';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { TeamLeaderDashboard } from '@/components/dashboard/team-leader-dashboard';
import { MemberDashboard } from '@/components/dashboard/member-dashboard';
import { normalizeUserRole } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const role = normalizeUserRole(user.role);

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'team_leader':
      return <TeamLeaderDashboard />;
    case 'member':
      return <MemberDashboard />;
    default:
      return <div>Unknown role</div>;
  }
}
