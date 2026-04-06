'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { getUsers, getTeams, getTasks } from '@/lib/api';
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [tasksRes, usersRes, teamsRes] = await Promise.allSettled([
          getTasks(),
          getUsers(),
          getTeams(),
        ]);

        if (!active) return;

        const tasksData = tasksRes.status === 'fulfilled' ? (Array.isArray(tasksRes.value) ? tasksRes.value : tasksRes.value?.data || []) : [];
        const usersData = usersRes.status === 'fulfilled' ? (Array.isArray(usersRes.value) ? usersRes.value : usersRes.value?.data || []) : [];
        const teamsData = teamsRes.status === 'fulfilled' ? (Array.isArray(teamsRes.value) ? teamsRes.value : teamsRes.value?.data || []) : [];

        setTasks(tasksData);
        setUsers(usersData);
        setTeams(teamsData);
      } catch (err: any) {
        setError(err?.message || 'Unable to load tasks.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const team = teams.find((t) => t.leaderId === user?.id);
  const teamMemberIds = team?.memberIds || [];

  // Filter tasks based on role
  let displayedTasks = tasks;
  if (user?.role === 'team_leader') {
    displayedTasks = tasks.filter((t) => teamMemberIds.includes(t.assignedMemberId));
  } else if (user?.role === 'member') {
    displayedTasks = tasks.filter((t) => t.assignedMemberId === user.id);
  }

  // Apply filters
  let filteredTasks = displayedTasks;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading tasks: {error}</div>;
  }

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
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">
            View and manage tasks
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'team_leader') && (
          <Link to="/tasks/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Status: {statusFilter === 'all' ? 'All' : statusFilter.replace('_', ' ')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('new')}>New</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>In Progress</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('blocked')}>Blocked</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('done')}>Done</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Priority: {priorityFilter === 'all' ? 'All' : priorityFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPriorityFilter('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('low')}>Low</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>Medium</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('high')}>High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('critical')}>Critical</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tasks found.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const assignedUser = users.find((u) => u.id === task.assignedMemberId);
            const StatusIcon = statusIcons[task.status];
            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <StatusIcon className={`w-5 h-5 mt-1 ${statusColors[task.status]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground truncate">{task.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Assigned to: {assignedUser?.name || 'Unknown'}</span>
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          <span>Weight: {calculateTaskWeight(task).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/tasks/${task.id}`}>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}