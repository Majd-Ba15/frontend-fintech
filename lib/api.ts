import { normalizeUserRole } from './types';

const RAW_API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').trim();

function parseApiBase(raw: string) {
  let base = raw.replace(/\/+$/, '');

  // Convert invalid forms to usable host-based URL
  if (/^:\d+/.test(base)) {
    base = `http://localhost${base}`; // :5001/api -> http://localhost:5001/api
  }

  if (/^[^:\/]+:\d+/.test(base) && !/^https?:\/\//i.test(base)) {
    base = `http://${base}`; // localhost:5001/api -> http://localhost:5001/api
  }

  if (!/^https?:\/\//i.test(base)) {
    base = `http://${base}`; // try adding protocol
  }

  try {
    const parsed = new URL(base);
    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
  } catch (err) {
    throw new Error(`Invalid VITE_API_BASE value: ${raw}. Should be an absolute URL such as http://localhost:5001/api`);
  }
}

const API_BASE = parseApiBase(RAW_API_BASE);

if (typeof window !== 'undefined') {
  console.debug('[api] Parsed API_BASE =', API_BASE);
}

let jwtToken: string | null = null;

export function setToken(token: string | null) {
  jwtToken = token;
}

function normalizeApiUrl(url: string) {
  if (!url) {
    throw new Error('API URL is empty. Set VITE_API_BASE in .env to http://localhost:5001/api or your backend URL.');
  }

  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`API_BASE must be an absolute URL including protocol, e.g. https://localhost:5001/api. Got: ${url}`);
  }

  return url.replace(/\/+$/, '');
}

function getHeaders(contentType = 'application/json') {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (contentType) headers['Content-Type'] = contentType;
  if (jwtToken) headers.Authorization = `Bearer ${jwtToken}`;
  return headers;
}

