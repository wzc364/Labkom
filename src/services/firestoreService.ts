import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Booking, Period, DayOfWeek, DayScheduleConfig, Teacher } from '../types/schedule';
import { INITIAL_BOOKINGS, DEFAULT_PERIODS, DEFAULT_DAY_SCHEDULES, DEFAULT_TEACHERS } from '../data/defaultData';


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const BOOKINGS_COLLECTION = 'bookings';
const PERIODS_COLLECTION = 'periods';
const DAY_SCHEDULES_COLLECTION = 'day_schedules';
const TEACHERS_COLLECTION = 'teachers';


import { normalizeBooking } from '../utils/storage';

// Subscribe to real-time bookings
export function subscribeBookings(
  onData: (bookings: Booking[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, BOOKINGS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Booking[] = [];
      snapshot.forEach((d) => {
        items.push(normalizeBooking({ id: d.id, ...d.data() }));
      });
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, BOOKINGS_COLLECTION);
      if (onError) onError(err);
    }
  );
}

// Subscribe to real-time periods
export function subscribePeriods(
  onData: (periods: Period[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, PERIODS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onData(DEFAULT_PERIODS);
        return;
      }
      const items: Period[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Period);
      });
      items.sort((a, b) => a.id - b.id);
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, PERIODS_COLLECTION);
      if (onError) onError(err);
    }
  );
}

// Subscribe to real-time day schedules config
export function subscribeDaySchedules(
  onData: (schedules: Record<DayOfWeek, DayScheduleConfig>) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, DAY_SCHEDULES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Fallback to default
        const result: Record<DayOfWeek, DayScheduleConfig> = {} as any;
        (Object.keys(DEFAULT_DAY_SCHEDULES) as DayOfWeek[]).forEach((day) => {
          result[day] = {
            day,
            totalHours: DEFAULT_DAY_SCHEDULES[day].totalHours,
            periods: DEFAULT_DAY_SCHEDULES[day].periods,
          };
        });
        onData(result);
        return;
      }
      const result: Partial<Record<DayOfWeek, DayScheduleConfig>> = {};
      snapshot.forEach((d) => {
        const data = d.data() as DayScheduleConfig;
        result[data.day] = data;
      });

      // Merge with default if any day is missing
      (Object.keys(DEFAULT_DAY_SCHEDULES) as DayOfWeek[]).forEach((day) => {
        if (!result[day]) {
          result[day] = {
            day,
            totalHours: DEFAULT_DAY_SCHEDULES[day].totalHours,
            periods: DEFAULT_DAY_SCHEDULES[day].periods,
          };
        }
      });

      onData(result as Record<DayOfWeek, DayScheduleConfig>);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, DAY_SCHEDULES_COLLECTION);
      if (onError) onError(err);
    }
  );
}

// Save day schedule configuration to Firestore
export async function saveDayScheduleToFirestore(config: DayScheduleConfig): Promise<void> {
  try {
    const docRef = doc(db, DAY_SCHEDULES_COLLECTION, config.day);
    await setDoc(docRef, {
      day: config.day,
      totalHours: Number(config.totalHours),
      periods: config.periods,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${DAY_SCHEDULES_COLLECTION}/${config.day}`);
    throw err;
  }
}

// Save or update booking to Firestore
export async function saveBookingToFirestore(booking: Booking): Promise<void> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, booking.id);
    await setDoc(docRef, {
      teacherName: booking.teacherName,
      subject: booking.subject,
      className: booking.className,
      facility: booking.facility,
      day: booking.day,
      bookingDate: booking.bookingDate || '',
      startJp: Number(booking.startJp),
      endJp: Number(booking.endJp),
      notes: booking.notes || '',
      createdAt: booking.createdAt,
      sharedLabAcknowledgment: !!booking.sharedLabAcknowledgment,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${BOOKINGS_COLLECTION}/${booking.id}`);
    throw err;
  }
}

// Delete booking from Firestore
export async function deleteBookingFromFirestore(bookingId: string): Promise<void> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${BOOKINGS_COLLECTION}/${bookingId}`);
    throw err;
  }
}

export async function clearAllFirestoreBookings(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, BOOKINGS_COLLECTION));
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach((d) => {
        batch.delete(doc(db, BOOKINGS_COLLECTION, d.id));
      });
      await batch.commit();
      console.log('All dummy Firestore bookings cleared.');
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, BOOKINGS_COLLECTION);
  }
}

// Seed initial bookings into Firestore if empty (only if INITIAL_BOOKINGS contains items)
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    if (INITIAL_BOOKINGS.length === 0) return;
    const snapshot = await getDocs(collection(db, BOOKINGS_COLLECTION));
    if (snapshot.empty) {
      const batch = writeBatch(db);
      for (const b of INITIAL_BOOKINGS) {
        const docRef = doc(db, BOOKINGS_COLLECTION, b.id);
        batch.set(docRef, {
          teacherName: b.teacherName,
          subject: b.subject,
          className: b.className,
          facility: b.facility,
          day: b.day,
          bookingDate: b.bookingDate || '',
          startJp: Number(b.startJp),
          endJp: Number(b.endJp),
          notes: b.notes || '',
          createdAt: b.createdAt,
          sharedLabAcknowledgment: !!b.sharedLabAcknowledgment,
        });
      }
      await batch.commit();
      console.log('Initial sample bookings seeded to Firestore.');
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, BOOKINGS_COLLECTION);
  }
}

// Subscribe to real-time teachers
export function subscribeTeachers(
  onData: (teachers: Teacher[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, TEACHERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onData(DEFAULT_TEACHERS);
        return;
      }
      const items: Teacher[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Teacher);
      });
      items.sort((a, b) => a.name.localeCompare(b.name));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, TEACHERS_COLLECTION);
      if (onError) onError(err);
    }
  );
}

// Save or update teacher in Firestore
export async function saveTeacherToFirestore(teacher: Teacher): Promise<void> {
  try {
    const docRef = doc(db, TEACHERS_COLLECTION, teacher.id);
    await setDoc(docRef, {
      name: teacher.name,
      nip: teacher.nip || '-',
      subject: teacher.subject,
      createdAt: teacher.createdAt || new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${TEACHERS_COLLECTION}/${teacher.id}`);
    throw err;
  }
}

// Delete teacher from Firestore
export async function deleteTeacherFromFirestore(teacherId: string): Promise<void> {
  try {
    const docRef = doc(db, TEACHERS_COLLECTION, teacherId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${TEACHERS_COLLECTION}/${teacherId}`);
    throw err;
  }
}

const SETTINGS_COLLECTION = 'settings';
const HEADER_LOGO_DOC = 'header_logo';

// Subscribe to real-time Header Logo Config
export function subscribeHeaderLogo(
  onData: (logoConfig: any) => void,
  onError?: (err: any) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, HEADER_LOGO_DOC);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data());
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${SETTINGS_COLLECTION}/${HEADER_LOGO_DOC}`);
      if (onError) onError(err);
    }
  );
}

// Save Header Logo Config to Firestore
export async function saveHeaderLogoToFirestore(config: any): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, HEADER_LOGO_DOC);
    await setDoc(docRef, config);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SETTINGS_COLLECTION}/${HEADER_LOGO_DOC}`);
    throw err;
  }
}

