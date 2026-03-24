'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockUsers, mockTasks, mockTeams, getCurrentWeekDates, getNextWeekDates } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import {
  calculateTaskWeight,
  getWorkloadStatus,
  getWorkloadColor,
  getWorkloadBgColor,
} from '@/lib/types';
import { Users, ChevronRight, Mail, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

type WeekView = 'this_week' | 'next_week';

export default function TeamPage() {
  const { user } = useAuth();
  const [weekView, setWeekView] = useState<WeekView>('this_week');

  // Get the team this leader manages
  const team = mockTeams.find((t) => t.leaderId === user?.id);
  const teamMemberIds = team?.memberIds || [];
  const teamMembers = mockUsers.filter((u) => teamMemberIds.includes(u.id));

  // Get week dates
  const { start: thisWeekStart, end: thisWeekEnd } = getCurrentWeekDates();
  const { start: nextWeekStart, end: nextWeekEnd } = getNextWeekDates();

  const weekStart = weekView === 'this_week' ? thisWeekStart : nextWeekStart;
  const weekEnd = weekView === 'this_week' ? thisWeekEnd : nextWeekEnd;

  // Filter tasks for the selected week and team
  const weekTasks = mockTasks.filter((task) => {
    if (!teamMemberIds.includes(task.assignedMemberId)) return false;
    const taskStart = new Date(task.startDate);
    const taskDue = new Date(task.dueDate);
    return (
      (taskStart >= weekStart && taskStart <= weekEnd) ||
      (taskDue >= weekStart && taskDue <= weekEnd) ||
      (taskStart <= weekStart && taskDue >= weekEnd)
    );
  });

  // Calculate workload per member
  const memberWorkloads = teamMembers.map((member) => {
    const memberTasks = weekTasks.filter((t) => t.assignedMemberId === member.id);
    const allMemberTasks = mockTasks.filter((t) => t.assignedMemberId === member.id);
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

              <Link to={`/dashboard/team/${member.id}`}>
                <Button variant="outline" className="w-full">
                  View Details
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
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