function tryParseJson(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const base = normalizeApiUrl(API_BASE);
  const fullUrl = `${base}${url.startsWith('/') ? '' : '/'}${url}`;

  const defaultHeaders = getHeaders(
    options.headers && (options.headers as Record<string, string>)['Content-Type']
      ? (options.headers as Record<string, string>)['Content-Type']
      : 'application/json'
  );

  console.debug('[api] request', { fullUrl, method: options.method || 'GET', headers: defaultHeaders });

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  const text = await res.text();
  const data = tryParseJson(text);

  if (!res.ok) {
    // Prefer API friendly message by JSON payload, fallback to status text
    const bodyMessage = data && (data as any).message ? (data as any).message : null;
    const message =
      bodyMessage ||
      res.statusText ||
      `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(message) as any;
    err.status = res.status;
    err.body = data;
    throw err;
  }

  // Some endpoints may return no body (204)
  return (text ? (data as T) : (null as unknown as T));
}

// Auth
export type LoginDto = { email: string; password: string; role?: string };
export type RegisterDto = { fullName: string; email: string; password: string; confirmPassword: string };
export type ForgotPasswordDto = { email: string };
export type VerifyCodeDto = { email: string; code: string };
export type ResetPasswordDto = { email: string; code: string; newPassword: string; confirmPassword: string };

export async function register(dto: RegisterDto) {
  return request<any>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function login(dto: LoginDto) {
  const body: any = { email: dto.email, password: dto.password };
  if (dto.role) {
    body.role = dto.role;
  }

  return request<{ data: { token: string; user: any } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function forgotPassword(dto: ForgotPasswordDto) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function verifyCode(dto: VerifyCodeDto) {
  return request('/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function resetPassword(dto: ResetPasswordDto) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// Users
export async function getUsers(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await request<any>(`/users${query ? `?${query}` : ''}`);
  return normalizeResponseData(response);
}

export async function getUserById(id: string) {
  const response = await request<any>(`/users/${id}`);
  return normalizeResponseData(response);
}

export async function createUser(dto: any) {
  return request('/users', { method: 'POST', body: JSON.stringify(dto) });
}

export async function updateUserById(id: string, dto: any) {
  return request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export async function deleteUserById(id: string) {
  return request(`/users/${id}`, { method: 'DELETE' });
}

export async function getUserStats() {
  return request<any>('/users/stats');
}

export async function getCurrentUser() {
  const response = await request<any>('/users/me');
  return normalizeResponseData(response);
}

// Teams
export async function getTeams() {
  const response = await request<any>('/teams');
  return normalizeResponseData(response);
}

export async function getTeamById(id: string) {
  const response = await request<any>(`/teams/${id}`);
  return normalizeResponseData(response);
}

export async function createTeam(dto: any) {
  return request('/teams', { method: 'POST', body: JSON.stringify(dto) });
}

export async function updateTeam(id: string, dto: any) {
  return request(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export async function deleteTeam(id: string) {
  return request(`/teams/${id}`, { method: 'DELETE' });
}

function normalizeUserObject(user: any) {
  if (!user || typeof user !== 'object') return user;

  const teamId =
    user.teamId ??
    user.team?.id ??
    user.team?._id ??
    user.team?.teamId ??
    user.team?.team_id ??
    '';

  return {
    ...user,
    id: String(user.id ?? user._id ?? user.userId ?? ''),
    name: String(user.name ?? user.fullName ?? user.full_name ?? ''),
    email: String(user.email ?? ''),
    role: normalizeUserRole(user.role),
    teamId: String(teamId),
  };
}

function normalizeTeamObject(team: any) {
  if (!team || typeof team !== 'object') return team;

  const rawMembers =
    Array.isArray(team.members)
      ? team.members
      : Array.isArray(team.teamMembers)
      ? team.teamMembers
      : Array.isArray(team.users)
      ? team.users
      : Array.isArray(team.memberIds)
      ? team.memberIds
      : Array.isArray(team.membersList)
      ? team.membersList
      : [];

  const memberIds = rawMembers
    .map((member: any) => String(member?.id ?? member?.userId ?? member?._id ?? member ?? '').trim())
    .filter(Boolean);

  return {
    ...team,
    id: String(team.id ?? team._id ?? team.teamId ?? ''),
    leaderId: String(
      team.leaderId ??
        team.teamLeaderId ??
        team.leader?.id ??
        team.teamLeader ??
        team.leader ??
        ''
    ),
    memberIds,
    members: Array.isArray(team.members) ? team.members : undefined,
    teamMembers: Array.isArray(team.teamMembers) ? team.teamMembers : undefined,
    users: Array.isArray(team.users) ? team.users : undefined,
    membersList: Array.isArray(team.membersList) ? team.membersList : undefined,
  };
}

function normalizeTaskObject(task: any) {
  if (!task || typeof task !== 'object') return task;
  const assignedToId = task.assignedToId ?? task.assignedMemberId ?? task.assigned_to_id ?? task.assigned_to;
  const rawStatus = String(task.status ?? task.taskStatus ?? 'new')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  const normalizedStatus =
    rawStatus === 'inprogress'
      ? 'in_progress'
      : rawStatus === 'completed'
      ? 'done'
      : rawStatus === 'blocked'
      ? 'blocked'
      : rawStatus === 'done'
      ? 'done'
      : rawStatus === 'in_progress'
      ? 'in_progress'
      : 'new';

  return {
    ...task,
    id: String(task.id ?? task.taskId ?? ''),
    status: normalizedStatus,
    acknowledged: Boolean(task.acknowledged ?? task.isAcknowledged ?? task.seen ?? false),
    acknowledgedAt: task.acknowledgedAt ?? task.acknowledged_at ?? task.seenAt,
    assignedToId: assignedToId !== undefined ? String(assignedToId) : undefined,
    assignedMemberId: assignedToId !== undefined ? String(assignedToId) : String(task.assignedMemberId ?? ''),
  };
}

function normalizeChangeRequestObject(request: any) {
  if (!request || typeof request !== 'object') return request;

  return {
    ...request,
    id: String(request.id ?? request.changeRequestId ?? ''),
    taskId: String(request.taskId ?? request.task?.id ?? ''),
    taskTitle: request.taskTitle ?? request.task?.title ?? '',
    requestedBy: String(request.requestedBy ?? request.requestedById ?? ''),
    requestedById: String(request.requestedById ?? request.requestedBy ?? ''),
    requestedByName: request.requestedByName ?? request.requestedByUser?.fullName ?? request.requestedByUser?.name ?? '',
    type: String(request.type ?? request.requestType ?? '').trim(),
    requestType: String(request.requestType ?? request.type ?? '').trim(),
    oldValue: String(request.oldValue ?? request.currentValue ?? ''),
    currentValue: String(request.currentValue ?? request.oldValue ?? ''),
    newValue: String(request.newValue ?? request.requestedValue ?? ''),
    requestedValue: String(request.requestedValue ?? request.newValue ?? ''),
    reviewedBy: request.reviewedBy ? String(request.reviewedBy) : '',
    reviewedById: request.reviewedById ? String(request.reviewedById) : '',
    reviewedByName: request.reviewedByName ?? '',
    status: String(request.status ?? 'pending').trim().toLowerCase(),
  };
}

function normalizeResponseData(data: any): any {
  if (Array.isArray(data)) return data.map(normalizeResponseData);
  if (data && typeof data === 'object') {
    if (
      'requestType' in data ||
      'requestedValue' in data ||
      'currentValue' in data ||
      'requestedById' in data
    ) {
      return normalizeChangeRequestObject(data);
    }
    if ('assignedToId' in data || 'assignedMemberId' in data || 'assigned_to_id' in data || 'assigned_to' in data) {
      return normalizeTaskObject(data);
    }
    if ('email' in data && ('role' in data || 'teamId' in data || data.team)) {
      return normalizeUserObject(data);
    }
    if ('leaderId' in data || 'teamLeaderId' in data || 'memberIds' in data || 'members' in data) {
      return normalizeTeamObject(data);
    }
    if (data.data) {
      return { ...data, data: normalizeResponseData(data.data) };
    }
  }
  return data;
}

// Tasks
export async function getTasks() {
  const response = await request<any>('/tasks');
  return normalizeResponseData(response);
}

export async function getMyTasks() {
  const response = await request<any>('/tasks/my');
  return normalizeResponseData(response);
}

export async function getTaskById(id: string) {
  const response = await request<any>(`/tasks/${id}`);
  return normalizeResponseData(response);
}

export async function createTask(dto: any) {
  return request('/tasks', { method: 'POST', body: JSON.stringify(dto) });
}

export async function updateTask(id: string, dto: any) {
  return request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export async function updateTaskStatus(id: string, status: string) {
  const payloads = [
    { status },
    { taskStatus: status },
  ];

  const attempts = [
    { url: `/tasks/${id}/status`, method: 'PATCH' as const },
    { url: `/tasks/${id}`, method: 'PATCH' as const },
    { url: `/tasks/${id}`, method: 'PUT' as const },
  ];

  let lastError: any;
  for (const attempt of attempts) {
    for (const payload of payloads) {
      try {
        return await request(attempt.url, {
          method: attempt.method,
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        lastError = err;
        if (![400, 404, 405].includes(err?.status)) {
          throw err;
        }
      }
    }
  }

  throw lastError;
}

export async function acknowledgeTask(id: string) {
  const attempts = [
    {
      url: `/tasks/${id}/acknowledge`,
      method: 'PATCH' as const,
      body: undefined,
    },
    {
      url: `/tasks/${id}/acknowledge`,
      method: 'PATCH' as const,
      body: JSON.stringify({ acknowledged: true }),
    },
    {
      url: `/tasks/${id}`,
      method: 'PATCH' as const,
      body: JSON.stringify({ acknowledged: true }),
    },
    {
      url: `/tasks/${id}`,
      method: 'PUT' as const,
      body: JSON.stringify({ acknowledged: true }),
    },
  ];

  let lastError: any;
  for (const attempt of attempts) {
    try {
      return await request(attempt.url, {
        method: attempt.method,
        body: attempt.body,
      });
    } catch (err: any) {
      lastError = err;
      if (![400, 404, 405].includes(err?.status)) {
        throw err;
      }
    }
  }

  throw lastError;
}

export async function deleteTask(id: string) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}

export async function weightPreview(priority: string, complexity: string, effort: number) {
  return request(`/tasks/weight-preview?priority=${encodeURIComponent(priority)}&complexity=${encodeURIComponent(complexity)}&effort=${effort}`);
}

// Change requests
export async function getChangeRequests() {
  const response = await request<any>('/change-requests');
  return normalizeResponseData(response);
}

export async function getMyChangeRequests() {
  const response = await request<any>('/change-requests/my');
  return normalizeResponseData(response);
}

export async function createChangeRequest(dto: any) {
  const normalizedDto = {
    taskId: String(dto?.taskId ?? ''),
    requestType: String(dto?.requestType ?? dto?.type ?? '').trim(),
    oldValue: String(dto?.oldValue ?? '').trim(),
    requestedValue: String(dto?.requestedValue ?? dto?.newValue ?? '').trim(),
    reason: String(dto?.reason ?? '').trim(),
  };

  const payloads = [
    {
      taskId: Number(normalizedDto.taskId),
      requestType: normalizedDto.requestType,
      requestedValue: normalizedDto.requestedValue,
      reason: normalizedDto.reason,
    },
    {
      taskId: normalizedDto.taskId,
      requestType: normalizedDto.requestType,
      requestedValue: normalizedDto.requestedValue,
      reason: normalizedDto.reason,
    },
  ];

  let lastError: any;
  for (const payload of payloads) {
    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined && value !== '')
    );

    try {
      return await request('/change-requests', {
        method: 'POST',
        body: JSON.stringify(cleanedPayload),
      });
    } catch (err: any) {
      lastError = err;
      if (err?.status !== 400) {
        throw err;
      }
    }
  }

  throw lastError;
}

export async function reviewChangeRequest(id: string, decision: string) {
  return request(`/change-requests/${id}/review`, { method: 'PATCH', body: JSON.stringify({ decision }) });
}

// Dashboard
export async function getDashboard(weekStart?: string) {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
  return request<any>(`/dashboard${query}`);
}

export async function getDashboardAdmin() {
  return request<any>('/dashboard/admin');
}

export async function getDashboardTeamLeader(weekStart?: string) {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
  return request<any>(`/dashboard/team-leader${query}`);
}

export async function getDashboardMember() {
  return request<any>('/dashboard/member');
}

// Settings
export async function getSettings() {
  return request<any>('/settings');
}

export async function updateSettings(dto: any) {
  return request('/settings', { method: 'PUT', body: JSON.stringify(dto) });
}

export async function resetSettings() {
  return request('/settings/reset', { method: 'POST' });
}
