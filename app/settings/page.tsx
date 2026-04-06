'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { COMPLEXITY_MULTIPLIERS, PRIORITY_MULTIPLIERS } from '@/lib/types';
import { getSettings, updateSettings, resetSettings } from '@/lib/api';
import { Settings, Save, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [complexityMultipliers, setComplexityMultipliers] = useState({
    simple: COMPLEXITY_MULTIPLIERS.simple,
    medium: COMPLEXITY_MULTIPLIERS.medium,
    complex: COMPLEXITY_MULTIPLIERS.complex,
  });

  const [priorityMultipliers, setPriorityMultipliers] = useState({
    low: PRIORITY_MULTIPLIERS.low,
    medium: PRIORITY_MULTIPLIERS.medium,
    high: PRIORITY_MULTIPLIERS.high,
    critical: PRIORITY_MULTIPLIERS.critical,
  });

  const [workloadThresholds, setWorkloadThresholds] = useState({
    available: 15,
    moderate: 25,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings) {
          setComplexityMultipliers({
            simple: settings.complexitySimple || COMPLEXITY_MULTIPLIERS.simple,
            medium: settings.complexityMedium || COMPLEXITY_MULTIPLIERS.medium,
            complex: settings.complexityComplex || COMPLEXITY_MULTIPLIERS.complex,
          });
          setPriorityMultipliers({
            low: settings.priorityLow || PRIORITY_MULTIPLIERS.low,
            medium: settings.priorityMedium || PRIORITY_MULTIPLIERS.medium,
            high: settings.priorityHigh || PRIORITY_MULTIPLIERS.high,
            critical: settings.priorityCritical || PRIORITY_MULTIPLIERS.critical,
          });
          setWorkloadThresholds({
            available: settings.workloadAvailableUpperLimit || 15,
            moderate: settings.workloadModerateUpperLimit || 25,
          });
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateSettings({
        complexitySimple: complexityMultipliers.simple,
        complexityMedium: complexityMultipliers.medium,
        complexityComplex: complexityMultipliers.complex,
        priorityLow: priorityMultipliers.low,
        priorityMedium: priorityMultipliers.medium,
        priorityHigh: priorityMultipliers.high,
        priorityCritical: priorityMultipliers.critical,
        workloadAvailableUpperLimit: workloadThresholds.available,
        workloadModerateUpperLimit: workloadThresholds.moderate,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError(null);
    try {
      await resetSettings();
      // Reload settings
      const settings = await getSettings();
      if (settings) {
        setComplexityMultipliers({
          simple: settings.complexitySimple || COMPLEXITY_MULTIPLIERS.simple,
          medium: settings.complexityMedium || COMPLEXITY_MULTIPLIERS.medium,
          complex: settings.complexityComplex || COMPLEXITY_MULTIPLIERS.complex,
        });
        setPriorityMultipliers({
          low: settings.priorityLow || PRIORITY_MULTIPLIERS.low,
          medium: settings.priorityMedium || PRIORITY_MULTIPLIERS.medium,
          high: settings.priorityHigh || PRIORITY_MULTIPLIERS.high,
          critical: settings.priorityCritical || PRIORITY_MULTIPLIERS.critical,
        });
        setWorkloadThresholds({
          available: settings.workloadAvailableUpperLimit || 15,
          moderate: settings.workloadModerateUpperLimit || 25,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and multipliers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complexity Multipliers */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Complexity Multipliers</CardTitle>
            </div>
            <CardDescription>
              Configure how task complexity affects the weight calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="complexity-simple">Simple Tasks</FieldLabel>
                <Input
                  id="complexity-simple"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={complexityMultipliers.simple}
                  onChange={(e) =>
                    setComplexityMultipliers({
                      ...complexityMultipliers,
                      simple: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="bg-secondary border-border"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="complexity-medium">Medium Tasks</FieldLabel>
                <Input
                  id="complexity-medium"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={complexityMultipliers.medium}
                  onChange={(e) =>
                    setComplexityMultipliers({
                      ...complexityMultipliers,
                      medium: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="bg-secondary border-border"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="complexity-complex">Complex Tasks</FieldLabel>
                <Input
                  id="complexity-complex"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={complexityMultipliers.complex}
                  onChange={(e) =>
                    setComplexityMultipliers({
                      ...complexityMultipliers,
                      complex: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="bg-secondary border-border"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Priority Multipliers */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-chart-2" />
              <CardTitle className="text-lg">Priority Multipliers</CardTitle>
            </div>
            <CardDescription>
              Configure how task priority affects the weight calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="priority-low">Low Priority</FieldLabel>
                <Input
                  id="priority-low"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={priorityMultipliers.low}
                  onChange={(e) =>
                    setPriorityMultipliers({
                      ...priorityMultipliers,
                      low: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="bg-secondary border-border"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="priority-medium">Medium Priority</FieldLabel>
                <Input
                  id="priority-medium"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={priorityMultipliers.medium}
                  onChange={(e) =>
                    setPriorityMultipliers({
                      ...priorityMultipliers,
                      medium: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="bg-secondary border-border"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="priority-high">High Priority</FieldLabel>
                <Input
                  id="priority-high"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={priorityMultipliers.high}
                  onChange={(e) =>
                    setPriorityMultipliers({
                      ...priorityMultipliers,
                      high: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="bg-secondary border-border"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="priority-critical">Critical Priority</FieldLabel>
                <Input
                  id="priority-critical"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={priorityMultipliers.critical}
                  onChange={(e) =>
                    setPriorityMultipliers({
                      ...priorityMultipliers,
                      critical: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="bg-secondary border-border"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Workload Thresholds */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-chart-3" />
              <CardTitle className="text-lg">Workload Thresholds</CardTitle>
            </div>
            <CardDescription>
              Configure the workload status thresholds (weight ranges)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="font-medium text-emerald-400">Available</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Weight range: 0 - {workloadThresholds.available}
                </p>
                <Field>
                  <FieldLabel htmlFor="threshold-available">Upper Limit</FieldLabel>
                  <Input
                    id="threshold-available"
                    type="number"
                    min="1"
                    max="100"
                    value={workloadThresholds.available}
                    onChange={(e) =>
                      setWorkloadThresholds({
                        ...workloadThresholds,
                        available: parseInt(e.target.value) || 15,
                      })
                    }
                    className="bg-secondary border-border"
                  />
                </Field>
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="font-medium text-amber-400">Moderate</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Weight range: {workloadThresholds.available + 1} - {workloadThresholds.moderate}
                </p>
                <Field>
                  <FieldLabel htmlFor="threshold-moderate">Upper Limit</FieldLabel>
                  <Input
                    id="threshold-moderate"
                    type="number"
                    min="1"
                    max="100"
                    value={workloadThresholds.moderate}
                    onChange={(e) =>
                      setWorkloadThresholds({
                        ...workloadThresholds,
                        moderate: parseInt(e.target.value) || 25,
                      })
                    }
                    className="bg-secondary border-border"
                  />
                </Field>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="font-medium text-red-400">Overloaded</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Weight range: {workloadThresholds.moderate + 1}+
                </p>
                <p className="text-xs text-muted-foreground">
                  Any weight above the moderate threshold
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight Formula Reference */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Weight Calculation Formula</CardTitle>
            <CardDescription>
              How task weight is calculated using the configured multipliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm">
              <p className="text-foreground">
                Weight = Effort (hours) × Complexity Multiplier × Priority Multiplier
              </p>
              <p className="text-muted-foreground mt-2">
                Example: 8 hours × {complexityMultipliers.medium} (medium) ×{' '}
                {priorityMultipliers.high} (high) ={' '}
                {(8 * complexityMultipliers.medium * priorityMultipliers.high).toFixed(1)} weight
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}