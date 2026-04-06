'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUsers, getTeams, getTasks, deleteTeam } from '@/lib/api';
import { Plus, Building2, Users, Edit, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeamsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeUsers = (payload: any): any[] => {
    const usersArr = Array.isArray(payload) ? payload : payload?.data || [];
    return usersArr.map((u: any) => ({
      id: String(u.id || u.userId || '').trim(),
      name: u.name || u.fullName || u.username || u.email || 'Unknown',
      email: u.email || u.emailAddress || '',
      role: String(u.role || '').toLowerCase(),
      teamId: String(u.teamId || u.team?.id || '').trim(),
    }));
  };

  const normalizeTeams = (payload: any): any[] => {
    const teamsArr = Array.isArray(payload) ? payload : payload?.data || [];
    return teamsArr.map((t: any) => ({
      id: String(t.id || t.teamId || '').trim(),
      name: t.name || t.teamName || 'Unnamed Team',
      leaderId: String(t.leaderId || t.teamLeaderId || '').trim(),
      memberIds: Array.isArray(t.memberIds)
        ? t.memberIds.map((id: any) => String(id).trim())
        : Array.isArray(t.members)
        ? t.members.map((m: any) => String(m.id || m.userId || m).trim())
        : [],
    }));
  };

  const normalizeTasks = (payload: any): any[] => {
    const tasksArr = Array.isArray(payload) ? payload : payload?.data || [];
    return tasksArr.map((t: any) => ({
      id: String(t.id || t.taskId || '').trim(),
      assignedMemberId: String(t.assignedMemberId || t.userId || '').trim(),
      status: String(t.status || '').toLowerCase(),
      ...t,
    }));
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, teamsRes, tasksRes] = await Promise.allSettled([getUsers(), getTeams(), getTasks()]);

      const resolvedUsers = usersRes.status === 'fulfilled' ? normalizeUsers(usersRes.value) : [];
      const resolvedTeams = teamsRes.status === 'fulfilled' ? normalizeTeams(teamsRes.value) : [];
      const resolvedTasks = tasksRes.status === 'fulfilled' ? normalizeTasks(tasksRes.value) : [];

      setUsers(resolvedUsers);
      setTeams(resolvedTeams);
      setTasks(resolvedTasks);
    } catch (e) {
      console.error('Failed loading teams data', e);
      setError('Unable to load teams data.');
      setUsers([]);
      setTeams([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const removeTeam = async (teamId: string) => {
    try {
      const apiTeamId = !Number.isNaN(Number(teamId)) ? String(Number(teamId)) : teamId;
      await deleteTeam(apiTeamId);

      setTeams((prev) => prev.filter((t) => String(t.id) !== String(teamId)));
      setUsers((prev) =>
        prev.map((u) =>
          String(u.teamId) === String(teamId)
            ? { ...u, teamId: '' }
            : u
        )
      );
      await loadData();
    } catch (err: any) {
      console.error('Failed to delete team', err);
      const message = err?.body?.message || err?.message || 'Failed to delete team.';
      setError(message);
    }
  };

  const displayedTeams = teams;
  const displayedUsers = users;
  const displayedTasks = tasks;

  return (
    <div className="space-y-6">
      {loading && (
        <div className="rounded-lg border border-border bg-card p-4 text-center text-muted-foreground">
          Loading teams...
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teams</h1>
          <p className="text-muted-foreground">
            View and manage teams
          </p>
        </div>
        <Link to="/teams/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </Link>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayedTeams.map((team) => {
          const normalizedTeamId = String(team.id || '').trim();
          const normalizedLeaderId = String(team.leaderId || '').trim();
          const teamMemberIds = Array.isArray(team.memberIds)
            ? team.memberIds.map((id: any) => String(id || '').trim())
            : [];

          const leader =
            displayedUsers.find((u) => String(u.id).trim() === normalizedLeaderId) ||
            displayedUsers.find(
              (u) =>
                String(u.teamId).trim() === normalizedTeamId &&
                ['team_leader', 'leader', 'admin'].includes(String(u.role).toLowerCase())
            );

          const members = displayedUsers.filter((u) => {
            const uid = String(u.id || '').trim();
            const teamId = String(u.teamId || '').trim();
            return (
              teamMemberIds.includes(uid) ||
              teamId === normalizedTeamId
            );
          });

          const teamTasks = displayedTasks.filter((t) => {
            const assigned = String(t.assignedMemberId || '').trim();
            return members.some((m) => String(m.id).trim() === assigned);
          });

          const activeTasks = teamTasks.filter((t) => String(t.status || '').toLowerCase() !== 'done');

          return (
            <Card key={team.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription>Team ID: {team.id}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/teams/${team.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeTeam(team.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Team Leader */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Team Leader</p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="h-8 w-8 rounded-full bg-chart-2/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-chart-2">
                        {leader?.name ? leader.name.charAt(0) : '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{leader?.name}</p>
                      <p className="text-xs text-muted-foreground">{leader?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-xl font-bold text-foreground">{members.length}</p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-xl font-bold text-foreground">{teamTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Total Tasks</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-xl font-bold text-foreground">{activeTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>

                {/* Members */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Team Members</p>
                  <div className="space-y-2">
                    {members.slice(0, 3).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-foreground">{member.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {displayedTasks.filter((t) => t.assignedMemberId === member.id).length} tasks
                        </span>
                      </div>
                    ))}
                    {members.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{members.length - 3} more members
                      </p>
                    )}
                    {members.length === 0 && (
                      <p className="text-sm text-muted-foreground">No members assigned</p>
                    )}
                  </div>
                </div>

                <Link to={`/teams/${team.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Team Details
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {displayedTeams.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No Teams</h3>
            <p className="text-muted-foreground mt-2">
              Create your first team to get started.
            </p>
            <Link to="/teams/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}