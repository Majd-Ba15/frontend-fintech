'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockTasks, mockChangeRequests } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { calculateTaskWeight, Task, TaskStatus } from '@/lib/types';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  ChevronRight,
  FileText,
  Play,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const statusIcons: Record<TaskStatus, typeof Circle> = {
  new: Circle,
  in_progress: Loader2,
  blocked: AlertCircle,
  done: CheckCircle2,
};

const statusColors: Record<TaskStatus, string> = {
  new: 'text-muted-foreground',
  in_progress: 'text-amber-400',
  blocked: 'text-red-400',
  done: 'text-emerald-400',
};

const statusBgColors: Record<TaskStatus, string> = {
  new: 'bg-muted/50',
  in_progress: 'bg-amber-500/10',
  blocked: 'bg-red-500/10',
  done: 'bg-emerald-500/10',
};

export function MemberDashboard() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [tasks, setTasks] = useState(mockTasks);

  // Get tasks assigned to this member
  const myTasks = tasks.filter((t) => t.assignedMemberId === user?.id);
  const myRequests = mockChangeRequests.filter((r) => r.requestedBy === user?.id);

  // Filter tasks
  const filteredTasks =
    statusFilter === 'all' ? myTasks : myTasks.filter((t) => t.status === statusFilter);

  // Stats
  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress').length;
  const unacknowledgedTasks = myTasks.filter((t) => !t.acknowledged);
  const pendingRequests = myRequests.filter((r) => r.status === 'pending').length;

  // Calculate total workload (excluding completed tasks)
  const totalWeight = myTasks
    .filter((t) => t.status !== 'done')
    .reduce((sum, task) => sum + calculateTaskWeight(task), 0);
  const totalEffort = myTasks
    .filter((t) => t.status !== 'done')
    .reduce((sum, task) => sum + task.estimatedEffort, 0);

  // Calculate progress percentage
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleAcknowledge = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, acknowledged: true } : task
      )
    );
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 text-red-400';
      case 'high':
        return 'bg-amber-500/20 text-amber-400';
      case 'medium':
        return 'bg-chart-1/20 text-chart-1';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getNextStatus = (currentStatus: TaskStatus): TaskStatus | null => {
    switch (currentStatus) {
      case 'new':
        return 'in_progress';
      case 'in_progress':
        return 'done';
      default:
        return null;
    }
  };

  const getStatusActionLabel = (currentStatus: TaskStatus): string => {
    switch (currentStatus) {
      case 'new':
        return 'Start';
      case 'in_progress':
        return 'Complete';
      default:
        return '';
    }
  };

  const getStatusActionIcon = (currentStatus: TaskStatus) => {
    switch (currentStatus) {
      case 'new':
        return Play;
      case 'in_progress':
        return Check;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
        <p className="text-muted-foreground">
          View and manage your assigned tasks
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Your Progress</h3>
              <p className="text-sm text-muted-foreground">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
            <div className="text-3xl font-bold text-primary">{progressPercentage}%</div>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{completedTasks} completed</span>
            <span>{inProgressTasks} in progress</span>
            <span>{myTasks.filter(t => t.status === 'new').length} new</span>
          </div>
        </CardContent>
      </Card>

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
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Loader2 className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{inProgressTasks}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
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
              <div className="p-2 rounded-lg bg-chart-4/10">
                <Clock className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalEffort}h</p>
                <p className="text-xs text-muted-foreground">Remaining Effort</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unacknowledged Tasks Alert */}
      {unacknowledgedTasks.length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  You have {unacknowledgedTasks.length} unacknowledged task
                  {unacknowledgedTasks.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please acknowledge these tasks to confirm you have seen them.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {unacknowledgedTasks.map((task) => (
                    <Button
                      key={task.id}
                      size="sm"
                      variant="outline"
                      className="border-amber-500/50"
                      onClick={() => handleAcknowledge(task.id)}
                    >
                      Acknowledge: {task.title.slice(0, 20)}...
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Tasks</CardTitle>
                  <CardDescription>
                    {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap gap-2 mt-4">
                {(['all', 'new', 'in_progress', 'blocked', 'done'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const StatusIcon = statusIcons[task.status];
                  const weight = calculateTaskWeight(task);
                  const nextStatus = getNextStatus(task.status);
                  const ActionIcon = getStatusActionIcon(task.status);

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border border-border ${statusBgColors[task.status]} transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <StatusIcon
                            className={`h-5 w-5 mt-0.5 ${statusColors[task.status]}`}
                          />
                          <div className="flex-1">
                            <Link to={`/dashboard/tasks/${task.id}`}
                              className="font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {task.title}
                            </Link>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-muted-foreground">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Effort: {task.estimatedEffort}h
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Weight: {weight.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTaskPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {!task.acknowledged && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                              Unack
                            </span>
                          )}
                          {nextStatus && ActionIcon && (
                            <Button
                              size="sm"
                              variant={task.status === 'in_progress' ? 'default' : 'outline'}
                              className={task.status === 'in_progress' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                              onClick={(e) => {
                                e.preventDefault();
                                handleStatusChange(task.id, nextStatus);
                              }}
                            >
                              <ActionIcon className="h-4 w-4 mr-1" />
                              {getStatusActionLabel(task.status)}
                            </Button>
                          )}
                          <Link to={`/dashboard/tasks/${task.id}`}>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No tasks found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workload Summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Workload Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Total Weight</span>
                    <span className="font-medium text-foreground">{totalWeight.toFixed(1)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        totalWeight <= 15
                          ? 'bg-emerald-500'
                          : totalWeight <= 25
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((totalWeight / 30) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalWeight <= 15
                      ? 'Available capacity'
                      : totalWeight <= 25
                      ? 'Moderate workload'
                      : 'Heavy workload'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-lg font-bold text-foreground">{totalEffort}h</p>
                    <p className="text-xs text-muted-foreground">Total Effort</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-lg font-bold text-foreground">
                      {myTasks.filter((t) => t.status !== 'done').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Active Tasks</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Requests */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">My Requests</CardTitle>
                <Link to="/dashboard/requests">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {pendingRequests > 0 ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-foreground">
                      {pendingRequests} pending request{pendingRequests > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No pending requests</p>
              )}

              <Link to="/dashboard/requests/new">
                <Button variant="outline" className="w-full mt-3" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  New Change Request
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
