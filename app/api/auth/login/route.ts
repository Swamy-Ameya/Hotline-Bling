import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findStudent, findStaffByEmail, getDoctors, listStaff } from '@/lib/db';
import { encodeSession, COOKIE_NAME, type Session } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, identifier, pin } = body as { role?: string; identifier?: string; pin?: string };

    if (!role || !identifier || !pin) {
      return NextResponse.json({ ok: false, error: 'Missing required credentials' }, { status: 400 });
    }

    let session: Session | null = null;

    if (role === 'student') {
      if (pin !== '1234') {
        return NextResponse.json({ ok: false, error: 'Invalid PIN for student. Use demo PIN: 1234' }, { status: 401 });
      }
      const student = findStudent(identifier);
      if (!student) {
        return NextResponse.json({ ok: false, error: `Student with ID/Registration "${identifier}" not found` }, { status: 404 });
      }
      session = {
        role: 'student',
        userId: student.id,
        name: student.name,
        identifier: student.registration,
        blockId: student.blockId,
        email: student.email,
      };
    } else if (role === 'doctor') {
      if (pin !== '4321') {
        return NextResponse.json({ ok: false, error: 'Invalid PIN for doctor. Use demo PIN: 4321' }, { status: 401 });
      }
      const staff = findStaffByEmail(identifier) ?? getDoctors()[0];
      if (!staff || staff.role !== 'doctor') {
        return NextResponse.json({ ok: false, error: 'Doctor account not found' }, { status: 404 });
      }
      session = {
        role: 'doctor',
        userId: staff.id,
        name: staff.name,
        identifier: staff.email,
        blockId: staff.blockId,
        email: staff.email,
      };
    } else if (role === 'warden') {
      if (pin !== '4321') {
        return NextResponse.json({ ok: false, error: 'Invalid PIN for warden. Use demo PIN: 4321' }, { status: 401 });
      }
      const staff = findStaffByEmail(identifier) ?? listStaff().find((s) => s.role === 'warden' || s.role === 'admin');
      if (!staff) {
        return NextResponse.json({ ok: false, error: 'Warden account not found' }, { status: 404 });
      }
      session = {
        role: 'warden',
        userId: staff.id,
        name: staff.name,
        identifier: staff.email,
        blockId: staff.blockId,
        email: staff.email,
      };
    } else {
      return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, encodeSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ ok: true, session });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
