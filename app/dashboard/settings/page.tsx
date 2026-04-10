'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Save, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getSettings, resetSettings, updateSettings } from '@/lib/api';
import { COMPLEXITY_MULTIPLIERS, PRIORITY_MULTIPLIERS } from '@/lib/types';

type SettingsForm = {
  complexityMultipliers: {
    simple: number;
    medium: number;
    complex: number;
  };
  priorityMultipliers: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  workloadThresholds: {
    available: number;
    moderate: number;
  };
};

const DEFAULT_SETTINGS: SettingsForm = {
  complexityMultipliers: {
    simple: COMPLEXITY_MULTIPLIERS.simple,
    medium: COMPLEXITY_MULTIPLIERS.medium,
    complex: COMPLEXITY_MULTIPLIERS.complex,
  },
  priorityMultipliers: {
    low: PRIORITY_MULTIPLIERS.low,
    medium: PRIORITY_MULTIPLIERS.medium,
    high: PRIORITY_MULTIPLIERS.high,
    critical: PRIORITY_MULTIPLIERS.critical,
  },
  workloadThresholds: {
    available: 15,
    moderate: 25,
  },
};

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSettings(payload: any): SettingsForm {
  const data = payload?.data ?? payload ?? {};

  return {
    complexityMultipliers: {
      simple: toNumber(
        data?.complexityMultipliers?.simple ?? data?.complexitySimpleMultiplier,
        DEFAULT_SETTINGS.complexityMultipliers.simple
      ),
      medium: toNumber(
        data?.complexityMultipliers?.medium ?? data?.complexityMediumMultiplier,
        DEFAULT_SETTINGS.complexityMultipliers.medium
      ),
      complex: toNumber(
        data?.complexityMultipliers?.complex ?? data?.complexityComplexMultiplier,
        DEFAULT_SETTINGS.complexityMultipliers.complex
      ),
    },
    priorityMultipliers: {
      low: toNumber(
        data?.priorityMultipliers?.low ?? data?.priorityLowMultiplier,
        DEFAULT_SETTINGS.priorityMultipliers.low
      ),
      medium: toNumber(
        data?.priorityMultipliers?.medium ?? data?.priorityMediumMultiplier,
        DEFAULT_SETTINGS.priorityMultipliers.medium
      ),
      high: toNumber(
        data?.priorityMultipliers?.high ?? data?.priorityHighMultiplier,
        DEFAULT_SETTINGS.priorityMultipliers.high
      ),
      critical: toNumber(
        data?.priorityMultipliers?.critical ?? data?.priorityCriticalMultiplier,
        DEFAULT_SETTINGS.priorityMultipliers.critical
      ),
    },
    workloadThresholds: {
      available: toNumber(
        data?.workloadThresholds?.available ?? data?.availableThreshold,
        DEFAULT_SETTINGS.workloadThresholds.available
      ),
      moderate: toNumber(
        data?.workloadThresholds?.moderate ?? data?.moderateThreshold,
        DEFAULT_SETTINGS.workloadThresholds.moderate
      ),
    },
  };
}

