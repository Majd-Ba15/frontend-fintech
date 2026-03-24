'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { mockUsers } from '@/lib/mock-data';
import { ArrowLeft, Users, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewTeamPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedLeader, setSelectedLeader] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const teamLeaders = mockUsers.filter((u) => u.role === 'team_leader');
  const members = mockUsers.filter((u) => u.role === 'member');

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log('New Team:', {
      name,
      leaderId: selectedLeader,
      memberIds: selectedMembers,
    });

    setIsSubmitting(false);
    navigate('/dashboard/teams');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/teams">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Team</h1>
          <p className="text-muted-foreground">Set up a new team with members</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-card border-border max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Details
            </CardTitle>
            <CardDescription>Fill in the details for the new team</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Team Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Frontend Team"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-secondary border-border"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="leader">Team Leader</FieldLabel>
                <select
                  id="leader"
                  value={selectedLeader}
                  onChange={(e) => setSelectedLeader(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-md border border-border bg-secondary text-foreground"
                >
                  <option value="">Select a team leader...</option>
                  {teamLeaders.map((leader) => (
                    <option key={leader.id} value={leader.id}>
                      {leader.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel>Team Members</FieldLabel>
                <div className="grid gap-2 mt-2">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                        selectedMembers.includes(member.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-secondary/50 hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            selectedMembers.includes(member.id)
                              ? 'bg-primary/20'
                              : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${
                              selectedMembers.includes(member.id)
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p
                            className={`font-medium ${
                              selectedMembers.includes(member.id)
                                ? 'text-primary'
                                : 'text-foreground'
                            }`}
                          >
                            {member.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      {selectedMembers.includes(member.id) && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
                {selectedMembers.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </Field>
            </FieldGroup>

            <div className="flex gap-3 mt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Team'}
              </Button>
              <Link to="/dashboard/teams">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
