'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { mockTeams } from '@/lib/mock-data';
import { UserRole } from '@/lib/types';
import { ArrowLeft, UserPlus, Shield, UserCog, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewUserPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [selectedTeam, setSelectedTeam] = useState('team-1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles: { value: UserRole; label: string; description: string; icon: typeof Shield }[] = [
    {
      value: 'admin',
      label: 'Administrator',
      description: 'Full system access and user management',
      icon: Shield,
    },
    {
      value: 'team_leader',
      label: 'Team Leader',
      description: 'Manage team workload and assign tasks',
      icon: UserCog,
    },
    {
      value: 'member',
      label: 'Team Member',
      description: 'View and complete assigned tasks',
      icon: UserIcon,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In a real app, this would create the user in the database
    console.log('New User:', {
      name,
      email,
      role: selectedRole,
      teamId: selectedTeam,
    });

    setIsSubmitting(false);
    navigate('/dashboard/users');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New User</h1>
          <p className="text-muted-foreground">Create a new user account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-card border-border max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              User Details
            </CardTitle>
            <CardDescription>Fill in the details for the new user</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-secondary border-border"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary border-border"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="team">Assign to Team</FieldLabel>
                <select
                  id="team"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-md border border-border bg-secondary text-foreground"
                >
                  {mockTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel>Select Role</FieldLabel>
                <div className="grid gap-2 mt-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                          selectedRole === role.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-secondary/50 hover:bg-secondary'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            selectedRole === role.value ? 'bg-primary/20' : 'bg-muted'
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              selectedRole === role.value ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                        </div>
                        <div>
                          <p
                            className={`font-medium ${
                              selectedRole === role.value ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {role.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </FieldGroup>

            <div className="flex gap-3 mt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
              <Link to="/dashboard/users">
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
