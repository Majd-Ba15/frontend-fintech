'use client';

import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { acknowledgeTask, getTaskById, getUserById, updateTaskStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  calculateTaskWeight,
  COMPLEXITY_MULTIPLIERS,
  PRIORITY_MULTIPLIERS,
} from '@/lib/types';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Edit,
  Trash2,
  Loader2,
  PauseCircle,
  Circle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TaskDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<any | null>(null);
  const [assignee, setAssignee] = useState<any | null>(null);
  const [creator, setCreator] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    async function loadTask() {
      setLoading(true);
      setError(null);

      try {
        const taskRes = await getTaskById(id!);
        if (!active) return;

        const taskData = Array.isArray(taskRes) ? taskRes[0] : taskRes?.data || taskRes;
        setTask(taskData);

        if (taskData?.assignedMemberId && (user?.role === 'admin' || user?.role === 'team_leader' || String(user?.id) === String(taskData.assignedMemberId))) {
          const assignedUserRes = await getUserById(taskData.assignedMemberId);
          if (!active) return;
          setAssignee(Array.isArray(assignedUserRes) ? assignedUserRes[0] : assignedUserRes?.data || assignedUserRes);
        } else if (taskData?.assignedMemberId) {
          setAssignee({
            id: String(taskData.assignedMemberId),
            name: String(user?.id) === String(taskData.assignedMemberId) ? user?.name : 'Assigned Member',
          });
        }

        if (taskData?.createdBy && (user?.role === 'admin' || user?.role === 'team_leader' || String(user?.id) === String(taskData.createdBy))) {
          const creatorUserRes = await getUserById(taskData.createdBy);
          if (!active) return;
          setCreator(Array.isArray(creatorUserRes) ? creatorUserRes[0] : creatorUserRes?.data || creatorUserRes);
        } else if (taskData?.createdBy) {
          setCreator({
            id: String(taskData.createdBy),
            name: String(user?.id) === String(taskData.createdBy) ? user?.name : 'Task Creator',
          });
        }
      } catch (err: any) {
        setError(err?.message || 'Unable to load task.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTask();
    return () => {
      active = false;
    };
  }, [id, user]);

  if (!user) return null;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading task details...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading task: {error}</div>;
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground">Task Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The task you are looking for does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weight = calculateTaskWeight(task);
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[task.complexity as keyof typeof COMPLEXITY_MULTIPLIERS];
  const priorityMultiplier = PRIORITY_MULTIPLIERS[task.priority as keyof typeof PRIORITY_MULTIPLIERS];

  const getStatusColor = () => {
    switch (task.status) {
      case 'done':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'in_progress':
        return 'bg-amber-500/20 text-amber-400';
      case 'blocked':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
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

  const handleAcknowledge = async () => {
    try {
      setIsUpdating(true);
      await acknowledgeTask(task.id);
      setTask({ ...task, acknowledged: true, acknowledgedAt: new Date().toISOString() });
    } catch (err: any) {
      setError(err?.message || 'Unable to acknowledge task.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      setIsUpdating(true);
      await updateTaskStatus(task.id, status);
      setTask({ ...task, status, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      setError(err?.message || 'Unable to update task status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusActions = [
    { value: 'new', label: 'New', icon: Circle },
    { value: 'in_progress', label: 'In Progress', icon: Loader2 },
    { value: 'blocked', label: 'Blocked', icon: PauseCircle },
    { value: 'done', label: 'Done', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
              <span
                className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor()}`}
              >
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">Task ID: {task.id}</p>
          </div>
        </div>

        {user?.role === 'team_leader' && (
          <div className="flex gap-2">
            <Link to={`/dashboard/tasks/${task.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Acknowledgement Alert */}
      {!task.acknowledged && user?.id === task.assignedMemberId && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="font-medium text-foreground">Task requires acknowledgement</p>
                  <p className="text-sm text-muted-foreground">
                    Please acknowledge this task to confirm you have seen it.
                  </p>
                </div>
              </div>
              <Button onClick={handleAcknowledge}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isUpdating ? 'Saving...' : 'Acknowledge'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{task.description}</p>
            </CardContent>
          </Card>

          {/* Weight Calculation */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Weight Calculation</CardTitle>
              <CardDescription>How the task weight is calculated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{task.estimatedEffort}</p>
                    <p className="text-xs text-muted-foreground">Effort (hours)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">x{complexityMultiplier}</p>
                    <p className="text-xs text-muted-foreground">Complexity ({task.complexity})</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">x{priorityMultiplier}</p>
                    <p className="text-xs text-muted-foreground">Priority ({task.priority})</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">= {weight.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Total Weight</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded bg-muted/50">
                <p className="text-sm text-muted-foreground font-mono">
                  Weight = {task.estimatedEffort} × {complexityMultiplier} × {priorityMultiplier} ={' '}
                  {weight.toFixed(1)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status History (mock) */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">
                      Task created by <span className="font-medium">{creator?.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(task.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {task.acknowledged && task.acknowledgedAt && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        Task acknowledged by <span className="font-medium">{assignee?.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.acknowledgedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {task.status !== 'new' && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-chart-1/20 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-chart-1" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        Status changed to{' '}
                        <span className="font-medium">{task.status.replace('_', ' ')}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Assigned to</span>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {assignee?.name?.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{assignee?.name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor()}`}>
                  {task.priority}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Complexity</span>
                <span className="text-sm font-medium text-foreground capitalize">
                  {task.complexity}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Effort</span>
                <span className="text-sm font-medium text-foreground">
                  {task.estimatedEffort} hours
                </span>
              </div>

              <hr className="border-border" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Start Date</span>
                <div className="flex items-center gap-1 text-sm text-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.startDate).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due Date</span>
                <div className="flex items-center gap-1 text-sm text-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </div>

              <hr className="border-border" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Acknowledged</span>
                <span
                  className={`text-sm font-medium ${
                    task.acknowledged ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {task.acknowledged ? 'Yes' : 'No'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {user?.id === task.assignedMemberId && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {statusActions.map((statusAction) => {
                    const StatusActionIcon = statusAction.icon;
                    return (
                      <Button
                        key={statusAction.value}
                        variant={task.status === statusAction.value ? 'default' : 'outline'}
                        disabled={isUpdating || !task.acknowledged || task.status === statusAction.value}
                        onClick={() => handleStatusUpdate(statusAction.value)}
                      >
                        <StatusActionIcon className="h-4 w-4 mr-2" />
                        {statusAction.label}
                      </Button>
                    );
                  })}
                </div>
                {!task.acknowledged && (
                  <p className="text-xs text-amber-500">
                    Acknowledge the task before changing its status.
                  </p>
                )}
                <Link to="/dashboard/requests/new" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Request Change
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
