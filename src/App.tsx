/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { ScheduleTableView } from './components/ScheduleTableView';
import { BookingManagement } from './components/BookingManagement';
import { FacilityGallery } from './components/FacilityGallery';
import { BookingModal } from './components/BookingModal';
import { PeriodSettingsModal } from './components/PeriodSettingsModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { TvDisplayView } from './components/TvDisplayView';
import { LoginPage } from './components/LoginPage';
import { ProfileModal } from './components/ProfileModal';
import { Booking, DayOfWeek, Facility, Period, DayScheduleConfig, Teacher, UserSession, GalleryImage, Student } from './types/schedule';
import { loadBookings, saveBookings, loadPeriods, savePeriods, resetToDefaultData } from './utils/storage';
import { getIndonesianDay, formatTimeDigits } from './utils/timeUtils';
import { DEFAULT_DAY_SCHEDULES, DEFAULT_TEACHERS } from './data/defaultData';
import { testConnection } from './firebase';
import {
  subscribeBookings,
  subscribePeriods,
  subscribeDaySchedules,
  subscribeTeachers,
  subscribeHeaderLogo,
  subscribeStudents,
  saveDayScheduleToFirestore,
  saveBookingToFirestore,
  deleteBookingFromFirestore,
  saveTeacherToFirestore,
  deleteTeacherFromFirestore,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  saveHeaderLogoToFirestore,
  seedInitialFirestoreData,
  clearAllFirestoreBookings,
  subscribeGallery,
} from './services/firestoreService';
import { HeaderLogoConfig, DEFAULT_LOGO_CONFIG } from './components/HeaderLogoSettings';

const STORAGE_KEY_DAY_SCHEDULES = 'smpn1kawali_day_schedules_v1';
const STORAGE_KEY_USER_SESSION = 'smpn1kawali_user_session_v1';
const STORAGE_KEY_TEACHER_PASSWORDS = 'smpn1kawali_teacher_passwords_v1';
const STORAGE_KEY_HEADER_LOGO = 'smpn1kawali_header_logo_v1';


