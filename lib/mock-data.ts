import { User, Team, Task, ChangeRequest } from './types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@company.com',
    role: 'admin',
    teamId: 'team-1',
  },
  {
    id: 'user-2',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    role: 'team_leader',
    teamId: 'team-1',
  },
  {
    id: 'user-3',
    name: 'Mike Chen',
    email: 'mike@company.com',
    role: 'member',
    teamId: 'team-1',
  },
  {
    id: 'user-4',
    name: 'Emily Davis',
    email: 'emily@company.com',
    role: 'member',
    teamId: 'team-1',
  },
  {
    id: 'user-5',
    name: 'James Wilson',
    email: 'james@company.com',
    role: 'member',
    teamId: 'team-1',
  },
  {
    id: 'user-6',
    name: 'Lisa Anderson',
    email: 'lisa@company.com',
    role: 'member',
    teamId: 'team-2',
  },
  {
    id: 'user-7',
    name: 'Robert Taylor',
    email: 'robert@company.com',
    role: 'team_leader',
    teamId: 'team-2',
  },
];

// Mock Teams
export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Development Team Alpha',
    leaderId: 'user-2',
    memberIds: ['user-3', 'user-4', 'user-5'],
  },
  {
    id: 'team-2',
    name: 'Development Team Beta',
    leaderId: 'user-7',
    memberIds: ['user-6'],
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Implement User Authentication',
    description: 'Build login and registration functionality with JWT tokens',
    assignedMemberId: 'user-3',
    priority: 'high',
    complexity: 'complex',
    estimatedEffort: 16,
    startDate: '2026-03-10',
    dueDate: '2026-03-17',
    status: 'in_progress',
    acknowledged: true,
    acknowledgedAt: '2026-03-10T09:00:00Z',
    createdAt: '2026-03-09T10:00:00Z',
    updatedAt: '2026-03-12T14:30:00Z',
    createdBy: 'user-2',
  },
  {
    id: 'task-2',
    title: 'Design Dashboard UI',
    description: 'Create wireframes and mockups for the main dashboard',
    assignedMemberId: 'user-4',
    priority: 'medium',
    complexity: 'medium',
    estimatedEffort: 8,
    startDate: '2026-03-11',
    dueDate: '2026-03-14',
    status: 'done',
    acknowledged: true,
    acknowledgedAt: '2026-03-11T08:30:00Z',
    createdAt: '2026-03-10T11:00:00Z',
    updatedAt: '2026-03-13T16:00:00Z',
    createdBy: 'user-2',
  },
  {
    id: 'task-3',
    title: 'API Integration Testing',
    description: 'Write integration tests for all REST API endpoints',
    assignedMemberId: 'user-5',
    priority: 'medium',
    complexity: 'medium',
    estimatedEffort: 12,
    startDate: '2026-03-12',
    dueDate: '2026-03-19',
    status: 'new',
    acknowledged: false,
    createdAt: '2026-03-11T09:00:00Z',
    updatedAt: '2026-03-11T09:00:00Z',
    createdBy: 'user-2',
  },
  {
    id: 'task-4',
    title: 'Database Schema Optimization',
    description: 'Optimize database queries and indexes for better performance',
    assignedMemberId: 'user-3',
    priority: 'critical',
    complexity: 'complex',
    estimatedEffort: 20,
    startDate: '2026-03-14',
    dueDate: '2026-03-21',
    status: 'new',
    acknowledged: true,
    acknowledgedAt: '2026-03-14T10:00:00Z',
    createdAt: '2026-03-13T14:00:00Z',
    updatedAt: '2026-03-13T14:00:00Z',
    createdBy: 'user-2',
  },
  {
    id: 'task-5',
    title: 'Mobile Responsive Design',
    description: 'Ensure all pages work correctly on mobile devices',
    assignedMemberId: 'user-4',
    priority: 'low',
    complexity: 'simple',
    estimatedEffort: 6,
    startDate: '2026-03-15',
    dueDate: '2026-03-18',
    status: 'new',
    acknowledged: false,
    createdAt: '2026-03-14T15:00:00Z',
    updatedAt: '2026-03-14T15:00:00Z',
    createdBy: 'user-2',
  },
  {
    id: 'task-6',
    title: 'Documentation Update',
    description: 'Update API documentation with new endpoints',
    assignedMemberId: 'user-5',
    priority: 'low',
    complexity: 'simple',
    estimatedEffort: 4,
    startDate: '2026-03-16',
    dueDate: '2026-03-17',
    status: 'new',
    acknowledged: true,
    acknowledgedAt: '2026-03-16T08:00:00Z',
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    createdBy: 'user-2',
  },
  {
    id: 'task-7',
    title: 'Security Audit',
    description: 'Perform security audit and fix vulnerabilities',
    assignedMemberId: 'user-3',
    priority: 'critical',
    complexity: 'complex',
    estimatedEffort: 24,
    startDate: '2026-03-17',
    dueDate: '2026-03-24',
    status: 'blocked',
    acknowledged: true,
    acknowledgedAt: '2026-03-17T09:00:00Z',
    createdAt: '2026-03-16T11:00:00Z',
    updatedAt: '2026-03-18T10:00:00Z',
    createdBy: 'user-2',
  },
];

// Mock Change Requests
export const mockChangeRequests: ChangeRequest[] = [
  {
    id: 'cr-1',
    taskId: 'task-4',
    requestedBy: 'user-3',
    type: 'due_date_change',
    oldValue: '2026-03-21',
    newValue: '2026-03-25',
    reason: 'Need more time due to unexpected complexity',
    status: 'pending',
    createdAt: '2026-03-14T11:00:00Z',
  },
  {
    id: 'cr-2',
    taskId: 'task-7',
    requestedBy: 'user-3',
    type: 'effort_increase',
    oldValue: '24',
    newValue: '32',
    reason: 'Additional vulnerabilities discovered',
    status: 'pending',
    createdAt: '2026-03-18T10:00:00Z',
  },
  {
    id: 'cr-3',
    taskId: 'task-3',
    requestedBy: 'user-5',
    type: 'owner_change',
    oldValue: 'user-5',
    newValue: 'user-4',
    reason: 'Emily has more experience with testing frameworks',
    status: 'approved',
    reviewedBy: 'user-2',
    reviewedAt: '2026-03-12T14:00:00Z',
    createdAt: '2026-03-12T10:00:00Z',
  },
];

// Helper function to get tasks for a specific week
export function getTasksForWeek(tasks: Task[], startOfWeek: Date, endOfWeek: Date): Task[] {
  return tasks.filter((task) => {
    const taskStart = new Date(task.startDate);
    const taskDue = new Date(task.dueDate);
    return (
      (taskStart >= startOfWeek && taskStart <= endOfWeek) ||
      (taskDue >= startOfWeek && taskDue <= endOfWeek) ||
      (taskStart <= startOfWeek && taskDue >= endOfWeek)
    );
  });
}

// Get current week dates
export function getCurrentWeekDates(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Get next week dates
export function getNextWeekDates(): { start: Date; end: Date } {
  const { start: currentStart } = getCurrentWeekDates();
  const start = new Date(currentStart);
  start.setDate(currentStart.getDate() + 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
