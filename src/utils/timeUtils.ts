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

export function getJpNumber(p: Period, indexInTeaching?: number): number {
  if (p.label) {
    const match = p.label.match(/JP\s*(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  if (p.id === 206) return 6;
  if (p.id === 103) return 4;
  if (p.id > 0 && p.id < 50) return p.id;
  return indexInTeaching !== undefined ? indexInTeaching + 1 : p.id;
}

export function getPeriodById(periods: Period[], idOrJp: number): Period | undefined {
  if (!periods || periods.length === 0) return undefined;

  // 1. Exact match on id
  const exact = periods.find((p) => p.id === idOrJp);
  if (exact) return exact;

  // 2. Match by JP number from label e.g. "JP 6"
  const byLabel = periods.find((p) => {
    if (p.isBreak) return false;
    const match = p.label.match(/JP\s*(\d+)/i);
    return match && parseInt(match[1], 10) === idOrJp;
  });
  if (byLabel) return byLabel;

  // 3. Handle legacy swapped IDs (206 -> 6, 103 -> 4)
  if (idOrJp === 206) return getPeriodById(periods, 6);
  if (idOrJp === 103) return getPeriodById(periods, 4);

  // 4. Fallback to index among non-break periods (1-indexed)
  const teaching = periods.filter((p) => !p.isBreak);
  if (idOrJp >= 1 && idOrJp <= teaching.length) {
    return teaching[idOrJp - 1];
  }

  return undefined;
}

export function getJpTimeRangeLabel(startJp: number, endJp: number, periods: Period[]): string {
  const normStart = startJp === 206 ? 6 : (startJp === 103 ? 4 : startJp);
  const normEnd = endJp === 206 ? 6 : (endJp === 103 ? 4 : endJp);

  const startPeriod = getPeriodById(periods, normStart);
  const endPeriod = getPeriodById(periods, normEnd);
  if (!startPeriod || !endPeriod) {
    return `JP ${normStart}${normEnd !== normStart ? ` - JP ${normEnd}` : ''}`;
  }
  const startLabel = startPeriod.label.startsWith('JP') ? startPeriod.label : `JP ${normStart}`;
  const endLabel = endPeriod.label.startsWith('JP') ? endPeriod.label : `JP ${normEnd}`;
  const label = normStart === normEnd ? startLabel : `${startLabel} - ${endLabel}`;
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

export function getBookingTimeRangeLabel(
  booking: {
    startJp?: number;
    endJp?: number;
    timeType?: 'jp' | 'custom' | string;
    customStartTime?: string;
    customEndTime?: string;
  },
  periods: Period[]
): string {
  if (booking.timeType === 'custom' || (booking.customStartTime && booking.customEndTime)) {
    return `Pukul ${booking.customStartTime} - ${booking.customEndTime} WIB (Di Luar Jam)`;
  }
  const startJp = booking.startJp ?? 1;
  const endJp = booking.endJp ?? startJp;
  return getJpTimeRangeLabel(startJp, endJp, periods);
}

export function getBookingStartEndMinutes(
  booking: {
    startJp?: number;
    endJp?: number;
    timeType?: 'jp' | 'custom' | string;
    customStartTime?: string;
    customEndTime?: string;
  },
  periods: Period[]
): { startMin: number; endMin: number } {
  if (booking.timeType === 'custom' || (booking.customStartTime && booking.customEndTime)) {
    const startMin = timeToMinutes(booking.customStartTime || '00:00');
    let endMin = timeToMinutes(booking.customEndTime || '23:59');
    if (endMin <= startMin) {
      endMin = startMin + 40;
    }
    return { startMin, endMin };
  }

  const normStart = booking.startJp === 206 ? 6 : (booking.startJp === 103 ? 4 : (booking.startJp ?? 1));
  const normEnd = booking.endJp === 206 ? 6 : (booking.endJp === 103 ? 4 : (booking.endJp ?? normStart));

  const startP = getPeriodById(periods, normStart);
  const endP = getPeriodById(periods, normEnd);
  if (startP && endP) {
    return {
      startMin: timeToMinutes(startP.startTime),
      endMin: timeToMinutes(endP.endTime),
    };
  }
  return { startMin: 0, endMin: 0 };
}

export function isTimeOverlap(
  startMin1: number,
  endMin1: number,
  startMin2: number,
  endMin2: number
): boolean {
  return !(endMin1 <= startMin2 || startMin1 >= endMin2);
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

  // Filter bookings for this facility on this specific date only
  const dayFacilityBookings = bookings.filter((b) => {
    if (b.facility !== facility) return false;
    if (b.bookingDate && currentDateStr) {
      return b.bookingDate === currentDateStr;
    }
    return false;
  });

  let currentBooking: Booking | null = null;
  let nextBooking: Booking | null = null;
  let minDiffToNext = Infinity;
  let timeRemainingMinutes: number | undefined;
  let progressPercent: number | undefined;

  for (const booking of dayFacilityBookings) {
    const { startMin, endMin } = getBookingStartEndMinutes(booking, periods);
    if (startMin === 0 && endMin === 0 && booking.timeType !== 'custom') continue;

    // Check if active right now
    if (curMin >= startMin && curMin < endMin) {
      currentBooking = booking;
      const totalDuration = Math.max(1, endMin - startMin);
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
    nextPeriodLabel = getBookingTimeRangeLabel(nextBooking, periods);
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