function loadInitialDaySchedules(): Record<DayOfWeek, DayScheduleConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAY_SCHEDULES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse cached day schedules:', e);
  }

  // Construct from default
  const initial: Record<DayOfWeek, DayScheduleConfig> = {} as any;
  (Object.keys(DEFAULT_DAY_SCHEDULES) as DayOfWeek[]).forEach((day) => {
    initial[day] = {
      day,
      totalHours: DEFAULT_DAY_SCHEDULES[day].totalHours,
      periods: DEFAULT_DAY_SCHEDULES[day].periods,
    };
  });
  return initial;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'bookings' | 'facilities' | 'admin'>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>(() => loadBookings());
  const [periods, setPeriods] = useState<Period[]>(() => loadPeriods());
  const [daySchedules, setDaySchedules] = useState<Record<DayOfWeek, DayScheduleConfig>>(() => loadInitialDaySchedules());
  const [teachers, setTeachers] = useState<Teacher[]>(DEFAULT_TEACHERS);
  const [students, setStudents] = useState<Student[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Header Logo Config State
  const [headerLogo, setHeaderLogo] = useState<HeaderLogoConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HEADER_LOGO);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse cached header logo:', e);
    }
    return DEFAULT_LOGO_CONFIG;
  });

  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER_SESSION);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse cached user session:', e);
    }
    return null;
  });

  // Custom Teacher Passwords (defaults to "Nesaka" if not set)
  const [teacherPasswords, setTeacherPasswords] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TEACHER_PASSWORDS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse cached teacher passwords:', e);
    }
    return {};
  });

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(currentUser?.role === 'admin');
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Sync isAdminLoggedIn with currentUser role
  useEffect(() => {
    setIsAdminLoggedIn(currentUser?.role === 'admin');
  }, [currentUser]);

  // Real-time clock state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Simulation mode
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedDay, setSimulatedDay] = useState<DayOfWeek>('Senin');
  const [simulatedTime, setSimulatedTime] = useState('08:15');

  // Modals & Views
  const [isTvMode, setIsTvMode] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingDefaultFacility, setBookingDefaultFacility] = useState<Facility>('LABKOM 1 PID');
  const [isPeriodSettingsOpen, setIsPeriodSettingsOpen] = useState(false);

  // Live timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Firebase Firestore initial connection and real-time subscriptions
  useEffect(() => {
    let unsubscribeBookings: (() => void) | undefined;
    let unsubscribePeriods: (() => void) | undefined;
    let unsubscribeDaySchedules: (() => void) | undefined;
    let unsubscribeTeachersRef: (() => void) | undefined;
    let unsubscribeStudentsRef: (() => void) | undefined;
    let unsubscribeLogoRef: (() => void) | undefined;
    let unsubscribeGalleryRef: (() => void) | undefined;

    async function initFirebase() {
      const connected = await testConnection();
      setIsFirebaseConnected(connected);

      // Subscribe to real-time updates for bookings
      unsubscribeBookings = subscribeBookings(
        (remoteBookings) => {
          setBookings(remoteBookings || []);
          saveBookings(remoteBookings || []);
        },
        (err) => {
          console.warn('Using local cache for bookings:', err);
        }
      );

      // Subscribe to real-time updates for default periods
      unsubscribePeriods = subscribePeriods(
        (remotePeriods) => {
          if (remotePeriods && remotePeriods.length > 0) {
            setPeriods(remotePeriods);
            savePeriods(remotePeriods);
          }
        },
        (err) => {
          console.warn('Using local cache for periods:', err);
        }
      );

      // Subscribe to real-time day schedules (Admin configurations per day)
      unsubscribeDaySchedules = subscribeDaySchedules(
        (remoteDaySchedules) => {
          if (remoteDaySchedules) {
            setDaySchedules(remoteDaySchedules);
            try {
              localStorage.setItem(STORAGE_KEY_DAY_SCHEDULES, JSON.stringify(remoteDaySchedules));
            } catch (e) {
              console.warn('Failed to cache day schedules:', e);
            }
          }
        },
        (err) => {
          console.warn('Using local cache for day schedules:', err);
        }
      );

      // Subscribe to real-time teachers collection
      unsubscribeTeachersRef = subscribeTeachers(
        (remoteTeachers) => {
          if (remoteTeachers && remoteTeachers.length > 0) {
            setTeachers(remoteTeachers);
          }
        },
        (err) => {
          console.warn('Using local default teachers:', err);
        }
      );

      // Subscribe to real-time gallery
      unsubscribeGalleryRef = subscribeGallery(
        (remoteImages: GalleryImage[]) => {
          setGalleryImages(remoteImages || []);
        },
        (err) => {
          console.warn('Failed to fetch gallery:', err);
        }
      );

      // Subscribe to real-time header logo config
      unsubscribeLogoRef = subscribeHeaderLogo(
        (remoteLogo) => {
          if (remoteLogo) {
            setHeaderLogo(remoteLogo);
            try {
              localStorage.setItem(STORAGE_KEY_HEADER_LOGO, JSON.stringify(remoteLogo));
            } catch (e) {
              console.warn('Failed to cache header logo:', e);
            }
          }
        },
        (err) => {
          console.warn('Using local header logo:', err);
        }
      );
    }

    initFirebase().catch((err) => {
      console.warn('Firebase init fallback to local:', err);
    });

    return () => {
      if (unsubscribeBookings) unsubscribeBookings();
      if (unsubscribePeriods) unsubscribePeriods();
      if (unsubscribeDaySchedules) unsubscribeDaySchedules();
      if (unsubscribeTeachersRef) unsubscribeTeachersRef();
      if (unsubscribeLogoRef) unsubscribeLogoRef();
      if (unsubscribeGalleryRef) unsubscribeGalleryRef();
    };
  }, []);

  // Password lookup & update helpers
  const getTeacherPassword = (nipKey: string): string => {
    const cleanKey = nipKey.replace(/\s+/g, '');
    return teacherPasswords[cleanKey] || 'Nesaka';
  };

  const handleChangePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    if (!currentUser) return false;

    if (currentUser.role === 'admin') {
      if (oldPass !== 'ega') return false;
      // Admin password changed successfully (for session)
      return true;
    }

    // Teacher password change
    const key = (currentUser.nip || currentUser.username).replace(/\s+/g, '');
    const currentPass = getTeacherPassword(key);

    if (oldPass !== currentPass) {
      return false;
    }

    const updatedPasswords = {
      ...teacherPasswords,
      [key]: newPass,
    };

    setTeacherPasswords(updatedPasswords);
    try {
      localStorage.setItem(STORAGE_KEY_TEACHER_PASSWORDS, JSON.stringify(updatedPasswords));
    } catch (e) {
      console.warn('Failed to cache teacher passwords:', e);
    }
    return true;
  };

  const handleLoginSuccess = (session: UserSession) => {
    setCurrentUser(session);
    try {
      localStorage.setItem(STORAGE_KEY_USER_SESSION, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to cache user session:', e);
    }
    if (session.role === 'admin') {
      setIsAdminLoggedIn(true);
    }
  };

  const handleLogout = () => {
    console.log("Logout triggered");
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setIsProfileModalOpen(false);
    localStorage.removeItem(STORAGE_KEY_USER_SESSION);
  };

  // Teacher CRUD operations (synced with Firestore)
  const handleSaveTeacher = async (teacher: Teacher) => {
    const existingIndex = teachers.findIndex((t) => t.id === teacher.id);
    let updated: Teacher[];
    if (existingIndex >= 0) {
      updated = [...teachers];
      updated[existingIndex] = teacher;
    } else {
      updated = [...teachers, teacher];
    }
    setTeachers(updated);
    await saveTeacherToFirestore(teacher);
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    const updated = teachers.filter((t) => t.id !== teacherId);
    setTeachers(updated);
    await deleteTeacherFromFirestore(teacherId);
  };

  const handleSaveStudent = async (student: Student) => {
    await saveStudentToFirestore(student);
  };

  const handleDeleteStudent = async (studentId: string) => {
    await deleteStudentFromFirestore(studentId);
  };

  // Header Logo Save Handler
  const handleSaveHeaderLogo = async (config: HeaderLogoConfig) => {
    setHeaderLogo(config);
    try {
      localStorage.setItem(STORAGE_KEY_HEADER_LOGO, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to cache header logo:', e);
    }
    await saveHeaderLogoToFirestore(config);
  };


  // Compute effective day and time
  const effectiveDay: DayOfWeek = isSimulating ? simulatedDay : getIndonesianDay(currentDate);
  const effectiveTimeStr: string = isSimulating
    ? simulatedTime
    : formatTimeDigits(currentDate).slice(0, 5);

  // Active periods for the current effective day (customized per day, e.g. Senin 8 jam, Jumat 5 jam)
  const currentDayPeriods: Period[] = daySchedules[effectiveDay]?.periods || periods;

  // Ensure teachers cannot stay on admin tab
  useEffect(() => {
    if (currentUser?.role !== 'admin' && activeTab === 'admin') {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  // Navigate to Admin protected by login check
  const handleNavigateToAdmin = () => {
    if (currentUser?.role !== 'admin') {
      alert('Halaman admin hanya dapat diakses oleh Administrator.');
      setActiveTab('dashboard');
      return;
    }
    if (isAdminLoggedIn) {
      setActiveTab('admin');
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  const handleTabChange = (tab: 'dashboard' | 'schedule' | 'bookings' | 'facilities' | 'admin') => {
    if (tab === 'admin') {
      handleNavigateToAdmin();
    } else {
      setActiveTab(tab);
    }
  };

  // Save / Update day schedule from Admin Panel (synced to Firestore & LocalStorage)
  const handleSaveDaySchedule = async (config: DayScheduleConfig) => {
    const updated = {
      ...daySchedules,
      [config.day]: config,
    };
    setDaySchedules(updated);
    try {
      localStorage.setItem(STORAGE_KEY_DAY_SCHEDULES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to cache day schedules:', e);
    }

    // Save to Firestore
    await saveDayScheduleToFirestore(config);
  };

  // Save / Update booking (synced with Firestore)
  const handleSaveBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>, existingId?: string) => {
    const targetId = existingId || `b-${Date.now()}`;
    const targetCreatedAt = existingId
      ? bookings.find((b) => b.id === existingId)?.createdAt || new Date().toISOString()
      : new Date().toISOString();

    const newOrUpdatedBooking: Booking = {
      ...bookingData,
      id: targetId,
      createdAt: targetCreatedAt,
    };

    // Optimistically update state and local cache
    let updated: Booking[];
    if (existingId) {
      updated = bookings.map((b) => (b.id === existingId ? newOrUpdatedBooking : b));
    } else {
      updated = [newOrUpdatedBooking, ...bookings];
    }
    setBookings(updated);
    saveBookings(updated);
    setEditingBooking(null);

    // Save to Firestore
    try {
      await saveBookingToFirestore(newOrUpdatedBooking);
    } catch (err) {
      console.error('Failed to sync booking to Firestore:', err);
    }
  };

  // Delete booking (synced with Firestore)
  const handleDeleteBooking = async (id: string) => {
    const bookingToDelete = bookings.find((b) => b.id === id);
    if (currentUser?.role === 'guru' && bookingToDelete && bookingToDelete.teacherName !== currentUser.name) {
      alert('Anda hanya dapat menghapus jadwal milik Anda sendiri.');
      return;
    }

    const updated = bookings.filter((b) => b.id !== id);
    setBookings(updated);
    saveBookings(updated);

    try {
      await deleteBookingFromFirestore(id);
    } catch (err) {
      console.error('Failed to delete booking from Firestore:', err);
    }
  };

  // Reset to default data
  const handleResetData = () => {
    const res = resetToDefaultData();
    setBookings(res.bookings);
    setPeriods(res.periods);
  };

  // Update periods
  const handleSavePeriods = (newPeriods: Period[]) => {
    setPeriods(newPeriods);
    savePeriods(newPeriods);
  };

  // Open booking modal
  const handleOpenBookingModal = (preselectedFacility?: Facility, preselectedDay?: DayOfWeek) => {
    setEditingBooking(null);
    if (preselectedFacility) {
      setBookingDefaultFacility(preselectedFacility);
    }
    if (preselectedDay) {
      setSimulatedDay(preselectedDay);
    }
    setIsBookingModalOpen(true);
  };

  // Edit existing booking
  const handleEditBooking = (booking: Booking) => {
    if (currentUser?.role === 'guru' && booking.teacherName !== currentUser.name) {
      alert('Anda hanya dapat mengubah jadwal milik Anda sendiri.');
      return;
    }
    setEditingBooking(booking);
    setIsBookingModalOpen(true);
  };

  // Render Login Page if user is not logged in
  if (!currentUser) {
    return (
      <LoginPage
        teachers={teachers}
        onLoginSuccess={handleLoginSuccess}
        getTeacherPassword={getTeacherPassword}
        headerLogo={headerLogo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 flex flex-col font-sans selection:bg-amber-200 selection:text-blue-950">
      {/* Fullscreen TV Monitor Display View */}
      {isTvMode && (
        <TvDisplayView
          currentDate={currentDate}
          effectiveDay={effectiveDay}
          effectiveTimeStr={effectiveTimeStr}
          bookings={bookings}
          periods={currentDayPeriods}
          onClose={() => setIsTvMode(false)}
        />
      )}

      {/* Standard App Navigation & Simulator */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenBookingModal={() => handleOpenBookingModal()}
        onOpenPeriodSettings={() => setIsPeriodSettingsOpen(true)}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
        headerLogo={headerLogo}
      />
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      {/* Main Content Area */}
      <main className="flex-1 pb-24">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentDate={currentDate}
            effectiveDay={effectiveDay}
            effectiveTimeStr={effectiveTimeStr}
            bookings={bookings}
            periods={currentDayPeriods}
            onOpenBookingModal={(fac) => handleOpenBookingModal(fac)}
            onNavigateToAdmin={handleNavigateToAdmin}
            currentUser={currentUser}
            isFirebaseConnected={isFirebaseConnected}
            onEditBooking={handleEditBooking}
          />
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminPanel
            daySchedules={daySchedules}
            onSaveDaySchedule={handleSaveDaySchedule}
            onClose={() => setActiveTab('dashboard')}
            onLogout={handleLogout}
            isFirebaseConnected={isFirebaseConnected}
            onOpenTvMode={() => setIsTvMode(true)}
            bookings={bookings}
            teachers={teachers}
            onSaveTeacher={handleSaveTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            headerLogo={headerLogo}
            onSaveHeaderLogo={handleSaveHeaderLogo}
            galleryImages={galleryImages}
            students={students}
            onSaveStudent={handleSaveStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTableView
            bookings={bookings}
            periods={currentDayPeriods}
            onOpenBookingModal={handleOpenBookingModal}
            onEditBooking={handleEditBooking}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingManagement
            bookings={bookings}
            periods={currentDayPeriods}
            onOpenBookingModal={() => handleOpenBookingModal()}
            onEditBooking={handleEditBooking}
            onDeleteBooking={handleDeleteBooking}
            onResetData={handleResetData}
            onImportSuccess={(newB, newP) => {
              setBookings(newB);
              setPeriods(newP);
            }}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'facilities' && (
          <FacilityGallery images={galleryImages} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-800">SMPN 1 Kawali</span> · Laboratorium Komputer 1 PID & Laboratorium Komputer 2
          </div>
          <div className="text-slate-400">
            IT Nesaka SMPN 1 Kawali
          </div>
        </div>
      </footer>

      {/* Admin Login Modal (Protected by Username: ega, Password: ega) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={() => {
          setIsAdminLoggedIn(true);
          setIsAdminLoginModalOpen(false);
          setActiveTab('admin');
        }}
      />

      {/* User Profile & Password Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onChangePassword={handleChangePassword}
          onLogout={handleLogout}
        />
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingBooking(null);
        }}
        onSave={handleSaveBooking}
        existingBookings={bookings}
        periods={currentDayPeriods}
        daySchedules={daySchedules}
        editingBooking={editingBooking}
        defaultFacility={bookingDefaultFacility}
        teachers={teachers}
        currentUser={currentUser}
      />

      <PeriodSettingsModal
        isOpen={isPeriodSettingsOpen}
        onClose={() => setIsPeriodSettingsOpen(false)}
        periods={currentDayPeriods}
        onSavePeriods={handleSavePeriods}
      />
    </div>
  );
}

