'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTeams, getTasks } from '@/lib/api';
import { getCurrentWeekDates, getNextWeekDates } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { useTeamSkills } from '@/hooks/use-team-skills';
import { getTeamLeaderId, getTeamMembers, getTeamMemberIds } from '@/lib/utils';
import {
  calculateTaskWeight,
  getWorkloadStatus,
  getWorkloadColor,
  getWorkloadBgColor,
  getSkillLevelColor,
  getSkillLevelBadgeText,
} from '@/lib/types';
import {
  Users,
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Calendar,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type WeekView = 'this_week' | 'next_week';

export function TeamLeaderDashboard() {
  const { user } = useAuth();
  const { skills } = useTeamSkills();
  const [weekView, setWeekView] = useState<WeekView>('this_week');
  const [teams, setTeams] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [weekTasks, setWeekTasks] = useState<any[]>([]);
  const [team, setTeam] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get week dates (memoized)
  const { start: thisWeekStart, end: thisWeekEnd } = useMemo(() => getCurrentWeekDates(), []);
  const { start: nextWeekStart, end: nextWeekEnd } = useMemo(() => getNextWeekDates(), []);

  const weekStart = weekView === 'this_week' ? thisWeekStart : nextWeekStart;
  const weekEnd = weekView === 'this_week' ? thisWeekEnd : nextWeekEnd;

  const normalizeArray = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  useEffect(() => {
    if (!user) return;

    const currentUser = user;
    let active = true;

    async function loadTeamLeaderData() {
      setLoading(true);
      setError(null);

      try {
        const [teamsSettled, tasksSettled] = await Promise.allSettled([
          getTeams(),
          getTasks(),
        ]);

        if (!active) return;

        const teams = teamsSettled.status === 'fulfilled' ? normalizeArray<any>(teamsSettled.value) : [];
        const tasks = tasksSettled.status === 'fulfilled' ? normalizeArray<any>(tasksSettled.value) : [];

        setTeams(teams);
        setTasks(tasks);

        let managedTeam = teams.find(
          (t: any) => String(getTeamLeaderId(t)) === String(currentUser.id)
        ) as any;
        if (!managedTeam) {
          managedTeam = teams.find((t: any) =>
            getTeamMemberIds(t).includes(String(currentUser.id))
          ) as any;
        }
        if (!managedTeam && currentUser.email) {
          managedTeam = teams.find((t: any) =>
            String(t.leader?.email || t.teamLeader?.email || '').toLowerCase() ===
              String(currentUser.email).toLowerCase()
          ) as any;
        }
        if (!managedTeam && currentUser.teamId) {
          managedTeam = teams.find((t: any) => String(t.id) === String(currentUser.teamId)) as any;
        }
        setTeam(managedTeam || null);

        let members = getTeamMembers(managedTeam);
        const memberIds = members.map((member) => String(member.id));

        if (memberIds.length === 0 && managedTeam) {
          const rawMemberIds = managedTeam?.memberIds ?? managedTeam?.members ?? [];
          const fallbackIds: string[] = Array.isArray(rawMemberIds)
            ? rawMemberIds.map((item: any) => String(item?.id ?? item ?? '').trim()).filter(Boolean)
            : [];

          members = fallbackIds.map((id: string) => ({
            id,
            name: `Team Member ${String(id).slice(0, 5)}`,
            email: `member-${String(id).slice(0, 5)}@company.com`,
            role: 'member' as const,
            teamId: managedTeam?.id,
            skillLevel: skills[id] || undefined,
          }));
        }

        const finalMembers = members.map((member) => ({
          ...member,
          name: member.name || `Team Member ${String(member.id).slice(0, 5)}`,
          email: member.email || `member-${String(member.id).slice(0, 5)}@company.com`,
          role: member.role || 'member',
          teamId: member.teamId || managedTeam?.id,
        }));

        setTeamMembers(finalMembers);
        const finalMemberIds = finalMembers.map((member) => String(member.id));

        const filteredTasks = tasks.filter((task: any) => {
          const assignee = String(task.assignedMemberId || task.assignedToId || task.assigned_to || '');
          if (!finalMemberIds.includes(assignee)) return false;
          const taskStart = new Date(task.startDate);
          const taskDue = new Date(task.dueDate);
          return (
            (taskStart >= weekStart && taskStart <= weekEnd) ||
            (taskDue >= weekStart && taskDue <= weekEnd) ||
            (taskStart <= weekStart && taskDue >= weekEnd)
          );
        });

        setWeekTasks(filteredTasks);

      } catch (err: any) {
        if (active) {
          setError(err?.message || 'Unable to load dashboard data.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTeamLeaderData();
    return () => {
      active = false;
    };
  }, [user, weekView]);

  // Calculate workload per member
  const memberWorkloads = teamMembers.map((member) => {
    const memberTasks = weekTasks.filter((t) => t.assignedMemberId === member.id);
    const totalWeight = memberTasks.reduce((sum, task) => sum + calculateTaskWeight(task), 0);
    const totalEffort = memberTasks.reduce((sum, task) => sum + task.estimatedEffort, 0);
    const status = getWorkloadStatus(totalWeight);

    return {
      member,
      tasks: memberTasks,
      totalWeight: Math.round(totalWeight * 10) / 10,
      totalEffort,
      status,
    };
  });

  // Stats
  const totalTasks = weekTasks.length;
  const completedTasks = weekTasks.filter((t) => t.status === 'done').length;
  const blockedTasks = weekTasks.filter((t) => t.status === 'blocked').length;
  const unacknowledgedTasks = weekTasks.filter((t) => !t.acknowledged).length;

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading team dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">Error loading dashboard: {error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workload Overview</h1>
          <p className="text-muted-foreground">
            {team?.name || 'Your Team'} - {formatDateRange()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Create Task Button */}
          <Link to="/dashboard/tasks/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </Link>

          {/* Week Selector */}
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
          <Button
            variant={weekView === 'this_week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setWeekView('this_week')}
          >
            This Week
          </Button>
          <Button
            variant={weekView === 'next_week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setWeekView('next_week')}
          >
            Next Week
          </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <CheckSquare className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completedTasks}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{blockedTasks}</p>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{unacknowledgedTasks}</p>
                <p className="text-xs text-muted-foreground">Pending Ack</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Workload Cards */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Team Member Workload</CardTitle>
              <CardDescription>Workload distribution for {formatDateRange()}</CardDescription>
            </div>
            <Link to="/dashboard/team">
              <Button variant="outline" size="sm">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard/team/skills">
              <Button variant="outline" size="sm">
                Manage Skills
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memberWorkloads.map(({ member, tasks, totalWeight, totalEffort, status }) => (
              <Link
                key={member.id}
                to={`/dashboard/team/${member.id}`}
                className="block p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {member?.name ? String(member.name).charAt(0) : '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded border ${getSkillLevelColor(member.skillLevel)}`}>
                          {getSkillLevelBadgeText(member.skillLevel)}
                        </span>
                        <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Effort</p>
                      <p className="font-medium text-foreground">{totalEffort}h</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className={`font-medium ${getWorkloadColor(status)}`}>{totalWeight}</p>
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${getWorkloadBgColor(
                        status
                      )} ${getWorkloadColor(status)}`}
                    >
                      {status}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                {/* Workload Bar */}
                <div className="mt-4">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        status === 'available'
                          ? 'bg-emerald-500'
                          : status === 'moderate'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((totalWeight / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}

            {memberWorkloads.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No team members found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link to="/dashboard/tasks/new">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CheckSquare className="h-4 w-4" />
                Create Task
              </Button>
            </Link>
            <Link to="/dashboard/requests">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Clock className="h-4 w-4" />
                Change Requests
              </Button>
            </Link>
            <Link to="/dashboard/tasks">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4" />
                All Tasks
              </Button>
            </Link>
            <Link to="/dashboard/team">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Team Details
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Tasks</CardTitle>
            <CardDescription>Latest assigned tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weekTasks.slice(0, 4).map((task) => {
                const assignee = teamMembers.find((u) => u.id === task.assignedMemberId);
                return (
                  <Link
                    key={task.id}
                    to={`/dashboard/tasks/${task.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          task.status === 'done'
                            ? 'bg-emerald-500'
                            : task.status === 'blocked'
                            ? 'bg-red-500'
                            : task.status === 'in_progress'
                            ? 'bg-amber-500'
                            : 'bg-muted-foreground'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{assignee?.name}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.priority === 'critical'
                          ? 'bg-red-500/20 text-red-400'
                          : task.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-400'
                          : task.priority === 'medium'
                          ? 'bg-chart-1/20 text-chart-1'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