function toApiPayload(settings: SettingsForm) {
  return {
    complexityMultipliers: settings.complexityMultipliers,
    priorityMultipliers: settings.priorityMultipliers,
    workloadThresholds: settings.workloadThresholds,
    complexitySimpleMultiplier: settings.complexityMultipliers.simple,
    complexityMediumMultiplier: settings.complexityMultipliers.medium,
    complexityComplexMultiplier: settings.complexityMultipliers.complex,
    priorityLowMultiplier: settings.priorityMultipliers.low,
    priorityMediumMultiplier: settings.priorityMultipliers.medium,
    priorityHighMultiplier: settings.priorityMultipliers.high,
    priorityCriticalMultiplier: settings.priorityMultipliers.critical,
    availableThreshold: settings.workloadThresholds.available,
    moderateThreshold: settings.workloadThresholds.moderate,
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsForm>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      setError(null);

      try {
        const response = await getSettings();
        if (!active) return;
        setSettings(normalizeSettings(response));
      } catch (err: any) {
        if (!active) return;
        setSettings(DEFAULT_SETTINGS);
        setError(err?.message || 'Unable to load settings.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateSettings(toApiPayload(settings));
      setSettings(normalizeSettings(response || settings));
      setSuccess('Settings saved successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await resetSettings();
      if (response) {
        setSettings(normalizeSettings(response));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
      setSuccess('Settings reset successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to reset settings.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">
            Configure weight multipliers and workload thresholds
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={resetting || saving}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {resetting ? 'Resetting...' : 'Reset to Defaults'}
          </Button>
          <Button onClick={handleSave} disabled={saving || resetting}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="pt-6">
            <p className="text-sm text-emerald-400">{success}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                  value={settings.complexityMultipliers.simple}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      complexityMultipliers: {
                        ...prev.complexityMultipliers,
                        simple: parseFloat(e.target.value) || 1,
                      },
                    }))
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
                  value={settings.complexityMultipliers.medium}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      complexityMultipliers: {
                        ...prev.complexityMultipliers,
                        medium: parseFloat(e.target.value) || 1,
                      },
                    }))
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
                  value={settings.complexityMultipliers.complex}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      complexityMultipliers: {
                        ...prev.complexityMultipliers,
                        complex: parseFloat(e.target.value) || 1,
                      },
                    }))
                  }
                  className="bg-secondary border-border"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

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
                  value={settings.priorityMultipliers.low}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      priorityMultipliers: {
                        ...prev.priorityMultipliers,
                        low: parseFloat(e.target.value) || 1,
                      },
                    }))
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
                  value={settings.priorityMultipliers.medium}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      priorityMultipliers: {
                        ...prev.priorityMultipliers,
                        medium: parseFloat(e.target.value) || 1,
                      },
                    }))
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
                  value={settings.priorityMultipliers.high}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      priorityMultipliers: {
                        ...prev.priorityMultipliers,
                        high: parseFloat(e.target.value) || 1,
                      },
                    }))
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
                  value={settings.priorityMultipliers.critical}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      priorityMultipliers: {
                        ...prev.priorityMultipliers,
                        critical: parseFloat(e.target.value) || 1,
                      },
                    }))
                  }
                  className="bg-secondary border-border"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="font-medium text-emerald-400">Available</span>
                </div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Weight range: 0 - {settings.workloadThresholds.available}
                </p>
                <Field>
                  <FieldLabel htmlFor="threshold-available">Upper Limit</FieldLabel>
                  <Input
                    id="threshold-available"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.workloadThresholds.available}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        workloadThresholds: {
                          ...prev.workloadThresholds,
                          available: parseInt(e.target.value) || 15,
                        },
                      }))
                    }
                    className="bg-secondary border-border"
                  />
                </Field>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="font-medium text-amber-400">Moderate</span>
                </div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Weight range: {settings.workloadThresholds.available + 1} - {settings.workloadThresholds.moderate}
                </p>
                <Field>
                  <FieldLabel htmlFor="threshold-moderate">Upper Limit</FieldLabel>
                  <Input
                    id="threshold-moderate"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.workloadThresholds.moderate}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        workloadThresholds: {
                          ...prev.workloadThresholds,
                          moderate: parseInt(e.target.value) || 25,
                        },
                      }))
                    }
                    className="bg-secondary border-border"
                  />
                </Field>
              </div>

              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="font-medium text-red-400">Overloaded</span>
                </div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Weight range: {settings.workloadThresholds.moderate + 1}+
                </p>
                <p className="text-xs text-muted-foreground">
                  Any weight above the moderate threshold
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Weight Calculation Formula</CardTitle>
            <CardDescription>
              How task weight is calculated using the configured multipliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm">
              <p className="text-foreground">
                Weight = Effort (hours) x Complexity Multiplier x Priority Multiplier
              </p>
              <p className="mt-2 text-muted-foreground">
                Example: 8 hours x {settings.complexityMultipliers.medium} (medium) x{' '}
                {settings.priorityMultipliers.high} (high) ={' '}
                {(8 * settings.complexityMultipliers.medium * settings.priorityMultipliers.high).toFixed(1)} weight
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
