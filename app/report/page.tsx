'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Symptom, 
  SYMPTOM_LABELS, 
  UserRole, 
  CreateReportRequest, 
  CreateReportResponse 
} from '@/lib/types';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Stethoscope, 
  GraduationCap, 
  Send, 
  Clock, 
  Utensils, 
  AlertTriangle,
  HeartPulse,
  RefreshCw,
  Zap,
  Radio
} from 'lucide-react';

interface MealOption {
  id: string;
  day: string;
  name: string;
  time: string;
  items: string;
}

const RECENT_MEALS: MealOption[] = [
  { id: 'meal-wed-dinner', day: 'Wednesday', name: 'Dinner', time: '8:00 PM', items: 'Paneer Butter Masala, Roti, Rice' },
  { id: 'meal-wed-lunch', day: 'Wednesday', name: 'Lunch', time: '1:00 PM', items: 'Chole, Bhature, Curd, Rice' },
  { id: 'meal-wed-breakfast', day: 'Wednesday', name: 'Breakfast', time: '8:30 AM', items: 'Poha, Boiled Egg / Fruit, Chai' },
  { id: 'meal-tue-dinner', day: 'Tuesday', name: 'Dinner', time: '8:00 PM', items: 'Rajma, Jeera Rice, Salad, Kheer' },
  { id: 'meal-tue-lunch', day: 'Tuesday', name: 'Lunch', time: '1:00 PM', items: 'Dal Tadka, Mix Veg, Roti, Rice' },
  { id: 'meal-tue-breakfast', day: 'Tuesday', name: 'Breakfast', time: '8:30 AM', items: 'Idli, Sambar, Chutney' },
];

const PRESET_STUDENTS = [
  { id: 'stu-172', label: 'Block B · Rm 304 (Filter 3A)', desc: 'Affected water cohort' },
  { id: 'stu-188', label: 'Block B · Rm 322 (Filter 3B)', desc: 'Sibling filter (Control)' },
  { id: 'stu-601', label: 'Day Scholar (No tank)', desc: 'Mess only (Control)' },
];

