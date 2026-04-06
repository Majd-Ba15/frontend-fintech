'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { useAuth } from '@/lib/auth-context';
import { getMyTasks, getTeams, getTeamById, getUserById, createChangeRequest } from '@/lib/api';
import { getTeamLeaderId, getTeamMemberIds, getTeamMembers } from '@/lib/utils';
import { ChangeRequestType } from '@/lib/types';
import { ArrowLeft, FileText, Calendar, User, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [team, setTeam] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState('');
  const [requestType, setRequestType] = useState<ChangeRequestType>('owner_change');

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [tasksRes, teamsRes] = await Promise.allSettled([getMyTasks(), getTeams()]);

        if (!active) return;

        const tasksData = tasksRes.status === 'fulfilled' ? (Array.isArray(tasksRes.value) ? tasksRes.value : tasksRes.value?.data || []) : [];
        const teamsData = teamsRes.status === 'fulfilled' ? (Array.isArray(teamsRes.value) ? teamsRes.value : teamsRes.value?.data || []) : [];

        setTasks(tasksData);

        let currentTeam = teamsData.find((t: any) => String(getTeamLeaderId(t)) === String(user?.id));

        if (!currentTeam) {
          currentTeam = teamsData.find((t: any) => getTeamMemberIds(t).includes(String(user?.id)));
        }

        if (!currentTeam && user?.email) {
          currentTeam = teamsData.find(
            (t: any) =>
              String(t.leader?.email || t.teamLeader?.email || '').toLowerCase() ===
              String(user.email).toLowerCase()
          );
        }

        if (!currentTeam && user?.teamId) {
          currentTeam = teamsData.find((t: any) => String(t.id) === String(user.teamId));
        }

        if (!currentTeam) {
          setTeam(null);
          setTeamMembers([]);
          return;
        }

        let teamDetails: any = currentTeam;

        if (user?.role === 'admin' || user?.role === 'team_leader') {
          try {
            const teamDetailsRes = await getTeamById(String(currentTeam.id));
            teamDetails = Array.isArray(teamDetailsRes)
              ? teamDetailsRes[0]
              : teamDetailsRes?.data || teamDetailsRes || currentTeam;
          } catch (err) {
            // Fallback when the backend denies direct team detail access for this user
            teamDetails = currentTeam;
          }
        }

        setTeam(teamDetails);

        let members = getTeamMembers(teamDetails);
        const memberIds = Array.from(
          new Set([
            ...members.map((member) => String(member.id)),
            ...getTeamMemberIds(teamDetails),
          ].filter(Boolean))
        );

        const missingIds = memberIds.filter((id) => !members.some((member) => String(member.id) === id));
        let fetchedMembers: any[] = [];

        const canFetchUsers = user?.role === 'admin' || user?.role === 'team_leader';
        if (canFetchUsers && missingIds.length > 0) {
          const missingMembers = await Promise.allSettled(
            missingIds.map(async (memberId) => {
              try {
                const userData = await getUserById(memberId);
                return Array.isArray(userData) ? userData[0] : userData?.data || userData;
              } catch (err) {
                return null;
              }
            })
          );

          fetchedMembers = missingMembers
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && !!result.value)
            .map((result) => result.value);
        }

        const finalMembers = memberIds.map((memberId) => {
          const existing = members.find((member) => String(member.id) === memberId);
          const fetched = fetchedMembers.find((member) => String(member.id) === memberId);
          return {
            id: memberId,
            name: existing?.name || fetched?.name || fetched?.fullName || `Member ${memberId.slice(0, 5)}`,
            email: existing?.email || fetched?.email || `${existing?.name || 'member'}@company.com`,
            role: existing?.role || fetched?.role || 'member',
            teamId: existing?.teamId || fetched?.teamId || String(teamDetails.id),
          };
        });

        if (active) {
          setTeamMembers(finalMembers);
        }
      } catch (err: any) {
        setError(err?.message || 'Unable to load request form data.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [user]);

  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTaskData = tasks.find((t) => t.id === selectedTask);
  const selectedAssignee = teamMembers.find((u) => String(u.id) === String(selectedTaskData?.assignedMemberId));
  const selectedTaskTeamLeader =
    teamMembers.find(
      (u) =>
        u.role === 'team_leader' &&
        String(u.teamId) === String(selectedAssignee?.teamId)
    ) ||
    (team?.leaderId
      ? {
          id: String(team.leaderId),
          name:
            String(team.leader?.name || team.leader?.fullName || team.leader?.email || 'Team Leader'),
        }
      : undefined);

  // Get tasks assigned to current user
  const myTasks = tasks.filter((t) => String(t.assignedMemberId) === String(user?.id));
  const ownerChangeCandidates = teamMembers.filter(
    (candidate) =>
      candidate.role === 'member' &&
      String(candidate.id) !== String(user?.id) &&
      (!selectedAssignee?.teamId || String(candidate.teamId) === String(selectedAssignee.teamId))
  );

  const requestTypes: { value: ChangeRequestType; label: string; description: string; icon: typeof User }[] = [
    {
      value: 'owner_change',
      label: 'Owner Change',
      description: 'Request to transfer this task to another team member',
      icon: User,
    },
    {
      value: 'due_date_change',
      label: 'Due Date Change',
      description: 'Request to extend the deadline for this task',
      icon: Calendar,
    },
    {
      value: 'effort_increase',
      label: 'Effort Increase',
      description: 'Request to update the estimated effort hours',
      icon: TrendingUp,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!user) throw new Error('User not authenticated');
      if (!selectedTaskData) throw new Error('Please select a task first.');
      if (!newValue.trim()) throw new Error('Please enter the requested value.');
      if (requestType === 'owner_change' && ownerChangeCandidates.length === 0) {
        throw new Error('No other team members are available for owner change.');
      }
      if (requestType === 'owner_change' && String(newValue) === String(selectedTaskData.assignedMemberId)) {
        throw new Error('Please choose a different owner.');
      }
      if (requestType === 'effort_increase' && (!Number.isFinite(Number(newValue)) || Number(newValue) <= 0)) {
        throw new Error('Please enter a valid effort estimate.');
      }

      const normalizedNewValue =
        requestType === 'effort_increase' ? String(Number(newValue)) : newValue.trim();

      await createChangeRequest({
        taskId: selectedTask,
        requestType,
        requestedValue: normalizedNewValue,
        reason,
      });
      navigate('/dashboard/requests');
    } catch (err: any) {
      setError(err?.message || 'Unable to submit request.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading request form...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Change Request</h1>
          <p className="text-muted-foreground">Submit a request for task modifications</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Request Details
              </CardTitle>
              <CardDescription>Fill in the details for your change request</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                {/* Task Selection */}
                <Field>
                  <FieldLabel htmlFor="task">Select Task</FieldLabel>
                  <select
                    id="task"
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-md border border-border bg-secondary text-foreground"
                  >
                    <option value="">Choose a task...</option>
                    {myTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Request Type */}
                <Field>
                  <FieldLabel>Request Type</FieldLabel>
                  <div className="grid gap-2 mt-2">
                    {requestTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            setRequestType(type.value);
                            setNewValue('');
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                            requestType === type.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-secondary/50 hover:bg-secondary'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              requestType === type.value ? 'bg-primary/20' : 'bg-muted'
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                requestType === type.value ? 'text-primary' : 'text-muted-foreground'
                              }`}
                            />
                          </div>
                          <div>
                            <p
                              className={`font-medium ${
                                requestType === type.value ? 'text-primary' : 'text-foreground'
                              }`}
                            >
                              {type.label}
                            </p>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* New Value Input */}
                <Field>
                  <FieldLabel htmlFor="newValue">
                    {requestType === 'owner_change'
                      ? 'New Owner'
                      : requestType === 'due_date_change'
                      ? 'New Due Date'
                      : 'New Effort (hours)'}
                  </FieldLabel>
                  {requestType === 'owner_change' ? (
                    <>
                      {selectedTaskTeamLeader && (
                        <div className="mb-3 text-sm text-muted-foreground">
                          Assigned Team Leader: <span className="font-medium text-foreground">{selectedTaskTeamLeader.name}</span>
                        </div>
                      )}
                      <select
                        id="newValue"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        required
                        disabled={ownerChangeCandidates.length === 0}
                        className="w-full h-10 px-3 rounded-md border border-border bg-secondary text-foreground"
                      >
                        <option value="">
                          {ownerChangeCandidates.length === 0 ? 'No available team members' : 'Select new owner...'}
                        </option>
                        {ownerChangeCandidates.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                      </select>
                      {ownerChangeCandidates.length === 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Owner change is unavailable until another team member is visible in your team.
                        </p>
                      )}
                    </>
                  ) : requestType === 'due_date_change' ? (
                    <Input
                      id="newValue"
                      type="date"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      required
                      className="bg-secondary border-border"
                    />
                  ) : (
                    <Input
                      id="newValue"
                      type="number"
                      min="1"
                      placeholder="Enter new effort in hours"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      required
                      className="bg-secondary border-border"
                    />
                  )}
                </Field>

                {/* Reason */}
                <Field>
                  <FieldLabel htmlFor="reason">Reason for Request</FieldLabel>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="Please explain why this change is needed..."
                    className="w-full px-3 py-2 rounded-md border border-border bg-secondary text-foreground resize-none"
                  />
                </Field>
              </FieldGroup>

              <div className="flex gap-3 mt-6">
                <Button type="submit" disabled={isSubmitting || !selectedTask}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Link to="/dashboard/requests">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Task Preview */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Task Preview</CardTitle>
              <CardDescription>Current task information</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTaskData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Task Title</p>
                    <p className="font-medium text-foreground">{selectedTaskData.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm text-foreground">{selectedTaskData.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Owner</p>
                      <p className="font-medium text-foreground">
                        {teamMembers.find((u) => String(u.id) === String(selectedTaskData.assignedMemberId))?.name || selectedTaskData.assignedMemberId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium text-foreground">
                        {new Date(selectedTaskData.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Effort</p>
                      <p className="font-medium text-foreground">
                        {selectedTaskData.estimatedEffort} hours
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium text-foreground capitalize">
                        {selectedTaskData.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a task to see details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
