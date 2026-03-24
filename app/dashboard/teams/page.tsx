'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockUsers, mockTeams, mockTasks } from '@/lib/mock-data';
import { Plus, Building2, Users, Edit, Trash2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground">
            Manage teams and their members
          </p>
        </div>
        <Link to="/dashboard/teams/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </Link>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockTeams.map((team) => {
          const leader = mockUsers.find((u) => u.id === team.leaderId);
          const members = mockUsers.filter((u) => team.memberIds.includes(u.id));
          const teamTasks = mockTasks.filter((t) => team.memberIds.includes(t.assignedMemberId));
          const activeTasks = teamTasks.filter((t) => t.status !== 'done');

          return (
            <Card key={team.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription>Team ID: {team.id}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Team Leader */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Team Leader</p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className="h-8 w-8 rounded-full bg-chart-2/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-chart-2">
                        {leader?.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{leader?.name}</p>
                      <p className="text-xs text-muted-foreground">{leader?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-xl font-bold text-foreground">{members.length}</p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-xl font-bold text-foreground">{teamTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Total Tasks</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary/50">
                    <p className="text-xl font-bold text-foreground">{activeTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>

                {/* Members */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Team Members</p>
                  <div className="space-y-2">
                    {members.slice(0, 3).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-foreground">{member.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {mockTasks.filter((t) => t.assignedMemberId === member.id).length} tasks
                        </span>
                      </div>
                    ))}
                    {members.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{members.length - 3} more members
                      </p>
                    )}
                    {members.length === 0 && (
                      <p className="text-sm text-muted-foreground">No members assigned</p>
                    )}
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  View Team Details
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {mockTeams.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No Teams</h3>
            <p className="text-muted-foreground mt-2">
              Create your first team to get started.
            </p>
            <Link to="/dashboard/teams/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
