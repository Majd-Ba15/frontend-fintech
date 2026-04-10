import { SkillLevel } from '@/lib/types';

export const TEAM_SKILLS_STORAGE_KEY = 'teamSkills';

export type TeamSkillsMap = Record<string, SkillLevel | undefined>;

function isSkillLevel(value: unknown): value is SkillLevel {
  return value === 'junior' || value === 'mid' || value === 'senior';
}

export function loadTeamSkills(): TeamSkillsMap {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const saved = window.localStorage.getItem(TEAM_SKILLS_STORAGE_KEY);
    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([memberId, level]) => [
        memberId,
        isSkillLevel(level) ? level : undefined,
      ])
    );
  } catch (error) {
    console.error('Failed to load team skills from localStorage:', error);
    return {};
  }
}

export function saveTeamSkills(skills: TeamSkillsMap) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedSkills = Object.fromEntries(
    Object.entries(skills).map(([memberId, level]) => [
      memberId,
      isSkillLevel(level) ? level : undefined,
    ])
  );

  window.localStorage.setItem(
    TEAM_SKILLS_STORAGE_KEY,
    JSON.stringify(normalizedSkills)
  );
}
