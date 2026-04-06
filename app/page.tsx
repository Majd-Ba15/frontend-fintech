'use client';

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { LayoutDashboard, Users, CheckSquare, Shield, UserCog, User as UserIcon } from 'lucide-react';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const success = await login(email, password, selectedRole);
      if (success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    }
  };

  const roles: { value: UserRole; label: string; icon: typeof Shield }[] = [
    { value: 'admin', label: 'Administrator', icon: Shield },
    { value: 'team_leader', label: 'Team Leader', icon: UserCog },
    { value: 'member', label: 'Team Member', icon: UserIcon },
  ];

  const demoAccounts = [
    { role: 'Admin', email: 'admin@company.com' },
    { role: 'Team Leader', email: 'sarah@company.com' },
    { role: 'Member', email: 'mike@company.com' },
  ];

  const handleDemoLogin = async (demoEmail: string, role: string) => {
    setEmail(demoEmail);
    setPassword('demo');
    const roleMap: Record<string, UserRole> = {
      Admin: 'admin',
      'Team Leader': 'team_leader',
      Member: 'member',
    };
    const success = await login(demoEmail, 'demo', roleMap[role]);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">TaskFlow</h1>
          <p className="text-muted-foreground mt-2">Team Workload & Task Tracking</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-secondary border-border"
                  />
                </Field>

                {/* Role Selection */}
                <Field>
                  <FieldLabel>Select Your Role</FieldLabel>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {roles.map((role) => {
                      const Icon = role.icon;
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setSelectedRole(role.value)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                            selectedRole === role.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-secondary/50 hover:bg-secondary'
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              selectedRole === role.value
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              selectedRole === role.value
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {role.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </FieldGroup>

              {error && (
                <p className="text-sm text-destructive mt-4">{error}</p>
              )}

              <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                disabled={isLoading}
              >
                {isLoading ? <Spinner className="mr-2" /> : null}
                Sign In
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Register
                </Link>
              </p>
            </div>

            {/* Demo Accounts */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Quick access with demo accounts
              </p>
              <div className="grid gap-2">
                {demoAccounts.map((account) => (
                  <Button
                    key={account.email}
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => handleDemoLogin(account.email, account.role)}
                    disabled={isLoading}
                  >
                    {account.role === 'Admin' && <Shield className="h-4 w-4" />}
                    {account.role === 'Team Leader' && <UserCog className="h-4 w-4" />}
                    {account.role === 'Member' && <UserIcon className="h-4 w-4" />}
                    <span className="font-medium">{account.role}</span>
                    <span className="text-muted-foreground text-xs ml-auto">{account.email}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-card border border-border">
            <CheckSquare className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Task Tracking</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-card border border-border">
            <LayoutDashboard className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Workload View</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-card border border-border">
            <Users className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Team Management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
