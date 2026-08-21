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
  XCircle, 
  AlertTriangle, 
  Clock, 
  UserCheck,
  Check,
  Ban
} from 'lucide-react';

interface InterventionsPanelProps {
  clusterId: string;
  initialInterventions: Intervention[];
  currentStatus: ClusterStatus;
  onStatusChange?: (status: ClusterStatus) => void;
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
  const [performedBy, setPerformedBy] = useState('Maintenance — R. Sharma');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const handleAddIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newIntervention: Intervention = {
      id: `int-${Date.now().toString().slice(-4)}`,
      clusterId,
      kind: 'water_test',
      tds: tds ? parseFloat(tds) : null,
      residualChlorine: residualChlorine ? parseFloat(residualChlorine) : null,
      turbidity: turbidity ? parseFloat(turbidity) : null,
      coliformPositive,
      outcome: outcome.trim() || 'Water test logged',
      causeCode: coliformPositive ? 'filter_media_exhausted' : 'normal_parameters',
      performedBy: performedBy.trim() || 'Facility Staff',
      performedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setInterventions([newIntervention, ...interventions]);
      setIsSubmitting(false);
      setShowLogForm(false);
      setActionSuccessMessage('Water test parameter log successfully recorded.');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }, 400);
  };

  const handleClusterAction = (newStatus: ClusterStatus) => {
    setStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
    setActionSuccessMessage(
      newStatus === 'confirmed'
        ? 'Cluster confirmed! Public health advisory dispatched to affected block.'
        : 'Cluster dismissed as normal fluctuation.'
    );
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Cluster Decision & Action Bar */}
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold">Cluster Decision & Protocol Execution</CardTitle>
              <CardDescription className="text-xs">
                Human-in-the-loop arbitration. Advisory broadcasts require explicit human confirmation.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono uppercase">
                Current: {status}
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
              disabled={status === 'confirmed'}
              onClick={() => handleClusterAction('confirmed')}
            >
              <Check className="size-4" />
              <span>Confirm Outbreak & Send Advisory</span>
            </Button>

            <Button
              variant="outline"
              className="flex-1 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-2"
              disabled={status === 'dismissed'}
              onClick={() => handleClusterAction('dismissed')}
            >
              <Ban className="size-4 text-zinc-500" />
              <span>Dismiss as Noise / Fluctuation</span>
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
              <CardTitle className="text-base font-bold">Log Water Quality Test</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Record physical & microbiological water quality metrics for node verification.
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
                  <span className="font-bold text-red-600 dark:text-red-400">Coliform Positive Detected (H₂S Vial / Petri Strip)</span>
                  <span className="text-zinc-500 text-[11px]">— confirms faecal / bacterial contamination</span>
                </Label>
              </div>

              <div className="space-y-1">
                <Label htmlFor="outcome" className="text-xs font-semibold">Inspection Outcome & Cause Diagnosis</Label>
                <Textarea
                  id="outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="Details of physical inspection, membrane condition, pipeline integrity..."
                  className="text-xs bg-white dark:bg-zinc-900 min-h-[60px]"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="performedBy" className="text-xs font-semibold">Technician / Inspector Name</Label>
                <Input
                  id="performedBy"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  placeholder="e.g. Maintenance — R. Sharma"
                  className="h-9 text-xs bg-white dark:bg-zinc-900"
                />
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex justify-end gap-2 bg-amber-100/40 dark:bg-amber-950/40">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowLogForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                {isSubmitting ? 'Saving...' : 'Record Test Result'}
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
              <CardTitle className="text-lg font-bold">Intervention & Maintenance History</CardTitle>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {interventions.length} Recorded Interventions
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-3">
          {interventions.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              No physical interventions logged for this cluster yet. Click &ldquo;Log Water Test&rdquo; to add diagnostic records.
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
