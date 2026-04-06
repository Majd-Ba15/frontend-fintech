'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { User, UserRole, Team } from '@/lib/types';
import * as api from '@/lib/api';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Shield,
  UserCog,
  User as UserIcon,
  X,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'member' as UserRole,
    teamId: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeUsers = (payload: any): User[] => {
    const usersArr: any[] = Array.isArray(payload) ? payload : payload?.data || [];
    return usersArr.map((u: any) => ({
      id: String(u.id ?? u.userId ?? ''),
      name: u.name || u.fullName || u.username || '',
      email: u.email || u.emailAddress || '',
      role: (u.role as UserRole) || 'member',
      teamId: String(u.teamId ?? u.team?.id ?? ''),
    }));
  };

  const normalizeTeams = (payload: any): Team[] => {
    const teamsArr: any[] = Array.isArray(payload) ? payload : payload?.data || [];
    return teamsArr.map((t: any) => ({
      id: String(t.id ?? t.teamId ?? ''),
      name: t.name || t.teamName || '',
      leaderId: String(t.leaderId ?? t.teamLeaderId ?? ''),
      memberIds: (t.memberIds || t.members || []).map((member: any) => String(member)),
    }));
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, teamsRes] = await Promise.allSettled([api.getUsers(), api.getTeams()]);

      setUsers(
        usersRes.status === 'fulfilled' ? normalizeUsers(usersRes.value) : []
      );
      setTeams(
        teamsRes.status === 'fulfilled' ? normalizeTeams(teamsRes.value) : []
      );
    } catch (err) {
      console.error('Failed to load users or teams', err);
      setError('Unable to load data. Please try again later.');
      setUsers([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter users
  let filteredUsers = users;
  if (searchQuery) {
    filteredUsers = filteredUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (roleFilter !== 'all') {
    filteredUsers = filteredUsers.filter((u) => u.role === roleFilter);
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'team_leader':
        return UserCog;
      default:
        return UserIcon;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary/20 text-primary';
      case 'team_leader':
        return 'bg-chart-2/20 text-chart-2';
      default:
        return 'bg-chart-3/20 text-chart-3';
    }
  };

  const startEditing = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
    });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditForm({ name: '', email: '', role: 'member', teamId: '' });
  };

  const saveUser = async () => {
    if (!editingUser) return;

    try {
      const payload: any = {
        fullName: editForm.name,
        email: editForm.email,
        role: editForm.role,
      };

      if (editForm.teamId) {
        const teamIdNumber = Number(editForm.teamId);
        payload.teamId = Number.isNaN(teamIdNumber) ? editForm.teamId : teamIdNumber;
      }

      const updatedResp = await api.updateUserById(editingUser.id, payload);

      const updatedRespAny = updatedResp as any;
      const updatedUser =
        updatedRespAny?.data || updatedRespAny || {
          ...editingUser,
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          teamId: editForm.teamId,
        };

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? normalizeUsers([updatedUser])[0] : u))
      );

      cancelEditing();
      loadData();
    } catch (err) {
      console.error('Error updating user', err);
      setError('Failed to update user. Please try again.');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.deleteUserById(userId);
      setUsers((prev) => prev.filter((u) => u.id !== String(userId)));
      loadData();
    } catch (err) {
      console.error('Error deleting user', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="rounded-lg border border-border bg-card p-4 text-center text-muted-foreground">
          Loading users...
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">View and manage users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            Refresh
          </Button>
          <Link to="/users/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.role === 'admin').length}
                </p>
                <p className="text-xs text-muted-foreground">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <UserCog className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.role === 'team_leader').length}
                </p>
                <p className="text-xs text-muted-foreground">Team Leaders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <UserIcon className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.role === 'member').length}
                </p>
                <p className="text-xs text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Role: {roleFilter === 'all' ? 'All' : roleFilter.replace('_', ' ')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRoleFilter('all')}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('admin')}>Admin</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('team_leader')}>
                  Team Leader
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('member')}>Member</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-border w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Edit User</CardTitle>
                <Button variant="ghost" size="sm" onClick={cancelEditing}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Update user information and role</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="editName">Full Name</FieldLabel>
                  <Input
                    id="editName"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="editEmail">Email Address</FieldLabel>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="editRole">Role</FieldLabel>
                  <select
                    id="editRole"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full h-10 px-3 rounded-md border border-border bg-secondary text-foreground"
                  >
                    <option value="admin">Administrator</option>
                    <option value="team_leader">Team Leader</option>
                    <option value="member">Team Member</option>
                  </select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="editTeam">Team</FieldLabel>
                  <select
                    id="editTeam"
                    value={editForm.teamId}
                    onChange={(e) => setEditForm({ ...editForm, teamId: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-border bg-secondary text-foreground"
                  >
                    <option value="">Unassigned</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </FieldGroup>

              <div className="flex gap-3 mt-6">
                <Button onClick={saveUser} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const team = teams.find((t) => t.id === user.teamId);
              const RoleIcon = getRoleIcon(user.role);

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-muted-foreground">Team</p>
                      <p className="text-sm font-medium text-foreground">
                        {user.teamId
                          ? team?.name || 'Deleted / Unknown Team'
                          : 'Unassigned'}
                      </p>
                      {user.teamId && !team && (
                        <p className="text-xs text-destructive">(team not found)</p>
                      )}
                    </div>

                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${getRoleColor(user.role)}`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {user.role.replace('_', ' ')}
                    </span>

                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEditing(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No users found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}