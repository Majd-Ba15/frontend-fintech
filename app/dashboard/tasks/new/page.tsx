'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { useAuth } from '@/lib/auth-context';
import { getTeams, getTasks, createTask, getUserById } from '@/lib/api';
import { extractArray, getTeamLeaderId, getTeamMemberIds, getTeamMembers } from '@/lib/utils';
import { TaskPriority, TaskComplexity, COMPLEXITY_MULTIPLIERS, PRIORITY_MULTIPLIERS, isSkillLevelMatch, getSkillLevelBadgeText, getSkillLevelColor, getComplexityMatch, getMatchColor } from '@/lib/types';
import { useTeamSkills } from '@/hooks/use-team-skills';
import { ArrowLeft, Calculator } from 'lucide-react';

export default function NewTaskPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { skills } = useTeamSkills();
  const [teams, setTeams] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [teamsRes, tasksRes] = await Promise.allSettled([getTeams(), getTasks()]);
        const teamsData = teamsRes.status === 'fulfilled' ? extractArray<any>(teamsRes.value) : [];
        const tasksData = tasksRes.status === 'fulfilled' ? extractArray<any>(tasksRes.value) : [];
        setTeams(teamsData);

        let currentTeam = teamsData.find(
          (t: any) => String(getTeamLeaderId(t)) === String(user.id)
        );

        if (!currentTeam) {
          currentTeam = teamsData.find((t: any) =>
            getTeamMemberIds(t).includes(String(user.id))
          );
        }

        if (!currentTeam) {
          currentTeam = teamsData.find((t: any) =>
            String(t.leader?.email || t.teamLeader?.email || '').toLowerCase() === String(user.email).toLowerCase()
          );
        }

        if (!currentTeam && user.teamId) {
          currentTeam = teamsData.find((t: any) => String(t.id) === String(user.teamId));
        }

        if (!currentTeam) {
          setTeamMembers([]);
          return;
        }

        // Build a task count map for current team members
        const taskCounts = tasksData.reduce((map: Record<string, number>, task: any) => {
          const assignee = String(task.assignedMemberId || task.assignedToId || task.assigned_to || '');
          if (!assignee) return map;
          map[assignee] = (map[assignee] || 0) + 1;
          return map;
        }, {} as Record<string, number>);

        const rawTeamMembers = getTeamMembers(currentTeam);
        const memberIds = Array.from(new Set([
          ...rawTeamMembers.map((member) => String(member.id)),
          ...getTeamMemberIds(currentTeam),
        ].filter(Boolean)));

        const missingMemberIds = memberIds.filter((memberId) =>
          !rawTeamMembers.some((member) => String(member.id) === memberId && member.name)
        );

        const fetchedMemberPromises = missingMemberIds.map(async (memberId) => {
          try {
            const userData = await getUserById(memberId);
            return userData?.data || userData;
          } catch (err) {
            console.warn(`Failed to fetch user data for ${memberId}:`, err);
            return null;
          }
        });

        const fetchedMemberResults = await Promise.all(fetchedMemberPromises);
        const fetchedMembers = fetchedMemberResults
          .filter(Boolean)
          .map((memberData: any) => ({
            id: memberData?.id || memberData?._id || '',
            name: memberData?.name || memberData?.fullName || `Member ${String(memberData?.id).slice(0, 5)}`,
            email: memberData?.email || `${memberData?.name || 'member'}@company.com`,
            role: memberData?.role || 'member',
            teamId: memberData?.teamId || currentTeam.id,
            skillLevel: skills[memberData?.id] || memberData?.skillLevel || undefined,
          }));

        const members = memberIds.map((memberId) => {
          const rawMember = rawTeamMembers.find((member) => String(member.id) === memberId);
          const fetchedMember = fetchedMembers.find((member) => String(member.id) === memberId);
          const merged = {
            id: memberId,
            name:
              rawMember?.name || fetchedMember?.name || `Member ${memberId.slice(0, 5)}`,
            email:
              rawMember?.email || fetchedMember?.email || `member-${memberId.slice(0, 5)}@company.com`,
            role: rawMember?.role || fetchedMember?.role || 'member',
            teamId: rawMember?.teamId || fetchedMember?.teamId || currentTeam.id,
            skillLevel: rawMember?.skillLevel || fetchedMember?.skillLevel || skills[memberId],
            taskCount: taskCounts[memberId] || 0,
          };
          return merged;
        });

        if (active) {
          setTeamMembers(members);
        }
      } catch (err: any) {
        setError(err?.message || 'Unable to load initial task data.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [user, skills]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedMemberId: '',
    priority: 'medium' as TaskPriority,
    complexity: 'medium' as TaskComplexity,
    estimatedEffort: 8,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const calculateWeight = () => {
    return (
      formData.estimatedEffort *
      COMPLEXITY_MULTIPLIERS[formData.complexity] *
      PRIORITY_MULTIPLIERS[formData.priority]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const assignedId = String(formData.assignedMemberId);

      const taskPayload = {
        ...formData,
        createdBy: user?.id,
        assignedToId: assignedId,
        assignedMemberId: assignedId,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
      };

      await createTask(taskPayload);
      navigate('/dashboard/tasks');
    } catch (err: any) {
      setError(err?.message || 'Unable to create task.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Creating task...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Task</h1>
          <p className="text-muted-foreground">Assign a new task to a team member</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Task Details</CardTitle>
                <CardDescription>Enter the task information</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="title">Title</FieldLabel>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter task title"
                      className="bg-secondary border-border"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter task description"
                      className="w-full min-h-[120px] px-3 py-2 rounded-md bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="assignedMemberId">Assign To</FieldLabel>
                    <select
                      id="assignedMemberId"
                      value={formData.assignedMemberId}
                      onChange={(e) =>
                        setFormData({ ...formData, assignedMemberId: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    >
                      <option value="">Select team member</option>
                      {teamMembers.map((member) => {
                        const matchStatus = getComplexityMatch(member.skillLevel, formData.complexity);
                        const isMatch = matchStatus === 'perfect';
                        return (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.email}) — {member.taskCount || 0} tasks {isMatch ? '✓ Perfect Match' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="priority">Priority</FieldLabel>
                      <select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({ ...formData, priority: e.target.value as TaskPriority })
                        }
                        className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="low">Low (x1.0)</option>
                        <option value="medium">Medium (x1.2)</option>
                        <option value="high">High (x1.5)</option>
                        <option value="critical">Critical (x2.0)</option>
                      </select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="complexity">Complexity</FieldLabel>
                      <select
                        id="complexity"
                        value={formData.complexity}
                        onChange={(e) =>
                          setFormData({ ...formData, complexity: e.target.value as TaskComplexity })
                        }
                        className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="simple">Simple (x1.0)</option>
                        <option value="medium">Medium (x1.5)</option>
                        <option value="complex">Complex (x2.0)</option>
                      </select>
                    </Field>
                  </div>

                  {/* Team Member Recommendations */}
                  <div>
                    <FieldLabel>Recommended Team Members for {formData.complexity} complexity</FieldLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {teamMembers.map((member) => {
                        const matchStatus = getComplexityMatch(member.skillLevel, formData.complexity);
                        const isSelected = formData.assignedMemberId === member.id;
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, assignedMemberId: member.id })}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/10' 
                                : `border-border ${getMatchColor(matchStatus)}`
                            }`}
                          >
                            <div className="text-left">
                              <p className="font-medium text-foreground text-sm">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded inline-block mt-2 ${getSkillLevelColor(member.skillLevel)}`}>
                                {getSkillLevelBadgeText(member.skillLevel)}
                              </span>
                              <p className="text-xs text-muted-foreground mt-2">
                                {member.taskCount || 0} assigned task{member.taskCount === 1 ? '' : 's'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 capitalize">
                                {matchStatus === 'perfect' && '✓ Perfect Match'}
                                {matchStatus === 'capable' && '→ Capable'}
                                {matchStatus === 'overqualified' && '↑ Overqualified'}
                                {matchStatus === 'under-skilled' && '⚠ Under-skilled'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="estimatedEffort">Estimated Effort (hours)</FieldLabel>
                    <Input
                      id="estimatedEffort"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.estimatedEffort}
                      onChange={(e) =>
                        setFormData({ ...formData, estimatedEffort: parseInt(e.target.value) || 0 })
                      }
                      className="bg-secondary border-border"
                      required
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="bg-secondary border-border"
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="dueDate">Due Date</FieldLabel>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="bg-secondary border-border"
                        required
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weight Preview */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Weight Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <p className="text-3xl font-bold text-primary">{calculateWeight().toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Calculated Weight</p>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Effort</span>
                    <span className="text-foreground">{formData.estimatedEffort}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Complexity</span>
                    <span className="text-foreground">
                      x{COMPLEXITY_MULTIPLIERS[formData.complexity]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority</span>
                    <span className="text-foreground">
                      x{PRIORITY_MULTIPLIERS[formData.priority]}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <Button type="submit" className="w-full">
                  Create Task
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
