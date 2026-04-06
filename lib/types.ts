// User Roles
export type UserRole = 'admin' | 'team_leader' | 'member';

// Task Priority and Complexity
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskComplexity = 'simple' | 'medium' | 'complex';
export type TaskStatus = 'new' | 'in_progress' | 'blocked' | 'done';

// Skill Levels
export type SkillLevel = 'junior' | 'mid' | 'senior';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId: string;
  skillLevel?: SkillLevel;
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

export function normalizeUserRole(role?: string): UserRole {
  const normalized = String(role || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  if (normalized === 'team_leader' || normalized === 'teamleader') return 'team_leader';
  if (normalized === 'admin') return 'admin';
  return 'member';
}

// Skill level matching with task complexity
export function isSkillLevelMatch(skillLevel: SkillLevel | undefined, complexity: TaskComplexity): boolean {
  if (!skillLevel) return true; // Unassigned skill can do any task
  
  const matches: Record<SkillLevel, TaskComplexity[]> = {
    junior: ['simple'],
    mid: ['simple', 'medium'],
    senior: ['simple', 'medium', 'complex'],
  };
  
  return matches[skillLevel].includes(complexity);
}

export function getSkillLevelColor(skillLevel: SkillLevel | undefined): string {
  switch (skillLevel) {
    case 'junior':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'mid':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'senior':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function getSkillLevelBadgeText(skillLevel: SkillLevel | undefined): string {
  switch (skillLevel) {
    case 'junior':
      return '👶 Junior';
    case 'mid':
      return '💼 Mid-level';
    case 'senior':
      return '⭐ Senior';
    default:
      return 'Unknown';
  }
}

export type ComplexityMatchStatus = 'perfect' | 'capable' | 'overqualified' | 'under-skilled';

export function getComplexityMatch(skillLevel: SkillLevel | undefined, complexity: TaskComplexity): ComplexityMatchStatus {
  if (!skillLevel) return 'capable';
  
  const skillRank: Record<SkillLevel, number> = { junior: 1, mid: 2, senior: 3 };
  const complexityRank: Record<TaskComplexity, number> = { simple: 1, medium: 2, complex: 3 };
  
  const skill = skillRank[skillLevel];
  const comp = complexityRank[complexity];
  
  if (skill === comp) return 'perfect';
  if (skill > comp) return 'overqualified';
  if (skill < comp + 1) return 'capable'; // one level above is ok
  return 'under-skilled';
}

export function getMatchColor(matchStatus: ComplexityMatchStatus): string {
  switch (matchStatus) {
    case 'perfect':
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    case 'capable':
      return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    case 'overqualified':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    case 'under-skilled':
      return 'text-red-400 border-red-500/30 bg-red-500/10';
  }
}
