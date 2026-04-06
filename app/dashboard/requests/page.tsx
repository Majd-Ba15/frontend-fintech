'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getTasks, getMyTasks, getUserById, getChangeRequests, getMyChangeRequests, reviewChangeRequest } from '@/lib/api';
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
  const [requests, setRequests] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const tasksPromise = user?.role === 'member' ? getMyTasks() : getTasks();
        const requestsPromise = user?.role === 'member' ? getMyChangeRequests() : getChangeRequests();
        const [tasksRes, currentRequestsRes] = await Promise.all([tasksPromise, requestsPromise]);

        if (!active) return;

        const tasksData = Array.isArray(tasksRes) ? tasksRes : tasksRes?.data || [];
        const requestData = Array.isArray(currentRequestsRes) ? currentRequestsRes : currentRequestsRes?.data || [];

        setTasks(tasksData);
        setRequests(requestData);

        const userIds = new Set<string>();

        requestData.forEach((request: any) => {
          if (request.requestedBy) userIds.add(String(request.requestedBy));
          if (request.reviewedBy) userIds.add(String(request.reviewedBy));
          if (request.type === 'owner_change') {
            if (request.oldValue) userIds.add(String(request.oldValue));
            if (request.newValue) userIds.add(String(request.newValue));
          }
        });

        tasksData.forEach((task: any) => {
          if (task.assignedMemberId) userIds.add(String(task.assignedMemberId));
        });

        const canFetchUser = (id: string) =>
          user?.role === 'admin' || user?.role === 'team_leader' || String(user?.id) === id;

        if (user?.role === 'member') {
          const currentUserRecord = user
            ? {
                id: String(user.id),
                name: user.name,
                email: user.email,
                role: user.role,
                teamId: user.teamId,
              }
            : null;

          setUsers(currentUserRecord ? [currentUserRecord] : []);
          return;
        }

        const userFetchPromises = Array.from(userIds)
          .filter((id) => canFetchUser(id))
          .map(async (id) => {
            try {
              const userData = await getUserById(id);
              return Array.isArray(userData) ? userData[0] : userData?.data || userData;
            } catch (err) {
              return null;
            }
          });

        const fetchedUsers = await Promise.all(userFetchPromises);
        if (!active) return;

        setUsers(fetchedUsers.filter(Boolean) as any[]);
      } catch (err: any) {
        setError(err?.message || 'Unable to load requests.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [user]);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  if (!user) return null;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading change requests...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading requests: {error}</div>;
  }

  const handleApprove = async (requestId: string) => {
    try {
      await reviewChangeRequest(requestId, 'approved');
      setRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, status: 'approved', reviewedBy: user?.id, reviewedAt: new Date().toISOString() } : req)));
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError(err?.message || 'Failed to approve request.');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await reviewChangeRequest(requestId, 'rejected');
      setRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, status: 'rejected', reviewedBy: user?.id, reviewedAt: new Date().toISOString() } : req)));
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err?.message || 'Failed to reject request.');
    }
  };

  const renderRequestCard = (request: ChangeRequest, showActions: boolean = false) => {
    const task = tasks.find((t) => t.id === request.taskId);
    const requester = users.find((u) => u.id === request.requestedBy);
    const reviewer = users.find((u) => u.id === request.reviewedBy);
    const StatusIcon = statusIcons[request.status];

    const requesterName =
      requester?.name ||
      (String(request.requestedBy) === String(user?.id) ? user?.name : undefined) ||
      `User ${request.requestedBy}`;
    const reviewerName =
      reviewer?.name ||
      (String(request.reviewedBy) === String(user?.id) ? user?.name : undefined) ||
      (request.reviewedBy ? 'Team Leader' : undefined);
    const currentValue =
      request.type === 'owner_change'
        ? users.find((u) => u.id === request.oldValue)?.name || `User ${request.oldValue}`
        : request.type === 'effort_increase'
        ? `${request.oldValue} hours`
        : request.oldValue;
    const requestedValue =
      request.type === 'owner_change'
        ? users.find((u) => u.id === request.newValue)?.name || `User ${request.newValue}`
        : request.type === 'effort_increase'
        ? `${request.newValue} hours`
        : request.newValue;

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
                Requested by {requesterName}
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
                  <p className="font-medium text-foreground">{currentValue}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Requested Value</p>
                  <p className="font-medium text-primary">{requestedValue}</p>
                </div>
              </div>
            </div>

            {request.status !== 'pending' && reviewerName && (
              <p className="text-xs text-muted-foreground mt-3">
                Reviewed by {reviewerName} on{' '}
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
