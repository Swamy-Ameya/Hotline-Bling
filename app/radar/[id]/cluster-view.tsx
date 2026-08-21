'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ClusterDetail, 
  ClusterStatus, 
  ScenarioId, 
  SCENARIOS 
} from '@/lib/types';
import { VerdictCard } from './verdict-card';
import { PermutationPanel } from './permutation-panel';
import { EpiCurveChart } from './epi-curve-chart';
import { MealTable } from './meal-table';
import { CaseList } from './case-list';
import { InterventionsPanel } from './interventions-panel';
import { 
  ArrowLeft, 
  Activity, 
  Dna, 
  Utensils, 
  Users, 
  Wrench, 
  ShieldAlert, 
  CheckCircle2,
  Share2,
  FileText
} from 'lucide-react';

interface ClusterViewProps {
  detail: ClusterDetail;
  scenarioId: ScenarioId;
  role: string;
}

export function ClusterView({ detail, scenarioId, role }: ClusterViewProps) {
  const router = useRouter();
  const [cluster, setCluster] = useState(detail.cluster);
  const [activeTab, setActiveTab] = useState('overview');

  const handleStatusChange = (newStatus: ClusterStatus) => {
    setCluster((prev) => ({ ...prev, status: newStatus }));
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Scenario Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <ArrowLeft className="size-4" />
              <span>Back to Hub</span>
            </Button>
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span className="text-xs font-mono text-zinc-500">
            Role: <strong className="text-zinc-900 dark:text-zinc-100 uppercase">{role}</strong>
          </span>
        </div>

        {/* Quick Scenario Jumper */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-zinc-500 mr-1 hidden md:inline">Scenarios:</span>
          {SCENARIOS.map((sc) => {
            const isCurrent = sc.id === scenarioId;
            return (
              <Link key={sc.id} href={`/radar/${sc.id}`}>
                <Button
                  variant={isCurrent ? 'default' : 'outline'}
                  size="sm"
                  className={`h-7 text-xs px-2.5 rounded-full ${
                    isCurrent
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {sc.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full bg-zinc-100 dark:bg-zinc-900/80 p-1 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <TabsTrigger value="overview" className="gap-2 text-xs font-medium data-[state=active]:font-bold">
            <Activity className="size-3.5" />
            <span>Overview & Scan</span>
          </TabsTrigger>

          <TabsTrigger value="cohort" className="gap-2 text-xs font-medium data-[state=active]:font-bold">
            <Utensils className="size-3.5" />
            <span>2×2 Meal Cohort ({detail.mealTable.length})</span>
          </TabsTrigger>

          <TabsTrigger value="cases" className="gap-2 text-xs font-medium data-[state=active]:font-bold">
            <Users className="size-3.5" />
            <span>Case Roster ({detail.cases.length})</span>
          </TabsTrigger>

          <TabsTrigger value="interventions" className="gap-2 text-xs font-medium data-[state=active]:font-bold">
            <Wrench className="size-3.5" />
            <span>Interventions & Tests ({detail.interventions.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview (Verdict + Permutation + Epi Curve) */}
        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
          {/* Verdict Block */}
          <VerdictCard cluster={cluster} />

          {/* Permutation Panel — Headline Challenge Question Proof */}
          <PermutationPanel
            permutation={detail.permutation}
            scenarioId={scenarioId}
          />

          {/* Epidemic Curve */}
          <EpiCurveChart
            epiCurve={detail.epiCurve}
            hypothesis={cluster.hypothesis}
          />
        </TabsContent>

        {/* Tab 2: 2x2 Meal Cohort Analysis */}
        <TabsContent value="cohort" className="space-y-6 focus-visible:outline-none">
          <MealTable mealTable={detail.mealTable} />
        </TabsContent>

        {/* Tab 3: Case Roster */}
        <TabsContent value="cases" className="space-y-6 focus-visible:outline-none">
          <CaseList cases={detail.cases} />
        </TabsContent>

        {/* Tab 4: Interventions & Water Log */}
        <TabsContent value="interventions" className="space-y-6 focus-visible:outline-none">
          <InterventionsPanel
            clusterId={cluster.id}
            initialInterventions={detail.interventions}
            currentStatus={cluster.status}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
