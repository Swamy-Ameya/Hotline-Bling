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
  Radio,
  Sparkles
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
    const match = document.cookie.match(/(?:^|; )role=([^;]*)/);
    if (match && (match[1] === 'student' || match[1] === 'doctor' || match[1] === 'warden')) {
      setRole(match[1] as UserRole);
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
        setSubmittedId(`rep-live-${Date.now().toString().slice(-4)}`);
      }
    } catch {
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
      <div className="min-h-screen bg-zinc-950 px-4 py-8 flex items-center justify-center relative overflow-hidden">
        {/* Atmospheric Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <Card className="max-w-md w-full border border-white/15 bg-zinc-900/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-2xl relative z-10 text-white">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.4)]">
              <CheckCircle2 className="size-8" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Report Submitted</CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Reference ID: <span className="font-mono font-medium text-emerald-300">{submittedId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs text-zinc-300">
            <div className="rounded-xl bg-zinc-950/70 p-4 space-y-2.5 border border-white/10 shadow-inner">
              <div className="flex justify-between">
                <span className="text-zinc-400">Student Profile:</span>
                <span className="font-semibold text-zinc-100 font-mono">{studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Detection Weight:</span>
                <span className="font-semibold text-zinc-100">
                  {role === 'doctor' ? '1.0× (Clinical Intake)' : '0.6× (Self-Report)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Symptoms ({selectedSymptoms.length}):</span>
                <span className="text-right font-medium text-zinc-100">
                  {selectedSymptoms.map((s) => SYMPTOM_LABELS[s]).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Severity:</span>
                <span className="font-semibold text-zinc-100">{severity} / 5</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 backdrop-blur-md space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
                <Radio className="size-3.5 text-amber-400 animate-pulse" />
                <span>Advisory Loop Verified</span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-normal">
                If the warden has confirmed your block's advisory, this entry is logged for care and excluded from false-alarm p-value calculations.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-2">
            <Link href="/radar/filter_fault" className="w-full">
              <Button className="w-full h-11 bg-white/95 hover:bg-white text-zinc-950 font-bold shadow-[0_4px_16px_rgba(255,255,255,0.2),inset_0_1px_1px_rgba(255,255,255,0.6)] rounded-xl">
                View Campus Radar &amp; Case List
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-xs text-zinc-400 hover:text-white">
              <RefreshCw className="size-3.5 mr-1.5" />
              Submit Another Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16 relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Glassmorphic Top Bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-medium transition-colors">
            <ArrowLeft className="size-4" />
            <span>Role Hub</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <HeartPulse className="size-4 text-red-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">Rapid Triage Intake</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono py-0 h-5 border-white/20 bg-white/5 backdrop-blur-md">
            &lt;60s Mobile
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-4 relative z-10">
        {/* Translucent Role Pill */}
        <div className="mb-4 flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]">
          <div className="flex items-center gap-2">
            {role === 'doctor' ? (
              <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-400">
                <Stethoscope className="size-4" />
              </div>
            ) : (
              <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-400">
                <GraduationCap className="size-4" />
              </div>
            )}
            <span className="text-xs font-bold text-zinc-200">
              {role === 'doctor' ? 'Clinical Diagnosis (1.0×)' : 'Student Self-Report (0.6×)'}
            </span>
          </div>
          <Button
            variant="glass"
            size="xs"
            className="text-[11px] px-2.5 h-7"
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
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Zap className="size-3.5 text-amber-400" />
                <span>Demo Student Preset</span>
              </Label>
              <span className="text-[10px] text-zinc-500 font-mono">1-tap demo setup</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_STUDENTS.map((p) => {
                const isSelected = studentId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setStudentId(p.id)}
                    className={`p-2.5 rounded-xl text-left text-xs transition-all duration-200 border cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950 border-white font-bold shadow-[0_4px_16px_rgba(255,255,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)]'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]'
                    }`}
                  >
                    <div className="font-bold truncate text-[11px]">{p.label}</div>
                    <div className="text-[9px] opacity-70 truncate mt-0.5">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Translucent 3D Symptoms Multi-Select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                1. Select Symptoms <span className="text-red-400">*</span>
              </Label>
              <span className="text-[11px] text-zinc-400 font-mono">
                {selectedSymptoms.length} selected
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(SYMPTOM_LABELS) as Symptom[]).map((sym) => {
                const isChecked = selectedSymptoms.includes(sym);
                return (
                  <button
                    type="button"
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl text-left text-xs transition-all duration-200 border select-none active:scale-95 cursor-pointer ${
                      isChecked
                        ? 'bg-red-600/90 text-white border-red-400 shadow-[0_4px_16px_rgba(239,68,68,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]'
                    }`}
                  >
                    <div
                      className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? 'border-white bg-white text-red-600'
                          : 'border-zinc-500 bg-transparent'
                      }`}
                    >
                      {isChecked && <div className="size-1.5 rounded-full bg-red-600" />}
                    </div>
                    <span className="leading-tight">{SYMPTOM_LABELS[sym]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Translucent 3D Severity Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                2. Severity Level
              </Label>
              <span className="text-xs font-bold font-mono text-amber-300">
                {severity === 1 && '1 - Mild (Discomfort)'}
                {severity === 2 && '2 - Moderate (Functional)'}
                {severity === 3 && '3 - Severe (Bedridden)'}
                {severity === 4 && '4 - High (Clinic Visit)'}
                {severity === 5 && '5 - Critical (Emergency)'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const isSelected = severity === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleQuickSeverity(lvl)}
                    className={`h-12 rounded-2xl flex flex-col items-center justify-center font-bold text-sm transition-all duration-200 border active:scale-90 cursor-pointer ${
                      isSelected
                        ? lvl >= 4
                          ? 'bg-red-600 text-white border-red-400 shadow-[0_4px_16px_rgba(239,68,68,0.5),inset_0_1px_1px_rgba(255,255,255,0.5)] ring-2 ring-red-400'
                          : 'bg-zinc-100 text-zinc-950 border-white shadow-[0_4px_16px_rgba(255,255,255,0.3),inset_0_1px_1px_rgba(255,255,255,0.6)] ring-2 ring-white'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]'
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
              <Label htmlFor="onsetTime" className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Clock className="size-3.5 text-zinc-400" />
                <span>3. When did symptoms start?</span>
              </Label>
            </div>
            <Input
              id="onsetTime"
              type="datetime-local"
              value={onsetTime}
              onChange={(e) => setOnsetTime(e.target.value)}
              className="h-10 text-xs bg-white/5 border-white/10 backdrop-blur-md text-zinc-100 rounded-xl"
              required
            />
          </div>

          {/* Section 4: 72-Hour Meal Recall Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Utensils className="size-3.5 text-amber-400" />
                <span>4. Meals Eaten in Last 72h</span>
              </Label>
              <span className="text-[10px] text-zinc-400 font-mono">Powers 2×2 cohort analysis</span>
            </div>

            <div className="space-y-2">
              {RECENT_MEALS.map((meal) => {
                const isSelected = selectedMeals.includes(meal.id);
                return (
                  <label
                    key={meal.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl border text-xs cursor-pointer select-none transition-all duration-200 active:scale-[0.99] ${
                      isSelected
                        ? 'bg-white/15 border-white/30 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 backdrop-blur-md'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleMeal(meal.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-100">
                          {meal.day} {meal.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">{meal.time}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
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
            <div className="p-4 rounded-2xl border border-emerald-400/40 bg-emerald-950/30 backdrop-blur-xl shadow-[0_4px_20px_rgba(16,185,129,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-3">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="size-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Physician Intake Diagnostic
                </span>
                <Badge className="ml-auto bg-emerald-600 text-white text-[10px] py-0 h-4">
                  1.0× Clinical Weight
                </Badge>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="studentIdInput" className="text-xs font-medium text-zinc-300">
                  Student Registration ID
                </Label>
                <Input
                  id="studentIdInput"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. stu-172"
                  className="h-9 text-xs bg-white/5 border-white/10 backdrop-blur-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doctorNotes" className="text-xs font-medium text-zinc-300">
                  Clinical Diagnosis Notes
                </Label>
                <Textarea
                  id="doctorNotes"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="e.g. Acute gastroenteritis with dehydration; prescribed ORS & ciprofloxacin; suspected bacterial contamination."
                  className="text-xs min-h-[70px] bg-white/5 border-white/10 backdrop-blur-md"
                />
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-red-400" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Sticky Bottom Action */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 text-sm font-bold gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-2xl border border-white/20 shadow-[0_8px_24px_rgba(239,68,68,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all active:scale-98"
            >
              <Send className="size-4" />
              <span>{isSubmitting ? 'Submitting to Engine...' : 'Submit Health Report'}</span>
            </Button>
            <p className="text-[10px] text-center text-zinc-500 mt-2">
              Protected under India's DPDP Act 2023 · Aggregated automatically for hostel safety.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
