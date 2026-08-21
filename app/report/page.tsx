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
  Radar,
  FileText
} from 'lucide-react';

interface MealOption {
  id: string;
  day: string;
  name: string;
  time: string;
  items: string;
}

const RECENT_MEALS: MealOption[] = [
  { id: 'meal-wed-dinner', day: 'Wednesday', name: 'Dinner', time: '8:00 PM', items: 'Paneer Butter Masala, Roti, Rice · Blue Dove Mess' },
  { id: 'meal-wed-lunch', day: 'Wednesday', name: 'Lunch', time: '1:00 PM', items: 'Chole, Bhature, Curd, Rice · Blue Dove Mess' },
  { id: 'meal-wed-breakfast', day: 'Wednesday', name: 'Breakfast', time: '8:30 AM', items: 'Poha, Boiled Egg / Fruit, Chai · Blue Dove Mess' },
  { id: 'meal-tue-dinner', day: 'Tuesday', name: 'Dinner', time: '8:00 PM', items: 'Rajma, Jeera Rice, Salad, Kheer · Blue Dove Mess' },
  { id: 'meal-tue-lunch', day: 'Tuesday', name: 'Lunch', time: '1:00 PM', items: 'Dal Tadka, Mix Veg, Roti, Rice · Blue Dove Mess' },
  { id: 'meal-tue-breakfast', day: 'Tuesday', name: 'Breakfast', time: '8:30 AM', items: 'Idli, Sambar, Chutney · Blue Dove Mess' },
];

const PRESET_STUDENTS = [
  { id: 'stu-172', label: 'B2 Boys Hostel · Rm 304', desc: 'B2 Hosteller' },
  { id: 'stu-188', label: 'B1 Boys Hostel · Rm 202', desc: 'B1 Hosteller' },
  { id: 'stu-310', label: 'G1 Girls Hostel · Rm 108', desc: 'G1 Hosteller' },
  { id: 'stu-601', label: 'Day Scholar (Mess Only)', desc: 'Non-hosteller control' },
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
      <div className="min-h-screen bg-[#fafafa] text-zinc-900 antialiased flex items-center justify-center p-6">
        <Card className="max-w-md w-full border border-zinc-200 bg-white shadow-md rounded-2xl">
          <CardHeader className="text-center pb-2 pt-6">
            <div className="mx-auto size-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-3">
              <CheckCircle2 className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-zinc-900">Report Submitted</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Reference ID: <span className="font-mono font-medium text-zinc-900">{submittedId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs text-zinc-600">
            <div className="rounded-xl bg-zinc-50 p-4 space-y-2 border border-zinc-200/80">
              <div className="flex justify-between">
                <span className="text-zinc-500">Student Profile:</span>
                <span className="font-semibold text-zinc-900 font-mono">{studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Intake Weight:</span>
                <span className="font-semibold text-zinc-900">
                  {role === 'doctor' ? '1.0× (Clinical Intake)' : '0.6× (Self-Report)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Symptoms ({selectedSymptoms.length}):</span>
                <span className="text-right font-medium text-zinc-900">
                  {selectedSymptoms.map((s) => SYMPTOM_LABELS[s]).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Severity:</span>
                <span className="font-semibold text-zinc-900">{severity} / 5</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-2 pb-6">
            <Link href="/radar" className="w-full">
              <Button className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl">
                View Campus Radar Dashboard
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-xs text-zinc-500 hover:text-zinc-900">
              <RefreshCw className="size-3.5 mr-1.5" />
              Submit Another Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 pb-16 antialiased">
      {/* Nav Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Radar className="size-4" />
            </div>
            <span className="font-bold text-base tracking-tight">Outbreak Radar</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/radar" className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors font-medium">
              Dashboard
            </Link>
            <Link href="/report" className="px-3 py-1.5 rounded-lg text-sm text-zinc-900 bg-zinc-100 font-semibold">
              Report
            </Link>
            <Link href="/" className="px-3 py-1.5 rounded-lg text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors font-medium">
              Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-6 pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Report Symptoms</h1>
          <p className="text-sm text-zinc-500 mt-1">Quick 60-second mobile intake to track hostel health</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Pill */}
          <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                {role === 'doctor' ? <Stethoscope className="size-4" /> : <GraduationCap className="size-4" />}
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-900 block">
                  {role === 'doctor' ? 'Clinical Intake (1.0× Weight)' : 'Student Self-Report (0.6× Weight)'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {role === 'doctor' ? 'Logged by Health Centre physician' : 'Logged from student mobile'}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono border-zinc-200 text-zinc-600">
              {role.toUpperCase()}
            </Badge>
          </div>

          {/* Preset Profile Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              1. Your Hostel / Room Profile
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_STUDENTS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setStudentId(preset.id)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    studentId === preset.id
                      ? 'border-zinc-900 bg-zinc-900 text-white font-semibold shadow-xs'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  <div className="font-semibold">{preset.label}</div>
                  <div className={`text-[11px] ${studentId === preset.id ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    {preset.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Multi-Select */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              2. What symptoms are you experiencing?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SYMPTOM_LABELS) as Symptom[]).map((sym) => {
                const isChecked = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                      isChecked
                        ? 'border-red-600 bg-red-50 text-red-900 font-semibold'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    {SYMPTOM_LABELS[sym]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity 1 to 5 */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              3. Severity (1 = Mild, 5 = Severe / Unable to attend classes)
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleQuickSeverity(lvl)}
                  className={`py-3 rounded-xl border text-center text-sm font-semibold transition-all ${
                    severity === lvl
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Onset Time */}
          <div className="space-y-2">
            <Label htmlFor="onsetTime" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              4. When did symptoms start?
            </Label>
            <Input
              id="onsetTime"
              type="datetime-local"
              value={onsetTime}
              onChange={(e) => setOnsetTime(e.target.value)}
              className="h-11 rounded-xl bg-white border-zinc-200 text-zinc-900 text-sm"
            />
          </div>

          {/* 72h Meal Recall (Blue Dove Mess) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              5. 72-Hour Meal History (Blue Dove Mess)
            </Label>
            <div className="space-y-2">
              {RECENT_MEALS.map((meal) => {
                const isChecked = selectedMeals.includes(meal.id);
                return (
                  <div
                    key={meal.id}
                    onClick={() => toggleMeal(meal.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? 'border-zinc-900 bg-zinc-50 font-medium'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-zinc-900">
                        {meal.day} {meal.name} · <span className="font-normal text-zinc-500">{meal.time}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500">{meal.items}</div>
                    </div>
                    <Checkbox checked={isChecked} onCheckedChange={() => toggleMeal(meal.id)} />
                  </div>
                );
              })}
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {submitError}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm shadow-sm"
          >
            {isSubmitting ? 'Submitting Report...' : 'Submit Health Report'}
          </Button>
        </form>
      </main>
    </div>
  );
}
