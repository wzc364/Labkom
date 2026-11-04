import { Booking, ConflictCheckResult, Facility, Period } from '../types/schedule';
import { INITIAL_BOOKINGS, DEFAULT_PERIODS } from '../data/defaultData';
import { isJpOverlap, getJpTimeRangeLabel } from './timeUtils';

const STORAGE_KEYS = {
  BOOKINGS: 'smpn1kawali_labkom_bookings_v2',
  PERIODS: 'smpn1kawali_labkom_periods_v1',
  DISMISSED_PREVIEW_NOTICE: 'smpn1kawali_preview_notice_dismissed',
};

// Normalize legacy 'LABKOM 1' or 'PID' into 'LABKOM 1 PID'
export function normalizeFacility(fac: string): Facility {
  if (fac === 'LABKOM 1' || fac === 'PID' || fac === 'LABKOM 1 PID') {
    return 'LABKOM 1 PID';
  }
  return 'LABKOM 2';
}

export function normalizeBooking(b: any): Booking {
  return {
    ...b,
    facility: normalizeFacility(b.facility),
    bookingDate: b.bookingDate || new Date().toISOString().slice(0, 10),
    startJp: Number(b.startJp),
    endJp: Number(b.endJp),
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

export function checkBookingConflict(
  newBooking: Omit<Booking, 'id' | 'createdAt'>,
  existingBookings: Booking[],
  periods: Period[],
  excludeBookingId?: string
): ConflictCheckResult {
  const facility = normalizeFacility(newBooking.facility);
  const startJp = Number(newBooking.startJp);
  const endJp = Number(newBooking.endJp);
  const bookingDate = newBooking.bookingDate;

  // Filter out the booking itself if editing
  const otherBookings = existingBookings
    .filter((b) => !excludeBookingId || b.id !== excludeBookingId)
    .map(normalizeBooking);

  // Exact facility collision on the same specific date
  const exactConflicts = otherBookings.filter((b) => {
    if (b.facility !== facility) return false;

    const dateA = bookingDate || '';
    const dateB = b.bookingDate || '';
    if (!dateA || !dateB || dateA !== dateB) return false;

    return isJpOverlap(startJp, endJp, b.startJp, b.endJp);
  });

  if (exactConflicts.length > 0) {
    const first = exactConflicts[0];
    const timeLabel = getJpTimeRangeLabel(first.startJp, first.endJp, periods);
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
