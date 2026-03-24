'use client';

import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockUsers, mockTasks } from '@/lib/mock-data';
import {
  calculateTaskWeight,
  getWorkloadStatus,
  getWorkloadColor,
  getWorkloadBgColor,
  TaskStatus,
} from '@/lib/types';
import {
  ArrowLeft,
  Mail,
  User,
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  ChevronRight,
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

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const member = mockUsers.find((u) => u.id === id);
  const memberTasks = mockTasks.filter((t) => t.assignedMemberId === id);

  if (!member) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Member Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The team member you are looking for does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate workload
  const activeTasks = memberTasks.filter((t) => t.status !== 'done');
  const totalWeight = activeTasks.reduce((sum, task) => sum + calculateTaskWeight(task), 0);
  const totalEffort = activeTasks.reduce((sum, task) => sum + task.estimatedEffort, 0);
  const workloadStatus = getWorkloadStatus(totalWeight);

  // Task stats
  const completedTasks = memberTasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = memberTasks.filter((t) => t.status === 'in_progress').length;
  const blockedTasks = memberTasks.filter((t) => t.status === 'blocked').length;
  const unacknowledgedTasks = memberTasks.filter((t) => !t.acknowledged).length;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl font-medium text-primary">
                {member.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{member.name}</h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {member.email}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${getWorkloadBgColor(
            workloadStatus
          )} ${getWorkloadColor(workloadStatus)}`}
        >
          {workloadStatus}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <CheckSquare className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{memberTasks.length}</p>
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
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-400" />
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
              <div className="p-2 rounded-lg bg-chart-4/10">
                <AlertTriangle className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{unacknowledgedTasks}</p>
                <p className="text-xs text-muted-foreground">Unack</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Assigned Tasks</CardTitle>
              <CardDescription>
                All tasks assigned to {member.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {memberTasks.map((task) => {
                  const StatusIcon = statusIcons[task.status];
                  const weight = calculateTaskWeight(task);

                  return (
                    <Link
                      key={task.id}
                      href={`/dashboard/tasks/${task.id}`}
                      className="block p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <StatusIcon
                            className={`h-5 w-5 mt-0.5 ${statusColors[task.status]}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{task.title}</p>
                              {!task.acknowledged && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                                  Unack
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
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
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getTaskPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {memberTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No tasks assigned</p>
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
                    <span className={`font-medium ${getWorkloadColor(workloadStatus)}`}>
                      {totalWeight.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        workloadStatus === 'available'
                          ? 'bg-emerald-500'
                          : workloadStatus === 'moderate'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((totalWeight / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-lg font-bold text-foreground">{totalEffort}h</p>
                    <p className="text-xs text-muted-foreground">Remaining Effort</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-lg font-bold text-foreground">{activeTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Active Tasks</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weight Breakdown */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Weight Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeTasks.slice(0, 5).map((task) => {
                  const weight = calculateTaskWeight(task);
                  return (
                    <div key={task.id} className="flex items-center justify-between">
                      <span className="text-sm text-foreground truncate flex-1 mr-2">
                        {task.title}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {weight.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
                {activeTasks.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{activeTasks.length - 5} more tasks
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-2">
              <Link to="/dashboard/tasks/new">
                <Button className="w-full">Assign New Task</Button>
              </Link>
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
