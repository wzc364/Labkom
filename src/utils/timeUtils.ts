import { DayOfWeek, Period, Booking, Facility } from '../types/schedule';

export const INDONESIAN_DAYS: Record<number, DayOfWeek> = {
  0: 'Minggu' as DayOfWeek, // Sunday, though typical school days are Mon-Sat
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function getIndonesianDay(date: Date): DayOfWeek {
  const dayIndex = date.getDay();
  return INDONESIAN_DAYS[dayIndex] || 'Senin';
}

export function getIndonesianDayFromDateString(dateStr: string): DayOfWeek {
  if (!dateStr) return 'Senin';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return 'Senin';
  const dateObj = new Date(year, month - 1, day);
  return getIndonesianDay(dateObj);
}

export function formatDateToIndonesianShort(dateStr?: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const monthName = INDONESIAN_MONTHS[month - 1] || '';
  return `${day} ${monthName.slice(0, 3)} ${year}`;
}

export function formatIndonesianDate(date: Date): string {
  const dayName = getIndonesianDay(date);
  const day = date.getDate();
  const month = INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

export function formatTimeDigits(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getCurrentPeriod(currentTimeStr: string, periods: Period[]): Period | null {
  const curMin = timeToMinutes(currentTimeStr);
  for (const period of periods) {
    const startMin = timeToMinutes(period.startTime);
    const endMin = timeToMinutes(period.endTime);
    if (curMin >= startMin && curMin < endMin) {
      return period;
    }
  }
  return null;
}

export function getPeriodById(periods: Period[], id: number): Period | undefined {
  return periods.find((p) => p.id === id);
}

export function getJpTimeRangeLabel(startJp: number, endJp: number, periods: Period[]): string {
  const startPeriod = getPeriodById(periods, startJp);
  const endPeriod = getPeriodById(periods, endJp);
  if (!startPeriod || !endPeriod) {
    return `JP ${startJp}${endJp !== startJp ? ` - JP ${endJp}` : ''}`;
  }
  const label = startJp === endJp ? startPeriod.label : `${startPeriod.label} - ${endPeriod.label}`;
  return `${label} (${startPeriod.startTime} - ${endPeriod.endTime})`;
}

export interface FacilityLiveStatus {
  facility: Facility;
  currentBooking: Booking | null;
  currentPeriod: Period | null;
  nextBooking: Booking | null;
  nextPeriodLabel?: string;
  isOngoing: boolean;
  timeRemainingMinutes?: number;
  progressPercent?: number;
  sharedLabWarning?: string;
}

export function getFacilityLiveStatus(
  facility: Facility,
  day: DayOfWeek,
  currentTimeStr: string,
  bookings: Booking[],
  periods: Period[],
  currentDateObj?: Date
): FacilityLiveStatus {
  const curMin = timeToMinutes(currentTimeStr);
  const currentPeriod = getCurrentPeriod(currentTimeStr, periods);

  let currentDateStr: string | null = null;
  if (currentDateObj) {
    const yyyy = currentDateObj.getFullYear();
    const mm = String(currentDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDateObj.getDate()).padStart(2, '0');
    currentDateStr = `${yyyy}-${mm}-${dd}`;
  }

  // Filter bookings for this facility on this specific date (single-instance date)
  const dayFacilityBookings = bookings.filter((b) => {
    if (b.facility !== facility) return false;
    if (b.bookingDate && currentDateStr) {
      return b.bookingDate === currentDateStr;
    }
    return b.day === day;
  });

  let currentBooking: Booking | null = null;
  let nextBooking: Booking | null = null;
  let minDiffToNext = Infinity;
  let timeRemainingMinutes: number | undefined;
  let progressPercent: number | undefined;

  for (const booking of dayFacilityBookings) {
    const startP = getPeriodById(periods, booking.startJp);
    const endP = getPeriodById(periods, booking.endJp);
    if (!startP || !endP) continue;

    const startMin = timeToMinutes(startP.startTime);
    const endMin = timeToMinutes(endP.endTime);

    // Check if active right now
    if (curMin >= startMin && curMin < endMin) {
      currentBooking = booking;
      const totalDuration = endMin - startMin;
      const elapsed = curMin - startMin;
      timeRemainingMinutes = endMin - curMin;
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    } else if (startMin > curMin) {
      // Future booking today
      const diff = startMin - curMin;
      if (diff < minDiffToNext) {
        minDiffToNext = diff;
        nextBooking = booking;
      }
    }
  }

  let nextPeriodLabel: string | undefined;
  if (nextBooking) {
    nextPeriodLabel = getJpTimeRangeLabel(nextBooking.startJp, nextBooking.endJp, periods);
  }

  // Co-location warning is no longer applicable as LABKOM 1 and PID are merged into LABKOM 1 PID
  const sharedLabWarning: string | undefined = undefined;

  return {
    facility,
    currentBooking,
    currentPeriod,
    nextBooking,
    nextPeriodLabel,
    isOngoing: !!currentBooking,
    timeRemainingMinutes,
    progressPercent,
    sharedLabWarning,
  };
}

export function isJpOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return !(end1 < start2 || start1 > end2);
}
