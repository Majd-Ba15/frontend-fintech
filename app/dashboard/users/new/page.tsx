'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { UserRole } from '@/lib/types';
import * as api from '@/lib/api';
import { ArrowLeft, UserPlus, Shield, UserCog, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewUserPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const [error, setError] = useState<string | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await api.getTeams();
        const loaded = Array.isArray(response) ? response : response?.data || [];
        setTeams(loaded);
      } catch (err) {
        console.error('Failed to load teams', err);
        setTeams([]);
      } finally {
        setLoadingTeams(false);
      }
    }

    loadTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        fullName: name,
        email,
        role: selectedRole,
      };

      // add password fields if set (uncomment these if backend requires them)
      if (password) payload.password = password;
      if (confirmPassword) payload.confirmPassword = confirmPassword;

      // assign teamId if selected
      if (selectedTeam) {
        const maybeTeamId = Number(selectedTeam);
        payload.teamId = !Number.isNaN(maybeTeamId) ? maybeTeamId : selectedTeam;
      }

      await api.createUser(payload);
      navigate('/dashboard/users');
    } catch (err: any) {
      console.error('Create user failed', err);
      const message =
        err?.body?.message || err?.message || 'Failed to create user';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
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

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

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
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-secondary border-border"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-secondary border-border"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="team">Assign to Team (optional)</FieldLabel>
                <select
                  id="team"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-border bg-secondary text-foreground"
                >
                  <option value="">No team assigned</option>
                  {loadingTeams && <option value="" disabled>Loading teams...</option>}
                  {teams.map((team) => (
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
