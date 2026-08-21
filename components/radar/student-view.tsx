'use client';

import React, { useState } from 'react';
import type { DetectionResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Building,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  Utensils,
  ShieldCheck,
  BellRing,
  Info,
  Clock,
} from 'lucide-react';

interface StudentViewProps {
  result: DetectionResult;
}

const DEMO_STUDENTS = [
  { id: '1', name: 'Sahil Sharma', regNo: '229301412', block: 'Block B', floor: 'Floor 3', room: 'B-314' },
  { id: '2', name: 'Aditya Verma', regNo: '229301108', block: 'Block A', floor: 'Floor 2', room: 'A-204' },
  { id: '3', name: 'Aadi Jain', regNo: '229301890', block: 'Block C', floor: 'Floor 1', room: 'C-108' },
  { id: '4', name: 'Rohan Gupta', regNo: '229301554', block: 'Block D', floor: 'Floor 4', room: 'D-412' },
];

const SYMPTOMS = [
  { id: 'nausea', label: '🤢 Nausea / Uneasiness' },
  { id: 'cramps', label: '⚡ Stomach Cramps' },
  { id: 'vomiting', label: '🤮 Vomiting' },
  { id: 'diarrhea', label: '💧 Loose Motion' },
  { id: 'fever', label: '🌡️ Mild Fever' },
  { id: 'fatigue', label: '💤 Weakness / Chills' },
];

const MEALS_TODAY = [
  { id: 'bf', label: 'Breakfast (Poha & Milk)', time: '8:00 AM - 10:00 AM' },
  { id: 'lunch', label: 'Lunch (Paneer & Rice)', time: '12:30 PM - 2:30 PM' },
  { id: 'dinner', label: 'Dinner (Dal Tadka & Roti)', time: '7:30 PM - 9:30 PM' },
];

export function StudentView({ result }: StudentViewProps) {
  const [selectedStudent, setSelectedStudent] = useState(DEMO_STUDENTS[0]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<string[]>(['lunch']);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBlockBAffected = result.topCluster?.nodeId === 'filter-B3A' || result.topCluster?.nodeId === 'tank-B';
  const isFoodOutbreak = result.topCluster?.hypothesis === 'food';

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleMeal = (id: string) => {
    setSelectedMeals((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) return;

    setIsSubmitting(true);
    // Simulate instant report intake
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Student Profile & Quick Switcher Card */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{selectedStudent.name}</h3>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Reg: {selectedStudent.regNo}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-zinc-400" />
                <strong>{selectedStudent.block}</strong> · {selectedStudent.floor} · Room {selectedStudent.room}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium hidden sm:inline">Switch Demo Profile:</span>
            <select
              value={selectedStudent.id}
              onChange={(e) => {
                const s = DEMO_STUDENTS.find((st) => st.id === e.target.value);
                if (s) {
                  setSelectedStudent(s);
                  setIsSubmitted(false);
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {DEMO_STUDENTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.block} - {s.room})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Active Precautionary Advisory for This Student */}
      {isBlockBAffected && selectedStudent.block === 'Block B' ? (
        <div className="p-4 rounded-xl border border-red-500/50 bg-red-500/10 dark:bg-red-950/40 text-red-900 dark:text-red-200 flex items-start gap-3 animate-in fade-in duration-300">
          <BellRing className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded text-[10px]">
                Active Health Advisory
              </span>
              <span className="text-xs font-semibold text-red-700 dark:text-red-300">Targeted: Block B Residents</span>
            </div>
            <p className="text-xs font-medium leading-relaxed">
              Elevated stomach upsets detected in <strong>Block B (Floor 3)</strong> over the last 24h. Please <strong>drink only boiled or packaged water</strong> while maintenance sanitizes the supply. Report early symptoms below.
            </p>
          </div>
        </div>
      ) : isFoodOutbreak ? (
        <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-start gap-3 animate-in fade-in duration-300">
          <Utensils className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded text-[10px]">
                Mess Food Advisory
              </span>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">All Hostel Blocks</span>
            </div>
            <p className="text-xs font-medium leading-relaxed">
              Campus Health Center is reviewing reports from Friday Mess Lunch. If you experienced vomiting or fever after lunch, please submit your report below to receive ORS hydration support at the clinic.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium">Your hostel block ({selectedStudent.block}) is currently <strong>All Clear (Normal Baseline)</strong>.</span>
          </div>
          <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/40">
            No Outbreak
          </Badge>
        </div>
      )}

      {/* 30-Second Fast Symptom Reporting Form */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Quick Health Self-Report (30 Seconds)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-0.5">
                Automatically stamped with your verified room: <strong>{selectedStudent.block}, {selectedStudent.room}</strong>
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] text-zinc-500 font-mono">
              DPDP Act Protected
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Report Successfully Logged!</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Thank you, {selectedStudent.name}. Your symptoms have been correlated with <strong>{selectedStudent.block}</strong> and forwarded to the campus doctor. If symptoms persist, free ORS is available at the Health Center.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSymptoms([]);
                  setIsSubmitted(false);
                }}
                className="mt-3 text-xs"
              >
                File Another Report
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Symptom Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                  1. What symptoms are you experiencing? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SYMPTOMS.map((sym) => {
                    const isChecked = selectedSymptoms.includes(sym.id);
                    return (
                      <button
                        type="button"
                        key={sym.id}
                        onClick={() => toggleSymptom(sym.id)}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                          isChecked
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/30 font-bold'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <span>{sym.label}</span>
                        {isChecked && <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meals Eaten Today */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                  2. Which meals did you eat at the Central Mess today?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {MEALS_TODAY.map((meal) => {
                    const isChecked = selectedMeals.includes(meal.id);
                    return (
                      <button
                        type="button"
                        key={meal.id}
                        onClick={() => toggleMeal(meal.id)}
                        className={`p-3 rounded-xl border text-xs text-left transition-all ${
                          isChecked
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{meal.label}</span>
                          {isChecked && <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">{meal.time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Verified Stamped Room Badge */}
              <div className="p-3 rounded-lg bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>Stamping to official hostel roster: <strong>{selectedStudent.block} · {selectedStudent.room}</strong></span>
                </div>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">100% Accurate</span>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={selectedSymptoms.length === 0 || isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Symptom Report
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
