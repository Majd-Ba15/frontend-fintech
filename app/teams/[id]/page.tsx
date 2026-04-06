'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUsers, getTeams, getTasks, getTeamById } from '@/lib/api';
import { ArrowLeft, Building2, Users, Edit, Trash2, User as UserIcon, CheckSquare } from 'lucide-react';

export default function TeamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [teamRes, usersRes, tasksRes] = await Promise.allSettled([
          getTeamById(id!),
          getUsers(),
          getTasks(),
        ]);

        if (!active) return;

        const teamData = teamRes.status === 'fulfilled' ? (Array.isArray(teamRes.value) ? teamRes.value[0] : teamRes.value?.data || teamRes.value) : null;
        const usersData = usersRes.status === 'fulfilled' ? (Array.isArray(usersRes.value) ? usersRes.value : usersRes.value?.data || []) : [];
        const tasksData = tasksRes.status === 'fulfilled' ? (Array.isArray(tasksRes.value) ? tasksRes.value : tasksRes.value?.data || []) : [];

        setTeam(teamData);
        setUsers(usersData);
        setTasks(tasksData);
      } catch (err: any) {
        setError(err?.message || 'Unable to load team details.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [id]);

  if (!id) return null;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading team details...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading team: {error}</div>;
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Team Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The team you are looking for does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teamMemberIds = Array.isArray(team.memberIds) ? team.memberIds.map(String) : [];
  const leader = users.find((u) => String(u.id) === String(team.leaderId));
  const members = users.filter((u) => teamMemberIds.includes(String(u.id)));
  const teamTasks = tasks.filter((t) => members.some((m) => String(t.assignedMemberId) === String(m.id)));
  const activeTasks = teamTasks.filter((t) => t.status !== 'done');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
              <p className="text-muted-foreground">Team ID: {team.id}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Team Leader */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Team Leader</CardTitle>
        </CardHeader>
        <CardContent>
          {leader ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="h-10 w-10 rounded-full bg-chart-2/20 flex items-center justify-center">
                <span className="text-sm font-medium text-chart-2">
                  {leader.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{leader.name}</p>
                <p className="text-xs text-muted-foreground">{leader.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No leader assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{members.length}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{teamTasks.length}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{activeTasks.length}</p>
            <p className="text-xs text-muted-foreground">Active Tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
          <CardDescription>Members of this team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => {
              const memberTasks = tasks.filter((t) => String(t.assignedMemberId) === String(member.id));
              const activeMemberTasks = memberTasks.filter((t) => t.status !== 'done');
              return (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{memberTasks.length} tasks</p>
                    <p className="text-xs text-muted-foreground">{activeMemberTasks.length} active</p>
                  </div>
                </div>
              );
            })}
            {members.length === 0 && (
              <p className="text-muted-foreground">No members assigned to this team</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Tasks</CardTitle>
          <CardDescription>Tasks assigned to team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamTasks.slice(0, 5).map((task) => {
              const assignee = users.find((u) => String(u.id) === String(task.assignedMemberId));
              return (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Assigned to {assignee?.name}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                    task.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
                    task.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
            {teamTasks.length === 0 && (
              <p className="text-muted-foreground">No tasks assigned to this team</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}