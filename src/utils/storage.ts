import { Booking, ConflictCheckResult, Facility, Period, Teacher } from '../types/schedule';
import { INITIAL_BOOKINGS, DEFAULT_PERIODS } from '../data/defaultData';
import { isJpOverlap, getJpTimeRangeLabel, getBookingTimeRangeLabel, getBookingStartEndMinutes, isTimeOverlap } from './timeUtils';

const STORAGE_KEYS = {
  BOOKINGS: 'smpn1kawali_labkom_bookings_v2',
  PERIODS: 'smpn1kawali_labkom_periods_v1',
  TEACHERS: 'smpn1kawali_labkom_teachers_v1',
  DISMISSED_PREVIEW_NOTICE: 'smpn1kawali_preview_notice_dismissed',
};

// Normalize legacy 'LABKOM 1' or 'PID' into 'LABKOM 1 PID'
export function normalizeFacility(fac: string): Facility {
  if (fac === 'LABKOM 1' || fac === 'PID' || fac === 'LABKOM 1 PID') {
    return 'LABKOM 1 PID';
  }
  return 'LABKOM 2';
}

function normalizeJpVal(val: any, defaultVal: number): number {
  const n = Number(val);
  if (isNaN(n) || n < 0) return defaultVal;
  if (n === 206) return 6;
  if (n === 103) return 4;
  return n;
}

export function normalizeBooking(b: any): Booking {
  const timeType = b.timeType || (b.customStartTime ? 'custom' : 'jp');
  const startJp = timeType === 'custom' ? Number(b.startJp || 0) : normalizeJpVal(b.startJp, 1);
  let endJp = timeType === 'custom' ? Number(b.endJp || 0) : normalizeJpVal(b.endJp, startJp);
  if (timeType !== 'custom' && endJp < startJp) {
    endJp = startJp;
  }
  return {
    ...b,
    facility: normalizeFacility(b.facility),
    bookingDate: b.bookingDate || new Date().toISOString().slice(0, 10),
    startJp,
    endJp,
    timeType,
    customStartTime: b.customStartTime || (timeType === 'custom' ? '14:30' : undefined),
    customEndTime: b.customEndTime || (timeType === 'custom' ? '16:30' : undefined),
  };
}

export function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) {
      saveBookings([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeBooking);
    }
    return [];
  } catch (e) {
    console.error('Failed to load bookings from localStorage:', e);
    return [];
  }
}

export function saveBookings(bookings: Booking[]): void {
  try {
    const normalized = bookings.map(normalizeBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(normalized));
  } catch (e) {
    console.error('Failed to save bookings to localStorage:', e);
  }
}

export function loadPeriods(): Period[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERIODS);
    if (!raw) {
      savePeriods(DEFAULT_PERIODS);
      return DEFAULT_PERIODS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PERIODS;
  } catch (e) {
    console.error('Failed to load periods from localStorage:', e);
    return DEFAULT_PERIODS;
  }
}

export function savePeriods(periods: Period[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(periods));
  } catch (e) {
    console.error('Failed to save periods to localStorage:', e);
  }
}

export function loadTeachers(): Teacher[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load teachers from localStorage:', e);
    return [];
  }
}

export function saveTeachers(teachers: Teacher[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  } catch (e) {
    console.error('Failed to save teachers to localStorage:', e);
  }
}

export function checkBookingConflict(
  newBooking: Omit<Booking, 'id' | 'createdAt'>,
  existingBookings: Booking[],
  periods: Period[],
  excludeBookingId?: string
): ConflictCheckResult {
  const facility = normalizeFacility(newBooking.facility);
  const bookingDate = newBooking.bookingDate;

  // Filter out the booking itself if editing
  const otherBookings = existingBookings
    .filter((b) => !excludeBookingId || b.id !== excludeBookingId)
    .map(normalizeBooking);

  const newMinutes = getBookingStartEndMinutes(newBooking, periods);

  // Collision check on same facility and same date
  const exactConflicts = otherBookings.filter((b) => {
    if (b.facility !== facility) return false;

    const dateA = bookingDate || '';
    const dateB = b.bookingDate || '';
    if (!dateA || !dateB || dateA !== dateB) return false;

    // If either booking uses custom time
    if (newBooking.timeType === 'custom' || b.timeType === 'custom' || newBooking.customStartTime || b.customStartTime) {
      const bMinutes = getBookingStartEndMinutes(b, periods);
      return isTimeOverlap(newMinutes.startMin, newMinutes.endMin, bMinutes.startMin, bMinutes.endMin);
    }

    // Both are JP bookings
    const startJp = normalizeJpVal(newBooking.startJp, 1);
    const endJp = Math.max(startJp, normalizeJpVal(newBooking.endJp, startJp));
    return isJpOverlap(startJp, endJp, b.startJp, b.endJp);
  });

  if (exactConflicts.length > 0) {
    const first = exactConflicts[0];
    const timeLabel = getBookingTimeRangeLabel(first, periods);
    return {
      hasConflict: true,
      conflictType: 'EXACT_FACILITY',
      conflictingBookings: exactConflicts,
      message: `Jadwal bentrok! ${facility} sudah dipesan oleh ${first.teacherName} (Kelas ${first.className}) untuk mata pelajaran "${first.subject}" pada ${first.day}, ${timeLabel}.`,
    };
  }

  return {
    hasConflict: false,
    conflictingBookings: [],
    message: 'Jadwal tersedia dan tidak ada bentrok.',
  };
}

export function resetToDefaultData(): { bookings: Booking[]; periods: Period[] } {
  saveBookings(INITIAL_BOOKINGS);
  savePeriods(DEFAULT_PERIODS);
  return { bookings: INITIAL_BOOKINGS, periods: DEFAULT_PERIODS };
}

export function exportDataAsJson(bookings: Booking[], periods: Period[]): string {
  return JSON.stringify(
    {
      app: 'Jadwal LABKOM 1 PID & LABKOM 2 SMPN 1 Kawali',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      periods,
      bookings: bookings.map(normalizeBooking),
    },
    null,
    2
  );
}

export function importDataFromJson(
  jsonString: string
): { success: boolean; message: string; bookings?: Booking[]; periods?: Period[] } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.bookings)) {
      return { success: false, message: 'Format data JSON tidak valid: tidak ditemukan array pemesanan.' };
    }
    const bookings: Booking[] = data.bookings.map(normalizeBooking);
    const periods: Period[] = Array.isArray(data.periods) && data.periods.length > 0
      ? data.periods
      : DEFAULT_PERIODS;

    saveBookings(bookings);
    savePeriods(periods);
    return {
      success: true,
      message: `Berhasil mengimpor ${bookings.length} data pemesanan.`,
      bookings,
      periods,
    };
  } catch (err: any) {
    return { success: false, message: `Gagal membaca file JSON: ${err.message || 'Error tidak diketahui'}` };
  }
}
