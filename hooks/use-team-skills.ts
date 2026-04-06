import { useEffect, useState } from 'react';
import { SkillLevel } from '@/lib/types';

export function useTeamSkills() {
  const [skills, setSkills] = useState<Record<string, SkillLevel | undefined>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('teamSkills');
      if (saved) {
        setSkills(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load team skills from localStorage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { skills, loading };
}
