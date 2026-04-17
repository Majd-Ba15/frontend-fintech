'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getTeams, getTasks } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useTeamSkills } from '@/hooks/use-team-skills';
import { getTeamLeaderId, getTeamMembers, getTeamMemberIds } from '@/lib/utils';
import {
  calculateTaskWeight,
  getSkillLevelBadgeText,
  getSkillLevelColor,
  getWorkloadBgColor,
  getWorkloadColor,
  getWorkloadStatus,
} from '@/lib/types';
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const getTaskAssigneeId = (task: any) =>
  String(task.assignedMemberId || task.assignedToId || task.assigned_to || '');

const isTaskActiveOnDate = (task: any, date: Date) => {
  const taskStart = new Date(task.startDate);
  const taskDue = new Date(task.dueDate);

  taskStart.setHours(0, 0, 0, 0);
  taskDue.setHours(23, 59, 59, 999);

  const currentDate = new Date(date);
  currentDate.setHours(12, 0, 0, 0);

  return currentDate >= taskStart && currentDate <= taskDue;
};

const addMonths = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getMonthEnd = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const getCalendarGridStart = (date: Date) => {
  const start = getMonthStart(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const getCalendarGridEnd = (date: Date) => {
  const end = getMonthEnd(date);
  end.setDate(end.getDate() + (6 - end.getDay()));
  return end;
};

const isSameDate = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

export function TeamLeaderDashboard() {
  const { user } = useAuth();
  const { skills } = useTeamSkills();
  const [currentMonth, setCurrentMonth] = useState(() => getMonthStart(new Date()));
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [monthTasks, setMonthTasks] = useState<any[]>([]);
  const [team, setTeam] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthStart = useMemo(() => getMonthStart(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => getMonthEnd(currentMonth), [currentMonth]);

  const normalizeArray = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    const timeoutId = window.setTimeout(() => {
      setCurrentMonth(getMonthStart(new Date()));
    }, nextMidnight.getTime() - now.getTime());

    return () => window.clearTimeout(timeoutId);
  }, [currentMonth]);

  useEffect(() => {
    if (!user) return;

    const currentUser = user;
    let active = true;

    async function loadTeamLeaderData() {
      setLoading(true);
      setError(null);

      try {
        const [teamsSettled, tasksSettled] = await Promise.allSettled([getTeams(), getTasks()]);

        if (!active) return;

        const teams = teamsSettled.status === 'fulfilled' ? normalizeArray<any>(teamsSettled.value) : [];
        const nextTasks = tasksSettled.status === 'fulfilled' ? normalizeArray<any>(tasksSettled.value) : [];

        setTasks(nextTasks);

        let managedTeam = teams.find((entry: any) => String(getTeamLeaderId(entry)) === String(currentUser.id)) as any;
        if (!managedTeam) {
          managedTeam = teams.find((entry: any) => getTeamMemberIds(entry).includes(String(currentUser.id))) as any;
        }
        if (!managedTeam && currentUser.email) {
          managedTeam = teams.find(
            (entry: any) =>
              String(entry.leader?.email || entry.teamLeader?.email || '').toLowerCase() ===
              String(currentUser.email).toLowerCase()
          ) as any;
        }
        if (!managedTeam && currentUser.teamId) {
          managedTeam = teams.find((entry: any) => String(entry.id) === String(currentUser.teamId)) as any;
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
        const filteredTasks = nextTasks.filter((task: any) => {
          const assignee = getTaskAssigneeId(task);
          if (!finalMemberIds.includes(assignee)) return false;

          const taskStart = new Date(task.startDate);
          const taskDue = new Date(task.dueDate);

          return (
            (taskStart >= monthStart && taskStart <= monthEnd) ||
            (taskDue >= monthStart && taskDue <= monthEnd) ||
            (taskStart <= monthStart && taskDue >= monthEnd)
          );
        });

        setMonthTasks(filteredTasks);
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
  }, [user, monthStart, monthEnd, skills]);

  const memberWorkloads = useMemo(
    () =>
      teamMembers.map((member) => {
        const memberTasks = monthTasks.filter((task) => getTaskAssigneeId(task) === String(member.id));
        const activeTasks = memberTasks.filter((task) => task.status !== 'done');
        const totalWeight = activeTasks.reduce((sum, task) => sum + calculateTaskWeight(task), 0);
        const totalEffort = activeTasks.reduce((sum, task) => sum + task.estimatedEffort, 0);
        const status = getWorkloadStatus(totalWeight);

        return {
          member,
          tasks: memberTasks,
          totalWeight: Math.round(totalWeight * 10) / 10,
          totalEffort,
          status,
        };
      }),
    [monthTasks, teamMembers]
  );

  const calendarDays = useMemo(() => {
    const start = getCalendarGridStart(currentMonth);
    const end = getCalendarGridEnd(currentMonth);
    const days: Date[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return days.map((date) => {
      const activeTasks = monthTasks.filter((task) => task.status !== 'done' && isTaskActiveOnDate(task, date));
      const totalWeight = activeTasks.reduce((sum, task) => sum + calculateTaskWeight(task), 0);
      const members = teamMembers
        .filter((member) => activeTasks.some((task) => getTaskAssigneeId(task) === String(member.id)))
        .map((member) => {
          const memberTasks = activeTasks.filter((task) => getTaskAssigneeId(task) === String(member.id));
          const memberWeight = memberTasks.reduce((sum, task) => sum + calculateTaskWeight(task), 0);

          return {
            id: String(member.id),
            name: member.name,
            initials: getInitials(member.name || 'TM'),
            tasks: memberTasks.length,
            taskItems: memberTasks,
            status: getWorkloadStatus(memberWeight),
            totalWeight: Math.round(memberWeight * 10) / 10,
          };
        });

      return {
        date,
        isCurrentMonth: date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear(),
        isToday: isSameDate(date, new Date()),
        tasks: activeTasks.length,
        members,
        totalWeight: Math.round(totalWeight * 10) / 10,
        status: getWorkloadStatus(totalWeight),
      };
    });
  }, [currentMonth, monthTasks, teamMembers]);

  const busiestDay = useMemo(
    () =>
      calendarDays
        .filter((day) => day.isCurrentMonth)
        .reduce(
          (max, day) => (day.totalWeight > max.totalWeight ? day : max),
          calendarDays.find((day) => day.isCurrentMonth) || {
            date: monthStart,
            isCurrentMonth: true,
            isToday: false,
            tasks: 0,
            members: [],
            totalWeight: 0,
            status: 'available',
          }
        ),
    [calendarDays, monthStart]
  );

  const peakCoverageDay = useMemo(
    () =>
      calendarDays
        .filter((day) => day.isCurrentMonth)
        .reduce(
          (max, day) => (day.members.length > max.members.length ? day : max),
          calendarDays.find((day) => day.isCurrentMonth) || {
            date: monthStart,
            isCurrentMonth: true,
            isToday: false,
            tasks: 0,
            members: [],
            totalWeight: 0,
            status: 'available',
          }
        ),
    [calendarDays, monthStart]
  );

  const selectedDay = useMemo(() => {
    if (!selectedDate) return null;
    return calendarDays.find((day) => isSameDate(day.date, selectedDate)) || null;
  }, [calendarDays, selectedDate]);

  const totalTasks = monthTasks.length;
  const completedTasks = monthTasks.filter((task) => task.status === 'done').length;
  const blockedTasks = monthTasks.filter((task) => task.status === 'blocked').length;
  const unacknowledgedTasks = monthTasks.filter((task) => !task.acknowledged).length;

  const formatMonthLabel = () => currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const formatFullDate = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (!user) return null;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading team dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading dashboard: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workload Overview</h1>
          <p className="text-muted-foreground">
            {team?.name || 'Your Team'} - {formatMonthLabel()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/dashboard/tasks/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </Link>

          <div className="flex items-center gap-2 rounded-lg bg-secondary p-1">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((value) => getMonthStart(addMonths(value, -1)))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[150px] px-2 text-center text-sm font-medium text-foreground">{formatMonthLabel()}</div>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((value) => getMonthStart(addMonths(value, 1)))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-chart-1/10 p-2">
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
              <div className="rounded-lg bg-emerald-500/10 p-2">
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
              <div className="rounded-lg bg-red-500/10 p-2">
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
              <div className="rounded-lg bg-amber-500/10 p-2">
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.7fr)]">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg">Team Member Workload</CardTitle>
                <CardDescription>Workload distribution for {formatMonthLabel()}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberWorkloads.map(({ member, tasks, totalWeight, totalEffort, status }) => (
                <Link
                  key={member.id}
                  to={`/dashboard/team/${member.id}`}
                  className="block rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                        <span className="text-sm font-medium text-primary">
                          {member?.name ? String(member.name).charAt(0) : '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded border px-2 py-0.5 text-xs ${getSkillLevelColor(member.skillLevel)}`}>
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
                        className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${getWorkloadBgColor(
                          status
                        )} ${getWorkloadColor(status)}`}
                      >
                        {status}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
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
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>No team members found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Team Calendar</CardTitle>
            <CardDescription>See which members are working on each day in {formatMonthLabel()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-border bg-secondary/10 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground">{formatMonthLabel()}</p>
                  <p className="text-sm text-muted-foreground">Monthly calendar with member coverage per day</p>
                </div>
                <div className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">
                  {teamMembers.length} members
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  <div className="mb-2 grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                      <div key={label} className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => (
                      <button
                        key={day.date.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(day.date)}
                        className={`min-h-[146px] rounded-2xl border p-3 ${
                          day.isCurrentMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground'
                        } ${day.totalWeight > 0 ? getWorkloadBgColor(day.status) : ''} text-left transition hover:border-primary/40 hover:shadow-sm`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                              day.isToday
                                ? 'bg-primary text-primary-foreground'
                                : day.isCurrentMonth
                                ? 'bg-secondary text-foreground'
                                : 'bg-transparent text-muted-foreground'
                            }`}
                          >
                            {day.date.getDate()}
                          </span>
                          {day.tasks > 0 && (
                            <span className="rounded-full bg-background/80 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                              {day.tasks} tasks
                            </span>
                          )}
                        </div>

                        <div className="mt-3 space-y-2">
                          {day.members.length > 0 ? (
                            <>
                              {day.members.slice(0, 3).map((member) => (
                                <div
                                  key={member.id}
                                  title={member.name}
                                  className="flex items-center gap-2 rounded-xl bg-background/90 px-2.5 py-2 text-xs"
                                >
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                    {member.initials}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[11px] font-medium leading-none text-foreground">{member.name}</p>
                                    <p className="mt-1 text-[10px] leading-none text-muted-foreground">
                                      {member.tasks} task{member.tasks > 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold leading-none ${
                                      member.status === 'available'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : member.status === 'moderate'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {member.status === 'available'
                                      ? 'Free'
                                      : member.status === 'moderate'
                                      ? 'Busy'
                                      : 'Full'}
                                  </span>
                                </div>
                              ))}
                              {day.members.length > 3 && (
                                <div className="rounded-lg border border-dashed border-border bg-background/60 px-2 py-1.5 text-xs text-muted-foreground">
                                  +{day.members.length - 3} more members
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="rounded-lg border border-dashed border-border/70 px-2 py-3 text-center text-xs text-muted-foreground">
                              No assigned members
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Busiest Day</p>
                <p className="mt-1 font-medium text-foreground">
                  {busiestDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm text-muted-foreground">{busiestDay.totalWeight} weight scheduled</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Peak Coverage</p>
                <p className="mt-1 font-medium text-foreground">
                  {peakCoverageDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-sm text-muted-foreground">{peakCoverageDay.members.length} members active</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Visible Range</p>
                <p className="mt-1 font-medium text-foreground">{formatMonthLabel()}</p>
                <p className="text-sm text-muted-foreground">Monthly planner view</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Tasks</CardTitle>
            <CardDescription>Latest assigned tasks this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthTasks.slice(0, 4).map((task) => {
                const assignee = teamMembers.find((member) => String(member.id) === getTaskAssigneeId(task));

                return (
                  <Link
                    key={task.id}
                    to={`/dashboard/tasks/${task.id}`}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 p-3 transition-colors hover:bg-secondary/70"
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
                      className={`rounded px-2 py-1 text-xs font-medium ${
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

      <Dialog open={Boolean(selectedDate)} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDay ? formatFullDate(selectedDay.date) : 'Day details'}</DialogTitle>
            <DialogDescription>
              {selectedDay
                ? `${selectedDay.tasks} active task${selectedDay.tasks === 1 ? '' : 's'} across ${selectedDay.members.length} member${
                    selectedDay.members.length === 1 ? '' : 's'
                  }`
                : 'Review the team workload for this day.'}
            </DialogDescription>
          </DialogHeader>

          {selectedDay && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Total Weight</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{selectedDay.totalWeight}</p>
                </div>
                <div className="rounded-xl bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Active Members</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{selectedDay.members.length}</p>
                </div>
                <div className="rounded-xl bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className={`mt-1 text-lg font-semibold ${getWorkloadColor(selectedDay.status)}`}>
                    {selectedDay.status}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Members Scheduled</h3>
                {selectedDay.members.length > 0 ? (
                  selectedDay.members.map((member) => (
                    <div key={member.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                            {member.initials}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.tasks} task{member.tasks === 1 ? '' : 's'} • weight {member.totalWeight}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            member.status === 'available'
                              ? 'bg-emerald-100 text-emerald-700'
                              : member.status === 'moderate'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {member.status === 'available' ? 'Free' : member.status === 'moderate' ? 'Busy' : 'Full'}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {member.taskItems.map((task: any) => (
                          <Link
                            key={task.id}
                            to={`/dashboard/tasks/${task.id}`}
                            onClick={() => setSelectedDate(null)}
                            className="flex items-center justify-between rounded-lg bg-background px-3 py-2 transition hover:bg-secondary"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {task.estimatedEffort}h • due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                              {Math.round(calculateTaskWeight(task) * 10) / 10}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    No assigned members for this day.
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
