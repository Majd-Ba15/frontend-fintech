'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { LayoutDashboard, ArrowLeft, Mail, CheckCircle2, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

type Step = 'email' | 'code' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo, any email works
    setIsLoading(false);
    setStep('code');
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo, code "123456" works
    if (code === '123456' || code.length === 6) {
      setIsLoading(false);
      setStep('reset');
    } else {
      setIsLoading(false);
      setError('Invalid verification code. For demo, use any 6-digit code.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsLoading(false);
    setStep('success');
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
          {step === 'email' && (
            <>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl">Forgot Password?</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a verification code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendCode}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="email">Email Address</FieldLabel>
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
                  </FieldGroup>

                  {error && (
                    <p className="text-sm text-destructive mt-4">{error}</p>
                  )}

                  <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                    {isLoading ? <Spinner className="mr-2" /> : null}
                    Send Verification Code
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/"
                    className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </CardContent>
            </>
          )}

          {step === 'code' && (
            <>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <KeyRound className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl">Enter Verification Code</CardTitle>
                <CardDescription>
                  We sent a 6-digit code to {email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyCode}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="code">Verification Code</FieldLabel>
                      <Input
                        id="code"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        maxLength={6}
                        className="bg-secondary border-border text-center text-2xl tracking-widest"
                      />
                    </Field>
                  </FieldGroup>

                  {error && (
                    <p className="text-sm text-destructive mt-4">{error}</p>
                  )}

                  <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                    {isLoading ? <Spinner className="mr-2" /> : null}
                    Verify Code
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Didn't receive the code? Try again
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <Link
                    to="/"
                    className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </CardContent>
            </>
          )}

          {step === 'reset' && (
            <>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <KeyRound className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl">Reset Password</CardTitle>
                <CardDescription>
                  Create a new password for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="bg-secondary border-border"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-secondary border-border"
                      />
                    </Field>
                  </FieldGroup>

                  {error && (
                    <p className="text-sm text-destructive mt-4">{error}</p>
                  )}

                  <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                    {isLoading ? <Spinner className="mr-2" /> : null}
                    Reset Password
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {step === 'success' && (
            <>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
                <CardTitle className="text-xl">Password Reset Successful</CardTitle>
                <CardDescription>
                  Your password has been updated. You can now sign in with your new password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/">
                  <Button className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
