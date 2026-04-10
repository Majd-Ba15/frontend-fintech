import { useEffect, useState } from 'react';
import { SkillLevel } from '@/lib/types';
import { loadTeamSkills } from '@/lib/team-skills-storage';

export function useTeamSkills() {
  const [skills, setSkills] = useState<Record<string, SkillLevel | undefined>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setSkills(loadTeamSkills());
    } finally {
      setLoading(false);
    }
  }, []);

  return { skills, loading };
}
