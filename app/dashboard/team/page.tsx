'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentWeekDates, getNextWeekDates } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { getTeams, getTasks, getTeamById, getUserById } from '@/lib/api';
import { extractArray, getTeamLeaderId, getTeamMemberIds, getTeamMembers } from '@/lib/utils';
import {
  calculateTaskWeight,
  getWorkloadStatus,
  getWorkloadColor,
  getWorkloadBgColor,
} from '@/lib/types';
import { Users, Mail, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

type WeekView = 'this_week' | 'next_week';

export default function TeamPage() {
  const { user } = useAuth();
  const [weekView, setWeekView] = useState<WeekView>('this_week');
  const [teams, setTeams] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [team, setTeam] = useState<any | null>(null);
  const [teamLeader, setTeamLeader] = useState<any | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [weekTasks, setWeekTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function loadTeamData() {
      setLoading(true);
      setError(null);

      try {
        const [teamsRes, tasksRes] = await Promise.allSettled([
          getTeams(),
          getTasks(),
        ]);

        if (!active) return;

        const teamsData = teamsRes.status === 'fulfilled' ? extractArray<any>(teamsRes.value) : [];
        const tasksData = tasksRes.status === 'fulfilled' ? extractArray<any>(tasksRes.value) : [];

        if (teamsRes.status === 'rejected') {
          console.error('Failed to fetch teams:', teamsRes.reason);
        }
        if (tasksRes.status === 'rejected') {
          console.error('Failed to fetch tasks:', tasksRes.reason);
        }

        setTeams(teamsData);
        setTasks(tasksData);

        const managedTeam = teamsData.find(
          (t: any) => String(getTeamLeaderId(t)) === String(user?.id)
        ) as any;

        // If no team found for this user, try to find any team they might be a member of
        let fallbackTeam = managedTeam;
        if (!managedTeam) {
          fallbackTeam = teamsData.find((t: any) =>
            getTeamMemberIds(t).includes(String(user?.id))
          ) as any;
        }

        // Get memberIds from team
        const teamToUse = managedTeam || fallbackTeam;
        const teamDetailsRes = teamToUse ? await getTeamById(String(teamToUse.id)) : null;
        const teamDetails = teamDetailsRes
          ? Array.isArray(teamDetailsRes)
            ? teamDetailsRes[0]
            : teamDetailsRes?.data || teamDetailsRes
          : teamToUse;

        if (active) setTeam(teamDetails || null);

        const rawLeader =
          teamDetails?.leader ??
          teamDetails?.teamLeader ??
          null;
        const leaderId = String(getTeamLeaderId(teamDetails) || '').trim();
        let resolvedLeader = rawLeader;

        if ((!resolvedLeader || typeof resolvedLeader !== 'object') && leaderId) {
          try {
            const leaderRes = await getUserById(leaderId);
            resolvedLeader = Array.isArray(leaderRes) ? leaderRes[0] : leaderRes?.data || leaderRes;
          } catch {
            resolvedLeader = { id: leaderId };
          }
        }

        if (active) {
          setTeamLeader(
            resolvedLeader
              ? {
                  id: String(resolvedLeader.id ?? resolvedLeader._id ?? leaderId ?? ''),
                  name:
                    resolvedLeader.name ??
                    resolvedLeader.fullName ??
                    resolvedLeader.full_name ??
                    (leaderId ? `Leader ${leaderId.slice(0, 5)}` : 'Not assigned'),
                  email: resolvedLeader.email ?? '',
                }
              : null
          );
        }

        let members = getTeamMembers(teamDetails);
        const memberIds = Array.from(
          new Set([
            ...members.map((member) => String(member.id)),
            ...getTeamMemberIds(teamDetails),
          ].filter(Boolean))
        );

        const missingIds = memberIds.filter((id) => !members.some((member) => String(member.id) === id));
        const fetchedMembers = await Promise.allSettled(
          missingIds.map(async (memberId) => {
            try {
              const userData = await getUserById(memberId);
              return Array.isArray(userData) ? userData[0] : userData?.data || userData;
            } catch (err) {
              return null;
            }
          })
        );

        const resolvedMembers = fetchedMembers
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && !!result.value)
          .map((result) => result.value);

        const finalTeamMembers = memberIds.map((memberId) => {
          const existing = members.find((member) => String(member.id) === memberId);
          const fetched = resolvedMembers.find((member) => String(member.id) === memberId);
          return {
            id: memberId,
            name:
              existing?.name || fetched?.name || fetched?.fullName || `Member ${memberId.slice(0, 5)}`,
            email:
              existing?.email || fetched?.email || `${existing?.name || 'member'}@company.com`,
            role: existing?.role || fetched?.role || 'member',
            teamId: existing?.teamId || fetched?.teamId || teamDetails?.id,
          };
        });

        setTeamMembers(finalTeamMembers);
        const finalMemberIds = finalTeamMembers.map((member) => String(member.id));

        const weekStart = weekView === 'this_week' ? getCurrentWeekDates().start : getNextWeekDates().start;
        const weekEnd = weekView === 'this_week' ? getCurrentWeekDates().end : getNextWeekDates().end;

        setWeekTasks(
          tasksData.filter((task: any) => {
            if (!finalMemberIds.includes(String(task.assignedMemberId))) return false;
            const taskStart = new Date(task.startDate);
            const taskDue = new Date(task.dueDate);
            return (
              (taskStart >= weekStart && taskStart <= weekEnd) ||
              (taskDue >= weekStart && taskDue <= weekEnd) ||
              (taskStart <= weekStart && taskDue >= weekEnd)
            );
          })
        );
      } catch (err: any) {
        setError(err?.message || 'Unable to load team data.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTeamData();
    return () => {
      active = false;
    };
  }, [user, weekView]);



  // Get week dates for the header banner
  const { start: thisWeekStart, end: thisWeekEnd } = getCurrentWeekDates();
  const { start: nextWeekStart, end: nextWeekEnd } = getNextWeekDates();
  const weekStart = weekView === 'this_week' ? thisWeekStart : nextWeekStart;
  const weekEnd = weekView === 'this_week' ? thisWeekEnd : nextWeekEnd;

  // Calculate workload per member
  const memberWorkloads = teamMembers.map((member) => {
    const memberTasks = weekTasks.filter((t) => t.assignedMemberId === member.id);
    const allMemberTasks = tasks.filter((t) => t.assignedMemberId === member.id);
    const totalWeight = memberTasks.reduce((sum, task) => sum + calculateTaskWeight(task), 0);
    const totalEffort = memberTasks.reduce((sum, task) => sum + task.estimatedEffort, 0);
    const status = getWorkloadStatus(totalWeight);

    return {
      member,
      tasks: memberTasks,
      allTasks: allMemberTasks,
      totalWeight: Math.round(totalWeight * 10) / 10,
      totalEffort,
      status,
    };
  });

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
  };

  if (!user) return null;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading team data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading team data: {error}</div>;
  }

  if (!team) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <h2 className="text-xl font-semibold mb-2">No Team Found</h2>
        <p>You are not currently assigned to any team as a leader or member.</p>
        <p>Please contact your administrator to be assigned to a team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
          <p className="text-muted-foreground">
            {team?.name || 'Your Team'} - {teamMembers.length} members
          </p>
        </div>

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

      {/* Date Range Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Showing workload for: <span className="text-foreground font-medium">{formatDateRange()}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Team Overview</CardTitle>
            <CardDescription>Basic information for this team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Team name</span>
              <span className="text-sm font-medium text-foreground">{team?.name || 'Your Team'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Members</span>
              <span className="text-sm font-medium text-foreground">{teamMembers.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Weekly tasks</span>
              <span className="text-sm font-medium text-foreground">{weekTasks.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Team Leader</CardTitle>
            <CardDescription>Leader shown without opening a separate page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium text-foreground">{teamLeader?.name || 'Not assigned'}</p>
            <p className="text-sm text-muted-foreground">{teamLeader?.email || 'No email available'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {memberWorkloads.map(({ member, tasks, allTasks, totalWeight, totalEffort, status }) => (
          <Card key={member.id} className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </CardDescription>
                  </div>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${getWorkloadBgColor(
                    status
                  )} ${getWorkloadColor(status)}`}
                >
                  {status}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <p className="text-lg font-bold text-foreground">{tasks.length}</p>
                  <p className="text-xs text-muted-foreground">Week Tasks</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <p className="text-lg font-bold text-foreground">{totalEffort}h</p>
                  <p className="text-xs text-muted-foreground">Effort</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <p className={`text-lg font-bold ${getWorkloadColor(status)}`}>{totalWeight}</p>
                  <p className="text-xs text-muted-foreground">Weight</p>
                </div>
              </div>

              {/* Workload Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Workload</span>
                  <span className="text-muted-foreground">{Math.round((totalWeight / 30) * 100)}%</span>
                </div>
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

              {/* Recent Tasks Preview */}
              <div className="space-y-2 mb-4">
                <p className="text-xs text-muted-foreground font-medium">Recent Tasks:</p>
                {tasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <span className="text-sm text-foreground truncate">{task.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        task.status === 'done'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : task.status === 'blocked'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tasks this week</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {teamMembers.length === 0 && (
          <div className="col-span-full">
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground">No Team Members</h3>
                <p className="text-muted-foreground mt-2">
                  You don&apos;t have any team members assigned yet.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
