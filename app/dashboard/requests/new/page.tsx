'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { mockTasks, mockUsers } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { ChangeRequestType } from '@/lib/types';
import { ArrowLeft, FileText, Calendar, User, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState('');
  const [requestType, setRequestType] = useState<ChangeRequestType>('owner_change');
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get tasks assigned to current user
  const myTasks = mockTasks.filter((t) => t.assignedMemberId === user?.id);

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

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In a real app, this would create the request in the database
    console.log('New Request:', {
      taskId: selectedTask,
      type: requestType,
      newValue,
      reason,
      requestedBy: user?.id,
    });

    setIsSubmitting(false);
    navigate('/dashboard/requests');
  };

  const selectedTaskData = mockTasks.find((t) => t.id === selectedTask);

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
                    <select
                      id="newValue"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-md border border-border bg-secondary text-foreground"
                    >
                      <option value="">Select new owner...</option>
                      {mockUsers
                        .filter((u) => u.role === 'member' && u.id !== user?.id)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
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
                        {mockUsers.find((u) => u.id === selectedTaskData.assignedMemberId)?.name}
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
