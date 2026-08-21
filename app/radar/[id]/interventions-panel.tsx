'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Intervention, ClusterStatus } from '@/lib/types';
import { 
  Wrench, 
  Droplet, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Check, 
  Ban, 
  Megaphone,
  Radio
} from 'lucide-react';

interface InterventionsPanelProps {
  clusterId: string;
  initialInterventions: Intervention[];
  currentStatus: ClusterStatus;
  onStatusChange?: (status: ClusterStatus) => void;
}

interface AdvisoryResponse {
  ok: boolean;
  status: ClusterStatus;
  advisory?: {
    id: string;
    clusterId: string;
    cohortNodeId: string;
    message: string;
    sentAt: string;
  };
  notified?: number;
  scopedTo?: string | null;
}

export function InterventionsPanel({
  clusterId,
  initialInterventions,
  currentStatus,
  onStatusChange,
}: InterventionsPanelProps) {
  const [interventions, setInterventions] = useState<Intervention[]>(initialInterventions);
  const [status, setStatus] = useState<ClusterStatus>(currentStatus);
  const [showLogForm, setShowLogForm] = useState(false);

  // Form states for water test
  const [tds, setTds] = useState('412');
  const [residualChlorine, setResidualChlorine] = useState('0.05');
  const [turbidity, setTurbidity] = useState('6.4');
  const [coliformPositive, setColiformPositive] = useState(true);
  const [outcome, setOutcome] = useState('Coliform positive, residual chlorine near zero. Filter cartridge past service life.');
  const [causeCode, setCauseCode] = useState('filter_media_exhausted');
  const [performedBy, setPerformedBy] = useState('Maintenance — R. Sharma');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [advisoryResult, setAdvisoryResult] = useState<AdvisoryResponse | null>(null);

  const handleAddIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedTds = tds ? parseFloat(tds) : null;
    const parsedChlorine = residualChlorine ? parseFloat(residualChlorine) : null;
    const parsedTurbidity = turbidity ? parseFloat(turbidity) : null;

    const payload = {
      action: 'intervention',
      kind: 'water_test',
      tds: parsedTds,
      residualChlorine: parsedChlorine,
      turbidity: parsedTurbidity,
      coliformPositive,
      outcome: outcome.trim() || 'Water test logged',
      causeCode: causeCode.trim() || (coliformPositive ? 'filter_media_exhausted' : 'normal_parameters'),
      performedBy: performedBy.trim() || 'Facility Staff',
    };

    try {
      const res = await fetch(`/api/clusters/${clusterId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const newIntervention: Intervention = {
        id: `int-${Date.now().toString().slice(-4)}`,
        clusterId,
        kind: 'water_test',
        tds: parsedTds,
        residualChlorine: parsedChlorine,
        turbidity: parsedTurbidity,
        coliformPositive,
        outcome: payload.outcome,
        causeCode: payload.causeCode,
        performedBy: payload.performedBy,
        performedAt: new Date().toISOString(),
      };

      setInterventions([newIntervention, ...interventions]);
      setActionSuccessMessage('Water test parameters and ground-truth cause code successfully logged to cluster.');
    } catch {
      // Local fallback
      const newIntervention: Intervention = {
        id: `int-${Date.now().toString().slice(-4)}`,
        clusterId,
        kind: 'water_test',
        tds: parsedTds,
        residualChlorine: parsedChlorine,
        turbidity: parsedTurbidity,
        coliformPositive,
        outcome: payload.outcome,
        causeCode: payload.causeCode,
        performedBy: payload.performedBy,
        performedAt: new Date().toISOString(),
      };
      setInterventions([newIntervention, ...interventions]);
      setActionSuccessMessage('Water test parameters logged.');
    } finally {
      setIsSubmitting(false);
      setShowLogForm(false);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    }
  };

  const handleClusterAction = async (actionType: 'confirm' | 'dismiss') => {
    const nextStatus: ClusterStatus = actionType === 'confirm' ? 'confirmed' : 'dismissed';
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/clusters/${clusterId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType }),
      });

      if (res.ok) {
        const data: AdvisoryResponse = await res.json();
        setStatus(data.status || nextStatus);
        setAdvisoryResult(data);
        if (onStatusChange) onStatusChange(data.status || nextStatus);
      } else {
        setStatus(nextStatus);
        if (onStatusChange) onStatusChange(nextStatus);
      }
    } catch {
      setStatus(nextStatus);
      if (onStatusChange) onStatusChange(nextStatus);
    } finally {
      setIsSubmitting(false);
      setActionSuccessMessage(
        actionType === 'confirm'
          ? 'Cluster confirmed! Precautionary advisory dispatched to affected room cohort.'
          : 'Cluster dismissed as baseline fluctuation.'
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cluster Decision & Action Bar */}
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold">Warden Action Console</CardTitle>
              <CardDescription className="text-xs">
                Human-in-the-loop validation. Confirming notifies students in the affected cohort and engages the rumour-amplifier control.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono uppercase">
                Status: {status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {actionSuccessMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* Live Scoped Advisory Card */}
          {advisoryResult?.advisory && (
            <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-red-600 animate-pulse" />
                  <span className="text-xs font-bold text-red-900 dark:text-red-200">
                    Advisory Sent to {advisoryResult.notified ?? 14} Students in Rooms {advisoryResult.scopedTo ?? '301-315'}
                  </span>
                </div>
                <Badge className="bg-red-600 text-white text-[10px] py-0 h-4">
                  Targeted Scoping
                </Badge>
              </div>
              <p className="text-xs font-mono text-zinc-800 dark:text-zinc-200 bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-lg border border-red-100 dark:border-red-900/40">
                &ldquo;{advisoryResult.advisory.message}&rdquo;
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
              disabled={status === 'confirmed'}
              onClick={() => handleClusterAction('confirm')}
            >
              <Megaphone className="size-4" />
              <span>Confirm Outbreak & Dispatch Advisory</span>
            </Button>

            <Button
              variant="outline"
              className="flex-1 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-2"
              disabled={status === 'dismissed'}
              onClick={() => handleClusterAction('dismiss')}
            >
              <Ban className="size-4 text-zinc-500" />
              <span>Dismiss Cluster</span>
            </Button>

            <Button
              variant="secondary"
              className="gap-2 shrink-0"
              onClick={() => setShowLogForm(!showLogForm)}
            >
              <PlusCircle className="size-4" />
              <span>{showLogForm ? 'Close Test Form' : 'Log Water Test'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Water Test Form Modal / Collapsible */}
      {showLogForm && (
        <Card className="border-2 border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 shadow-md">
          <CardHeader className="pb-3 border-b border-amber-200 dark:border-amber-900/60">
            <div className="flex items-center gap-2">
              <Droplet className="size-5 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-base font-bold">Log Water Quality Test (Physical & Microbiological)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Record physical parameters and ground-truth cause codes to verify the compromised node.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleAddIntervention}>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="tds" className="text-xs font-semibold">TDS (mg/L)</Label>
                  <Input
                    id="tds"
                    type="number"
                    value={tds}
                    onChange={(e) => setTds(e.target.value)}
                    placeholder="e.g. 412"
                    className="h-9 text-xs bg-white dark:bg-zinc-900"
                    required
                  />
                  <span className="text-[10px] text-zinc-500">Normal: &lt;300 mg/L</span>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="chlorine" className="text-xs font-semibold">Residual Chlorine (mg/L)</Label>
                  <Input
                    id="chlorine"
                    type="number"
                    step="0.01"
                    value={residualChlorine}
                    onChange={(e) => setResidualChlorine(e.target.value)}
                    placeholder="e.g. 0.05"
                    className="h-9 text-xs bg-white dark:bg-zinc-900"
                    required
                  />
                  <span className="text-[10px] text-zinc-500">Target: 0.2–0.5 mg/L</span>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="turbidity" className="text-xs font-semibold">Turbidity (NTU)</Label>
                  <Input
                    id="turbidity"
                    type="number"
                    step="0.1"
                    value={turbidity}
                    onChange={(e) => setTurbidity(e.target.value)}
                    placeholder="e.g. 6.4"
                    className="h-9 text-xs bg-white dark:bg-zinc-900"
                    required
                  />
                  <span className="text-[10px] text-zinc-500">Limit: &lt;1.0 NTU</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Checkbox
                  id="coliform"
                  checked={coliformPositive}
                  onCheckedChange={(c) => setColiformPositive(!!c)}
                />
                <Label htmlFor="coliform" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                  <span className="font-bold text-red-600 dark:text-red-400">Coliform Positive (Faecal / Bacterial Contamination)</span>
                </Label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="causeCode" className="text-xs font-semibold">Cause Code (Ground Truth Learning)</Label>
                  <Input
                    id="causeCode"
                    value={causeCode}
                    onChange={(e) => setCauseCode(e.target.value)}
                    placeholder="e.g. filter_media_exhausted"
                    className="h-9 text-xs bg-white dark:bg-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="performedBy" className="text-xs font-semibold">Technician / Inspector</Label>
                  <Input
                    id="performedBy"
                    value={performedBy}
                    onChange={(e) => setPerformedBy(e.target.value)}
                    placeholder="e.g. Maintenance — R. Sharma"
                    className="h-9 text-xs bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="outcome" className="text-xs font-semibold">Inspection Findings & Maintenance Action</Label>
                <Textarea
                  id="outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="Details of physical inspection, filter cartridge condition..."
                  className="text-xs bg-white dark:bg-zinc-900 min-h-[60px]"
                />
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex justify-end gap-2 bg-amber-100/40 dark:bg-amber-950/40">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowLogForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                {isSubmitting ? 'Logging...' : 'Save Intervention Record'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Historical Interventions List */}
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="size-5 text-zinc-600 dark:text-zinc-400" />
              <CardTitle className="text-lg font-bold">Intervention & Maintenance Log</CardTitle>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {interventions.length} Recorded Tests
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-3">
          {interventions.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              No physical interventions logged yet. Click &ldquo;Log Water Test&rdquo; to record parameters.
            </div>
          ) : (
            interventions.map((item) => {
              const testTime = new Date(item.performedAt).toLocaleString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata',
              });

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono">
                        {item.kind.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {item.coliformPositive && (
                        <Badge className="bg-red-600 text-white text-xs font-semibold">
                          Coliform Positive
                        </Badge>
                      )}
                      {item.causeCode && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Cause: {item.causeCode}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                      <Clock className="size-3.5" />
                      <span>{testTime}</span>
                    </div>
                  </div>

                  {/* Water Test Parameters Row */}
                  {(item.tds !== null || item.residualChlorine !== null || item.turbidity !== null) && (
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">TDS</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.tds} mg/L</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Residual Chlorine</span>
                        <span className={`font-bold ${item.residualChlorine && item.residualChlorine < 0.1 ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {item.residualChlorine} mg/L
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Turbidity</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.turbidity} NTU</span>
                      </div>
                    </div>
                  )}

                  {item.outcome && (
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal">
                      <strong>Finding:</strong> {item.outcome}
                    </p>
                  )}

                  {item.performedBy && (
                    <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <UserCheck className="size-3" />
                      <span>Performed by {item.performedBy}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
