'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserById, getTasks, getTeams } from '@/lib/api';
import { ArrowLeft, User as UserIcon, Mail, Shield, UserCog, CheckSquare } from 'lucide-react';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [userRes, tasksRes, teamsRes] = await Promise.allSettled([
          getUserById(id!),
          getTasks(),
          getTeams(),
        ]);

        if (!active) return;

        const userData = userRes.status === 'fulfilled' ? (Array.isArray(userRes.value) ? userRes.value[0] : userRes.value?.data || userRes.value) : null;
        const tasksData = tasksRes.status === 'fulfilled' ? (Array.isArray(tasksRes.value) ? tasksRes.value : tasksRes.value?.data || []) : [];
        const teamsData = teamsRes.status === 'fulfilled' ? (Array.isArray(teamsRes.value) ? teamsRes.value : teamsRes.value?.data || []) : [];

        setUser(userData);
        setTasks(tasksData);
        setTeams(teamsData);
      } catch (err: any) {
        setError(err?.message || 'Unable to load user details.');
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
    return <div className="p-8 text-center text-muted-foreground">Loading user details...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading user: {error}</div>;
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <UserIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground">User Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The user you are looking for does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userTasks = tasks.filter((t) => String(t.assignedMemberId) === String(id));
  const team = teams.find((t) => String(t.id) === String(user.teamId));
  const activeTasks = userTasks.filter((t) => t.status !== 'done');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'team_leader':
        return UserCog;
      default:
        return UserIcon;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary/20 text-primary';
      case 'team_leader':
        return 'bg-chart-2/20 text-chart-2';
      default:
        return 'bg-chart-3/20 text-chart-3';
    }
  };

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl font-medium text-primary">
                {user.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${getRoleColor(user.role)}`}>
          <RoleIcon className="h-4 w-4" />
          {user.role.replace('_', ' ')}
        </span>
      </div>

      {/* Team Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Team Information</CardTitle>
        </CardHeader>
        <CardContent>
          {team ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="h-8 w-8 rounded-full bg-chart-2/20 flex items-center justify-center">
                <span className="text-sm font-medium text-chart-2">T</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{team.name}</p>
                <p className="text-xs text-muted-foreground">Team ID: {team.id}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Not assigned to any team</p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{userTasks.length}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{activeTasks.length}</p>
            <p className="text-xs text-muted-foreground">Active Tasks</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{userTasks.filter(t => t.status === 'done').length}</p>
            <p className="text-xs text-muted-foreground">Completed Tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Tasks</CardTitle>
          <CardDescription>Tasks assigned to this user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
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
            ))}
            {userTasks.length === 0 && (
              <p className="text-muted-foreground">No tasks assigned to this user</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}