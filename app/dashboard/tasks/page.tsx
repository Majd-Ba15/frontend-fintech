'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockTasks, mockUsers, mockTeams } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { calculateTaskWeight, Task, TaskStatus, TaskPriority } from '@/lib/types';
import {
  Plus,
  Search,
  Filter,
  CheckSquare,
  Circle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

export default function TasksPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  // Get team if user is team leader
  const team = mockTeams.find((t) => t.leaderId === user?.id);
  const teamMemberIds = team?.memberIds || [];

  // Filter tasks based on role
  let tasks = mockTasks;
  if (user?.role === 'team_leader') {
    tasks = mockTasks.filter((t) => teamMemberIds.includes(t.assignedMemberId));
  } else if (user?.role === 'member') {
    tasks = mockTasks.filter((t) => t.assignedMemberId === user.id);
  }

  // Apply filters
  let filteredTasks = tasks;
  if (searchQuery) {
    filteredTasks = filteredTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (statusFilter !== 'all') {
    filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
  }
  if (priorityFilter !== 'all') {
    filteredTasks = filteredTasks.filter((t) => t.priority === priorityFilter);
  }

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Task Management</h1>
          <p className="text-muted-foreground">
            View and manage all tasks
          </p>
        </div>
        {user?.role === 'team_leader' && (
          <Link to="/dashboard/tasks/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Status: {statusFilter === 'all' ? 'All' : statusFilter.replace('_', ' ')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('new')}>New</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('blocked')}>
                    Blocked
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('done')}>Done</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Priority: {priorityFilter === 'all' ? 'All' : priorityFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPriorityFilter('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('critical')}>
                    Critical
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('high')}>High</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter('low')}>Low</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Tasks</CardTitle>
          <CardDescription>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const StatusIcon = statusIcons[task.status];
              const assignee = mockUsers.find((u) => u.id === task.assignedMemberId);
              const weight = calculateTaskWeight(task);

              return (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks/${task.id}`}
                  className="block p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <StatusIcon className={`h-5 w-5 mt-0.5 ${statusColors[task.status]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">{task.title}</p>
                          {!task.acknowledged && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                              Unacknowledged
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            Assigned to: {assignee?.name || 'Unknown'}
                          </span>
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

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getTaskPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          task.complexity === 'complex'
                            ? 'bg-chart-5/20 text-chart-5'
                            : task.complexity === 'medium'
                            ? 'bg-chart-3/20 text-chart-3'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {task.complexity}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tasks found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
