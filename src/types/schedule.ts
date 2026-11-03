export type Facility = 'LABKOM 1 PID' | 'LABKOM 2';

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export interface Period {
  id: number;
  label: string; // e.g. "JP 1", "JP 2"
  startTime: string; // "HH:MM" e.g. "07:20"
  endTime: string; // "HH:MM" e.g. "08:00"
  isBreak?: boolean;
}

export interface DayScheduleConfig {
  day: DayOfWeek;
  totalHours: number; // e.g. 8
  periods: Period[];
  updatedAt?: string;
}

export interface Booking {
  id: string;
  teacherName: string;
  subject: string;
  className: string;
  facility: Facility;
  day: DayOfWeek;
  bookingDate?: string; // "YYYY-MM-DD" e.g. "2026-11-02"
  startJp: number; // e.g. 1
  endJp: number; // e.g. 2
  notes?: string;
  createdAt: string;
  sharedLabAcknowledgment?: boolean;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType?: 'EXACT_FACILITY' | 'COLOCATION_SHARED';
  conflictingBookings: Booking[];
  message: string;
}

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  subject: string;
  createdAt?: string;
}

export interface UserSession {
  role: 'admin' | 'guru';
  name: string;
  username: string; // NIP for teachers, 'ega' for admin
  teacherId?: string;
  nip?: string;
  subject?: string;
}

export interface GalleryImage {
  id: string;
  title?: string;
  imageUrl: string;
  description?: string;
  createdAt: string;
}


