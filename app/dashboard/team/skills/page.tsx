import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getTeams, getTeamById } from '@/lib/api';
import { extractArray, getTeamLeaderId, getTeamMembers } from '@/lib/utils';
import { SkillLevel, getSkillLevelBadgeText, getSkillLevelColor } from '@/lib/types';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        const currentTeam = teamsData.find(
          (t: any) => String(getTeamLeaderId(t)) === String(user?.id)
        );

        if (!currentTeam?.id) {
          throw new Error('Team not found');
        }

        // Fetch full team details with member information
        const teamDetailsRes = await getTeamById(String(currentTeam.id));
        const teamDetails = teamDetailsRes?.data || teamDetailsRes || currentTeam;

        // Extract real team members from the backend response
        let members = getTeamMembers(teamDetails);

        if (members.length === 0) {
          throw new Error('No team members found');
        }

        // Ensure consistent member data
        const populatedMembers = members.map((member) => ({
          ...member,
          name: member.name || `Team Member ${String(member.id).substring(0, 5)}`,
          email: member.email || `member-${String(member.id).substring(0, 5)}@company.com`,
          role: member.role || 'member',
          teamId: member.teamId || currentTeam?.id,
        }));

        if (active) {
          setTeamMembers(populatedMembers);
          // Load skills from localStorage
          const savedSkills = localStorage.getItem('teamSkills');
          const skillsMap = savedSkills ? JSON.parse(savedSkills) : {};
          
          populatedMembers.forEach((member: any) => {
            if (!skillsMap[member.id]) {
              skillsMap[member.id] = undefined;
            }
          });
          setSkills(skillsMap);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || 'Unable to load team members.');
        }
      } finally {
        if (active) setLoading(false);
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
      // Store skills in localStorage
      localStorage.setItem('teamSkills', JSON.stringify(skills));
      setSuccess('Skill levels saved successfully to local storage!');
    } catch (err: any) {
      setError(err?.message || 'Failed to save skill levels.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Member Skills</h1>
          <p className="text-muted-foreground">Set skill levels to match tasks with team members</p>
        </div>
      </div>

      {/* Legend */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm">Skill Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded text-sm ${getSkillLevelColor('junior')}`}>
                👶 Junior
              </span>
              <p className="text-sm text-muted-foreground">Simple tasks only</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded text-sm ${getSkillLevelColor('mid')}`}>
                💼 Mid-level
              </span>
              <p className="text-sm text-muted-foreground">Simple + Medium tasks</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded text-sm ${getSkillLevelColor('senior')}`}>
                ⭐ Senior
              </span>
              <p className="text-sm text-muted-foreground">Any complexity</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Select a skill level for each team member</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading team members...</p>
          ) : teamMembers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No team members found</p>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={skills[member.id] || ''}
                      onChange={(e) =>
                        handleSkillChange(
                          member.id,
                          (e.target.value as SkillLevel) || undefined
                        )
                      }
                      className="h-10 px-3 rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Unassigned</option>
                      <option value="junior">👶 Junior</option>
                      <option value="mid">💼 Mid-level</option>
                      <option value="senior">⭐ Senior</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="pt-6">
            <p className="text-emerald-400 text-sm">{success}</p>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Skill Levels'}
        </Button>
      </div>

      {/* Note */}
      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardContent className="pt-6">
          <p className="text-amber-400 text-sm">
            <strong>Note:</strong> This feature uses local storage for now. To persist changes:
            <br />
            1. Create an <code>/api/users/{'{id}'}</code> PUT endpoint to update skill levels
            <br />
            2. Update the <code>handleSave</code> function to call the API
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
