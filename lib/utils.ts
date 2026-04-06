import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTeamLeaderId(team: any): string {
  if (!team || typeof team !== 'object') return '';
  return String(
    team.leaderId ??
    team.teamLeaderId ??
    team.leader?.id ??
    team.teamLeader?.id ??
    team.leader?.email ??
    team.teamLeader?.email ??
    team.leader ??
    team.teamLeader ??
    ''
  ).trim();
}

export function getTeamMemberIds(team: any): string[] {
  if (!team || typeof team !== 'object') return [];
  const rawMemberIds =
    team.memberIds ??
    team.members ??
    team.teamMembers ??
    team.users ??
    team.membersList ??
    [];
  if (!Array.isArray(rawMemberIds)) return [];

  return rawMemberIds
    .map((item: any) =>
      String(item?.id ?? item?.userId ?? item?._id ?? item ?? '').trim()
    )
    .filter(Boolean);
}

export function getTeamMembers(team: any): Array<{ id: string; name?: string; email?: string; role?: string; teamId?: string }> {
  if (!team || typeof team !== 'object') return [];
  let rawMembers: any =
    team.members ??
    team.teamMembers ??
    team.users ??
    team.membersList ??
    team.memberIds ??
    [];

  if (!Array.isArray(rawMembers)) {
    if (typeof rawMembers === 'object' && rawMembers !== null) {
      rawMembers = Object.values(rawMembers);
    } else {
      return [];
    }
  }

  return rawMembers
    .map((item: any) => {
      if (item && typeof item === 'object') {
        const id = String(item.id ?? item.userId ?? item._id ?? item.value ?? item ?? '').trim();
        if (!id) return null;

        return {
          id,
          name:
            (typeof item.name === 'string' && item.name.trim()) ||
            (typeof item.fullName === 'string' && item.fullName.trim()) ||
            (typeof item.full_name === 'string' && item.full_name.trim()) ||
            (typeof item.username === 'string' && item.username.trim()) ||
            undefined,
          email:
            (typeof item.email === 'string' && item.email.trim()) ||
            (typeof item.userEmail === 'string' && item.userEmail.trim()) ||
            undefined,
          role: item.role || item.userRole || undefined,
          teamId: String(item.teamId ?? team.id ?? team._id ?? '').trim() || undefined,
        };
      }

      const id = String(item ?? '').trim();
      if (!id) return null;
      return { id, name: undefined, email: undefined, role: undefined, teamId: String(team.id ?? team._id ?? '').trim() || undefined };
    })
    .filter(Boolean) as Array<{ id: string; name?: string; email?: string; role?: string; teamId?: string }>;
}

export async function resolveByIds<T>(
  ids: string[],
  fetchById: (id: string) => Promise<T>
): Promise<T[]> {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const results = await Promise.allSettled(ids.map((id) => fetchById(id)));
  return results
    .filter((result): result is PromiseFulfilledResult<T> => result.status === 'fulfilled' && !!result.value)
    .map((result) => result.value);
}

export function extractArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const candidateKeys = ['data', 'items', 'results', 'teams', 'users', 'tasks'];
  for (const key of candidateKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  if (payload.data && typeof payload.data === 'object') {
    return extractArray<T>(payload.data);
  }

  return [];
}