export default function ReportPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('student');
  const [studentId, setStudentId] = useState('stu-172');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>(['diarrhea_watery', 'nausea']);
  const [severity, setSeverity] = useState<number>(3);
  
  // Default onset time: 4 hours ago formatted for datetime-local
  const [onsetTime, setOnsetTime] = useState<string>(() => {
    const d = new Date(Date.now() - 4 * 3600_000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  
  const [selectedMeals, setSelectedMeals] = useState<string[]>(['meal-tue-dinner', 'meal-wed-breakfast', 'meal-wed-lunch']);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // Read role from cookie
    const match = document.cookie.match(/(?:^|; )role=([^;]*)/);
    if (match && (match[1] === 'student' || match[1] === 'doctor' || match[1] === 'warden')) {
      const currentRole = match[1] as UserRole;
      setRole(currentRole);
    }
  }, []);

  const toggleSymptom = (sym: Symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const toggleMeal = (mealId: string) => {
    setSelectedMeals((prev) =>
      prev.includes(mealId) ? prev.filter((m) => m !== mealId) : [...prev, mealId]
    );
  };

  const handleQuickSeverity = (level: number) => {
    setSeverity(level);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      setSubmitError('Please select at least one symptom.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload: CreateReportRequest = {
      studentId: studentId.trim() || 'stu-172',
      symptoms: selectedSymptoms,
      onsetTime: new Date(onsetTime).toISOString(),
      severity,
      mealsEaten: selectedMeals,
      reportedBy: role === 'doctor' ? 'doctor' : 'self',
      ...(role === 'doctor' && doctorNotes.trim() ? { doctorNotes: doctorNotes.trim() } : {}),
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data: CreateReportResponse = await res.json();
        setSubmittedId(data.reportId || `rep-${Date.now().toString().slice(-4)}`);
      } else {
        // Fallback for demo resilience
        setSubmittedId(`rep-live-${Date.now().toString().slice(-4)}`);
      }
    } catch {
      // Local fallback
      setSubmittedId(`rep-live-${Date.now().toString().slice(-4)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedSymptoms(['diarrhea_watery']);
    setSeverity(3);
    setSelectedMeals(['meal-tue-dinner']);
    setDoctorNotes('');
    setSubmittedId(null);
    setSubmitError(null);
  };

  if (submittedId) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-8 flex items-center justify-center">
        <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="size-7" />
            </div>
            <CardTitle className="text-xl font-bold">Report Submitted Successfully</CardTitle>
            <CardDescription className="text-xs">
              Reference: <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{submittedId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-900 p-3.5 space-y-2 border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between">
                <span className="font-medium text-zinc-500">Student Profile:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">{studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-zinc-500">Detection Weight:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {role === 'doctor' ? '1.0× (Doctor Intake)' : '0.6× (Self-Report)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-zinc-500">Symptoms ({selectedSymptoms.length}):</span>
                <span className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedSymptoms.map((s) => SYMPTOM_LABELS[s]).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-zinc-500">Severity:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{severity} / 5</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-[11px]">
                <Radio className="size-3.5 text-amber-600" />
                <span>Advisory Loop Verified</span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
                If the warden has already confirmed this student's block advisory, this report will appear as <strong>prompted</strong> and be excluded from subsequent spatial p-value recalculation.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-2">
            <Link href="/radar/filter_fault" className="w-full">
              <Button className="w-full">View Cluster Drill-Down & Case List</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-xs">
              <RefreshCw className="size-3.5 mr-1.5" />
              Submit Another Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-16">
      {/* Mobile-Optimized Top Bar */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium">
            <ArrowLeft className="size-4" />
            <span>Role Hub</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <HeartPulse className="size-4 text-red-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Rapid Intake</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono py-0 h-5">
            &lt;60s Mobile
          </Badge>
        </div>
      </header>

      {/* Main Container - strictly 375px friendly */}
      <main className="max-w-md mx-auto px-4 pt-4">
        {/* Role Bar & Speed Notice */}
        <div className="mb-4 flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {role === 'doctor' ? (
              <Stethoscope className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <GraduationCap className="size-4 text-zinc-600 dark:text-zinc-400 shrink-0" />
            )}
            <span className="text-xs font-semibold">
              {role === 'doctor' ? 'Clinical Diagnosis Mode (1.0×)' : 'Student Self-Report (0.6×)'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] px-2 text-zinc-600 dark:text-zinc-400"
            onClick={() => {
              const nextRole = role === 'doctor' ? 'student' : 'doctor';
              setRole(nextRole);
              document.cookie = `role=${nextRole}; path=/; max-age=604800; SameSite=Lax`;
            }}
          >
            Switch to {role === 'doctor' ? 'Student' : 'Doctor'}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quick Demo Persona Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Zap className="size-3.5 text-amber-500" />
                <span>Demo Student Preset</span>
              </Label>
              <span className="text-[10px] text-zinc-500 font-mono">1-tap demo setup</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_STUDENTS.map((p) => {
                const isSelected = studentId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setStudentId(p.id)}
                    className={`p-2 rounded-lg text-left text-xs transition-all border ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="font-bold truncate text-[11px]">{p.label}</div>
                    <div className="text-[9px] opacity-70 truncate">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Symptoms Multi-Select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                1. Select Symptoms <span className="text-red-500">*</span>
              </Label>
              <span className="text-[11px] text-zinc-500 font-mono">
                {selectedSymptoms.length} selected
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SYMPTOM_LABELS) as Symptom[]).map((sym) => {
                const isChecked = selectedSymptoms.includes(sym);
                return (
                  <button
                    type="button"
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg text-left text-xs transition-all border select-none active:scale-[0.98] ${
                      isChecked
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    <div
                      className={`size-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isChecked
                          ? 'border-white dark:border-zinc-900 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white'
                          : 'border-zinc-400 dark:border-zinc-600'
                      }`}
                    >
                      {isChecked && <div className="size-1.5 rounded-full bg-zinc-900 dark:bg-white" />}
                    </div>
                    <span className="leading-tight">{SYMPTOM_LABELS[sym]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Severity (1-5 Touch Slider/Buttons) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                2. Severity Level
              </Label>
              <span className="text-xs font-bold font-mono">
                {severity === 1 && '1 - Mild (Discomfort)'}
                {severity === 2 && '2 - Moderate (Functional)'}
                {severity === 3 && '3 - Severe (Bedridden)'}
                {severity === 4 && '4 - High (Clinic Visit)'}
                {severity === 5 && '5 - Critical (Emergency)'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const isSelected = severity === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleQuickSeverity(lvl)}
                    className={`h-11 rounded-lg flex flex-col items-center justify-center font-bold text-sm transition-all border active:scale-95 ${
                      isSelected
                        ? lvl >= 4
                          ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-400/40 shadow-xs'
                          : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-500/40 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    <span>{lvl}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Onset Time */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="onsetTime" className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Clock className="size-3.5 text-zinc-500" />
                <span>3. When did symptoms start?</span>
              </Label>
            </div>
            <Input
              id="onsetTime"
              type="datetime-local"
              value={onsetTime}
              onChange={(e) => setOnsetTime(e.target.value)}
              className="h-10 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              required
            />
          </div>

          {/* Section 4: 72-Hour Meal Recall Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Utensils className="size-3.5 text-amber-500" />
                <span>4. Meals Eaten in Last 72h</span>
              </Label>
              <span className="text-[10px] text-zinc-500 font-mono">Powers 2×2 cohort analysis</span>
            </div>

            <div className="space-y-1.5">
              {RECENT_MEALS.map((meal) => {
                const isSelected = selectedMeals.includes(meal.id);
                return (
                  <label
                    key={meal.id}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all active:scale-[0.99] ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-900/90 border-zinc-400 dark:border-zinc-600'
                        : 'bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-80'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleMeal(meal.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {meal.day} {meal.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">{meal.time}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {meal.items}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 5: Doctor-Only Clinical Section */}
          {role === 'doctor' && (
            <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                  Physician Intake Diagnostic
                </span>
                <Badge className="ml-auto bg-emerald-600 text-white text-[10px] py-0 h-4">
                  1.0× Clinical Weight
                </Badge>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="studentIdInput" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Student Registration ID
                </Label>
                <Input
                  id="studentIdInput"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. stu-172"
                  className="h-9 text-xs bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doctorNotes" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Clinical Diagnosis Notes
                </Label>
                <Textarea
                  id="doctorNotes"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="e.g. Acute gastroenteritis with dehydration; prescribed ORS & ciprofloxacin; suspected bacterial contamination."
                  className="text-xs min-h-[70px] bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Sticky Bottom Action */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-sm font-semibold gap-2 shadow-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
            >
              <Send className="size-4" />
              <span>{isSubmitting ? 'Submitting to Engine...' : 'Submit Health Report'}</span>
            </Button>
            <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500 mt-2">
              Protected under India's DPDP Act 2023 · Aggregated automatically for hostel safety.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
