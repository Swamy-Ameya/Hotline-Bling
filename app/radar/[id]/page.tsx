import React from 'react';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { clusterDetailFixture, fixtureFor } from '@/lib/detect/fixture';
import { ScenarioId, UserRole } from '@/lib/types';
import { ClusterView } from './cluster-view';
import { QuietView } from './quiet-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClusterDetailPage({ params }: PageProps) {
  // Next.js 16: params is a Promise that must be awaited
  const { id } = await params;

  // Next.js 16: cookies() returns a Promise that must be awaited
  const cookieStore = await cookies();
  const role = (cookieStore.get('role')?.value as UserRole) || 'warden';

  // Map route param to ScenarioId
  let scenarioId: ScenarioId = 'filter_fault';

  if (id === 'quiet' || id === 'filter_fault' || id === 'food' || id === 'coincidence') {
    scenarioId = id;
  } else if (id === 'cluster-filter-3a') {
    scenarioId = 'filter_fault';
  } else if (id === 'cluster-tue-dinner') {
    scenarioId = 'food';
  } else if (id === 'cluster-block-a-chance') {
    scenarioId = 'coincidence';
  }

  // Handle Quiet Baseline Scenario deliberately
  if (scenarioId === 'quiet') {
    const quietResult = fixtureFor('quiet');
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <main className="max-w-7xl mx-auto px-6 py-8">
          <QuietView detectionResult={quietResult} />
        </main>
      </div>
    );
  }

  // Load cluster detail fixture
  const detail = clusterDetailFixture(scenarioId);

  if (!detail) {
    // If not found or empty, render quiet baseline view
    const detectionResult = fixtureFor(scenarioId);
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <main className="max-w-7xl mx-auto px-6 py-8">
          <QuietView detectionResult={detectionResult} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <ClusterView
          detail={detail}
          scenarioId={scenarioId}
          role={role}
        />
      </main>
    </div>
  );
}
