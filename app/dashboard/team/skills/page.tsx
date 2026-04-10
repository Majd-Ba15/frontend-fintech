import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { getTeamById, getTeams, getUserById } from '@/lib/api';
import { loadTeamSkills, saveTeamSkills } from '@/lib/team-skills-storage';
import { SkillLevel, getSkillLevelBadgeText, getSkillLevelColor } from '@/lib/types';
import { extractArray, getTeamLeaderId, getTeamMemberIds, getTeamMembers } from '@/lib/utils';

export default function TeamSkillsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [skills, setSkills] = useState<Record<string, SkillLevel | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function loadTeamMembers() {
      setLoading(true);
      setError(null);

      try {
        const teamsRes = await getTeams();
        const teamsData = extractArray<any>(teamsRes);
        let currentTeam = teamsData.find(
          (team: any) => String(getTeamLeaderId(team)) === String(user.id)
        );

        if (!currentTeam) {
          currentTeam = teamsData.find((team: any) =>
            getTeamMemberIds(team).includes(String(user.id))
          );
        }

        if (!currentTeam && user.email) {
          currentTeam = teamsData.find((team: any) => {
            const leaderEmail = String(
              team?.leader?.email ?? team?.teamLeader?.email ?? getTeamLeaderId(team) ?? ''
            ).toLowerCase();
            return leaderEmail === String(user.email).toLowerCase();
          });
        }

        if (!currentTeam && user.teamId) {
          currentTeam = teamsData.find((team: any) => String(team.id) === String(user.teamId));
        }

        if (!currentTeam?.id) {
          throw new Error('Team not found');
        }

        const teamDetailsRes = await getTeamById(String(currentTeam.id));
        const teamDetails = teamDetailsRes?.data || teamDetailsRes || currentTeam;
        const members = getTeamMembers(teamDetails);
        const memberIds = Array.from(
          new Set([
            ...members.map((member) => String(member.id)),
            ...getTeamMemberIds(teamDetails),
          ].filter(Boolean))
        );

        const missingIds = memberIds.filter(
          (memberId) => !members.some((member) => String(member.id) === memberId)
        );

        const fetchedMembers = await Promise.allSettled(
          missingIds.map(async (memberId) => {
            try {
              const userData = await getUserById(memberId);
              return Array.isArray(userData) ? userData[0] : userData?.data || userData;
            } catch {
              return null;
            }
          })
        );

        const resolvedMembers = fetchedMembers
          .filter(
            (result): result is PromiseFulfilledResult<any> =>
              result.status === 'fulfilled' && !!result.value
          )
          .map((result) => result.value);

        const populatedMembers = memberIds.map((memberId) => {
          const existing = members.find((member) => String(member.id) === memberId);
          const fetched = resolvedMembers.find((member) => String(member.id) === memberId);

          return {
            id: memberId,
            name:
              existing?.name ||
              fetched?.name ||
              fetched?.fullName ||
              `Team Member ${String(memberId).slice(0, 5)}`,
            email:
              existing?.email ||
              fetched?.email ||
              `member-${String(memberId).slice(0, 5)}@company.com`,
            role: existing?.role || fetched?.role || 'member',
            teamId: existing?.teamId || fetched?.teamId || currentTeam.id,
          };
        });

        if (populatedMembers.length === 0) {
          throw new Error('No team members found');
        }

        if (!active) return;

        const storedSkills = loadTeamSkills();
        const skillsMap = { ...storedSkills };

        populatedMembers.forEach((member: any) => {
          if (!(member.id in skillsMap)) {
            skillsMap[member.id] = undefined;
          }
        });

        setTeamMembers(populatedMembers);
        setSkills(skillsMap);
      } catch (err: any) {
        if (active) {
          setError(err?.message || 'Unable to load team members.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTeamMembers();
    return () => {
      active = false;
    };
  }, [user]);

  const handleSkillChange = (memberId: string, level: SkillLevel | undefined) => {
    setSkills((prev) => ({ ...prev, [memberId]: level }));
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      saveTeamSkills(skills);
      setSuccess('Skill levels saved successfully to local storage.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save skill levels.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Member Skills</h1>
          <p className="text-muted-foreground">Set skill levels to match tasks with team members</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm">Skill Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <span className={`rounded px-3 py-1 text-sm ${getSkillLevelColor('junior')}`}>
                {getSkillLevelBadgeText('junior')}
              </span>
              <p className="text-sm text-muted-foreground">Simple tasks only</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded px-3 py-1 text-sm ${getSkillLevelColor('mid')}`}>
                {getSkillLevelBadgeText('mid')}
              </span>
              <p className="text-sm text-muted-foreground">Simple + medium tasks</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded px-3 py-1 text-sm ${getSkillLevelColor('senior')}`}>
                {getSkillLevelBadgeText('senior')}
              </span>
              <p className="text-sm text-muted-foreground">Any complexity</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Select a skill level for each team member</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">Loading team members...</p>
          ) : teamMembers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No team members found</p>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
                >
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={skills[member.id] || ''}
                      onChange={(event) =>
                        handleSkillChange(
                          member.id,
                          (event.target.value as SkillLevel) || undefined
                        )
                      }
                      className="h-10 rounded-md border border-border bg-secondary px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Unassigned</option>
                      <option value="junior">{getSkillLevelBadgeText('junior')}</option>
                      <option value="mid">{getSkillLevelBadgeText('mid')}</option>
                      <option value="senior">{getSkillLevelBadgeText('senior')}</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="pt-6">
            <p className="text-sm text-emerald-400">{success}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Skill Levels'}
        </Button>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-400">
            <strong>Note:</strong> This page stores skills in local storage for now, so no
            backend skills API is required.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
