'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockUsers, mockTeams, mockTasks } from '@/lib/mock-data';
import { Users, Building2, CheckSquare, TrendingUp, UserPlus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const totalUsers = mockUsers.length;
  const totalTeams = mockTeams.length;
  const totalTasks = mockTasks.length;
  const activeTasks = mockTasks.filter((t) => t.status !== 'done').length;

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      description: 'Registered users',
      icon: Users,
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
    {
      title: 'Teams',
      value: totalTeams,
      description: 'Active teams',
      icon: Building2,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      title: 'Total Tasks',
      value: totalTasks,
      description: 'All time',
      icon: CheckSquare,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
    },
    {
      title: 'Active Tasks',
      value: activeTasks,
      description: 'In progress',
      icon: TrendingUp,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, teams, and system configuration</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link to="/dashboard/users">
              <Button variant="outline" className="w-full justify-start gap-2">
                <UserPlus className="h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link to="/dashboard/teams">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Building2 className="h-4 w-4" />
                Manage Teams
              </Button>
            </Link>
            <Link to="/dashboard/settings">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" />
                System Settings
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start gap-2">
              <TrendingUp className="h-4 w-4" />
              View Reports
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Users</CardTitle>
            <CardDescription>Latest registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockUsers.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-primary/20 text-primary'
                        : user.role === 'team_leader'
                        ? 'bg-chart-2/20 text-chart-2'
                        : 'bg-chart-3/20 text-chart-3'
                    }`}
                  >
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams Overview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Teams Overview</CardTitle>
          <CardDescription>All teams and their members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockTeams.map((team) => {
              const leader = mockUsers.find((u) => u.id === team.leaderId);
              const memberCount = team.memberIds.length;
              const teamTasks = mockTasks.filter((t) =>
                team.memberIds.includes(t.assignedMemberId)
              );

              return (
                <div
                  key={team.id}
                  className="p-4 rounded-lg border border-border bg-secondary/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-foreground">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Led by {leader?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="p-2 rounded-md bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-2 rounded bg-card">
                      <p className="text-lg font-bold text-foreground">{memberCount}</p>
                      <p className="text-xs text-muted-foreground">Members</p>
                    </div>
                    <div className="text-center p-2 rounded bg-card">
                      <p className="text-lg font-bold text-foreground">{teamTasks.length}</p>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
