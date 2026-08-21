'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Utensils, 
  Users, 
  Wrench
} from 'lucide-react';

interface ClusterViewProps {
  detail: ClusterDetail;
  scenarioId: ScenarioId;
  role: string;
}

export function ClusterView({ detail, scenarioId, role }: ClusterViewProps) {
  const [cluster, setCluster] = useState(detail.cluster);
  const [activeTab, setActiveTab] = useState('overview');

  const handleStatusChange = (newStatus: ClusterStatus) => {
    setCluster((prev) => ({ ...prev, status: newStatus }));
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Back + Scenario Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link href="/radar">
            <Button variant="glass" size="sm" className="gap-1.5 text-xs text-zinc-300 hover:text-white">
              <ArrowLeft className="size-3.5" />
              <span>Back to Radar</span>
            </Button>
          </Link>
          <span className="text-zinc-600">·</span>
          <span className="text-xs font-mono text-zinc-400">
            Viewing as <strong className="text-zinc-200 uppercase">{role}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {SCENARIOS.map((sc) => {
            const isCurrent = sc.id === scenarioId;
            return (
              <Link key={sc.id} href={`/radar/${sc.id}`}>
                <button
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                    isCurrent
                      ? 'bg-white text-zinc-950 border-white shadow-sm'
                      : 'text-zinc-400 border-white/10 hover:border-white/25 hover:text-zinc-200'
                  }`}
                >
                  {sc.label}
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4 Clean Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="grid grid-cols-4 w-full bg-zinc-900/80 p-1 border border-white/10 rounded-xl">
          <TabsTrigger value="overview" className="gap-1.5 text-xs font-medium rounded-lg data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:font-bold">
            <Activity className="size-3.5" />
            <span>Overview</span>
          </TabsTrigger>

          <TabsTrigger value="cohort" className="gap-1.5 text-xs font-medium rounded-lg data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:font-bold">
            <Utensils className="size-3.5" />
            <span>Food Analysis</span>
          </TabsTrigger>

          <TabsTrigger value="cases" className="gap-1.5 text-xs font-medium rounded-lg data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:font-bold">
            <Users className="size-3.5" />
            <span>Cases ({detail.cases.length})</span>
          </TabsTrigger>

          <TabsTrigger value="interventions" className="gap-1.5 text-xs font-medium rounded-lg data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:font-bold">
            <Wrench className="size-3.5" />
            <span>Actions</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview — Verdict + Permutation + Epi Curve */}
        <TabsContent value="overview" className="space-y-5 focus-visible:outline-none">
          <VerdictCard cluster={cluster} />
          <PermutationPanel permutation={detail.permutation} scenarioId={scenarioId} />
          <EpiCurveChart epiCurve={detail.epiCurve} hypothesis={cluster.hypothesis} />
        </TabsContent>

        {/* Tab 2: 2×2 Meal Cohort */}
        <TabsContent value="cohort" className="space-y-5 focus-visible:outline-none">
          <MealTable mealTable={detail.mealTable} />
        </TabsContent>

        {/* Tab 3: Case Roster */}
        <TabsContent value="cases" className="space-y-5 focus-visible:outline-none">
          <CaseList cases={detail.cases} />
        </TabsContent>

        {/* Tab 4: Interventions & Logs */}
        <TabsContent value="interventions" className="space-y-5 focus-visible:outline-none">
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
