// User Roles
export type UserRole = 'admin' | 'team_leader' | 'member';

// Task Priority and Complexity
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskComplexity = 'simple' | 'medium' | 'complex';
export type TaskStatus = 'new' | 'in_progress' | 'blocked' | 'done';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId: string;
  avatar?: string;
}

// Team interface
export interface Team {
  id: string;
  name: string;
  leaderId: string;
  memberIds: string[];
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  assignedMemberId: string;
  priority: TaskPriority;
  complexity: TaskComplexity;
  estimatedEffort: number; // in hours
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Change Request
export type ChangeRequestType = 'owner_change' | 'due_date_change' | 'effort_increase';
export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ChangeRequest {
  id: string;
  taskId: string;
  requestedBy: string;
  type: ChangeRequestType;
  oldValue: string;
  newValue: string;
  reason: string;
  status: ChangeRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

// Multipliers for weight calculation
export const COMPLEXITY_MULTIPLIERS: Record<TaskComplexity, number> = {
  simple: 1.0,
  medium: 1.5,
  complex: 2.0,
};

export const PRIORITY_MULTIPLIERS: Record<TaskPriority, number> = {
  low: 1.0,
  medium: 1.2,
  high: 1.5,
  critical: 2.0,
};

// Calculate task weight
export function calculateTaskWeight(task: Task): number {
  return (
    task.estimatedEffort *
    COMPLEXITY_MULTIPLIERS[task.complexity] *
    PRIORITY_MULTIPLIERS[task.priority]
  );
}

// Workload status thresholds
export type WorkloadStatus = 'available' | 'moderate' | 'overloaded';

export function getWorkloadStatus(totalWeight: number): WorkloadStatus {
  if (totalWeight <= 15) return 'available';
  if (totalWeight <= 25) return 'moderate';
  return 'overloaded';
}

export function getWorkloadColor(status: WorkloadStatus): string {
  switch (status) {
    case 'available':
      return 'text-emerald-400';
    case 'moderate':
      return 'text-amber-400';
    case 'overloaded':
      return 'text-red-400';
  }
}

export function getWorkloadBgColor(status: WorkloadStatus): string {
  switch (status) {
    case 'available':
      return 'bg-emerald-500/20';
    case 'moderate':
      return 'bg-amber-500/20';
    case 'overloaded':
      return 'bg-red-500/20';
  }
}
