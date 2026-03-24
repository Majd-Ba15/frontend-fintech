'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockChangeRequests, mockTasks, mockUsers } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { ChangeRequest, ChangeRequestStatus } from '@/lib/types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  User,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const statusIcons: Record<ChangeRequestStatus, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

const statusColors: Record<ChangeRequestStatus, string> = {
  pending: 'text-amber-400 bg-amber-500/20',
  approved: 'text-emerald-400 bg-emerald-500/20',
  rejected: 'text-red-400 bg-red-500/20',
};

const typeLabels: Record<string, string> = {
  owner_change: 'Owner Change',
  due_date_change: 'Due Date Change',
  effort_increase: 'Effort Increase',
};

export default function ChangeRequestsPage() {
  const { user } = useAuth();

  // Filter requests based on role
  let requests = mockChangeRequests;
  if (user?.role === 'member') {
    requests = mockChangeRequests.filter((r) => r.requestedBy === user.id);
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  const handleApprove = (requestId: string) => {
    console.log('[v0] Approving request:', requestId);
  };

  const handleReject = (requestId: string) => {
    console.log('[v0] Rejecting request:', requestId);
  };

  const renderRequestCard = (request: ChangeRequest, showActions: boolean = false) => {
    const task = mockTasks.find((t) => t.id === request.taskId);
    const requester = mockUsers.find((u) => u.id === request.requestedBy);
    const reviewer = mockUsers.find((u) => u.id === request.reviewedBy);
    const StatusIcon = statusIcons[request.status];

    return (
      <div
        key={request.id}
        className="p-4 rounded-lg border border-border bg-secondary/30"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${statusColors[request.status]}`}
              >
                <StatusIcon className="h-3 w-3 inline-block mr-1" />
                {request.status}
              </span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                {typeLabels[request.type]}
              </span>
            </div>

            <h3 className="font-medium text-foreground mt-2">
              {task?.title || 'Unknown Task'}
            </h3>

            <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>

            <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Requested by {requester?.name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(request.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-3 p-3 rounded bg-muted/50">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Value</p>
                  <p className="font-medium text-foreground">
                    {request.type === 'owner_change'
                      ? mockUsers.find((u) => u.id === request.oldValue)?.name
                      : request.type === 'effort_increase'
                      ? `${request.oldValue} hours`
                      : request.oldValue}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Requested Value</p>
                  <p className="font-medium text-primary">
                    {request.type === 'owner_change'
                      ? mockUsers.find((u) => u.id === request.newValue)?.name
                      : request.type === 'effort_increase'
                      ? `${request.newValue} hours`
                      : request.newValue}
                  </p>
                </div>
              </div>
            </div>

            {request.status !== 'pending' && reviewer && (
              <p className="text-xs text-muted-foreground mt-3">
                Reviewed by {reviewer.name} on{' '}
                {new Date(request.reviewedAt!).toLocaleDateString()}
              </p>
            )}
          </div>

          {showActions && request.status === 'pending' && (
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={() => handleApprove(request.id)}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => handleReject(request.id)}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Change Requests</h1>
          <p className="text-muted-foreground">
            {user?.role === 'team_leader'
              ? 'Review and manage change requests from your team'
              : 'View your submitted change requests'}
          </p>
        </div>
        {user?.role === 'member' && (
          <Link to="/dashboard/requests/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </Link>
        )}
      </div>

      {/* Pending Requests */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Pending Requests
          </CardTitle>
          <CardDescription>
            {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} awaiting
            review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) =>
                renderRequestCard(request, user?.role === 'team_leader')
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending requests</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-chart-1" />
            Processed Requests
          </CardTitle>
          <CardDescription>Previously reviewed change requests</CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length > 0 ? (
            <div className="space-y-4">
              {processedRequests.map((request) => renderRequestCard(request, false))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No processed requests</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
