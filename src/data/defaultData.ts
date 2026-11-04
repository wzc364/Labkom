import { Facility, DayOfWeek, Period, Booking, Teacher } from '../types/schedule';


export const DAYS_OF_WEEK: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const FACILITIES: {
  id: Facility;
  name: string;
  roomDesc: string;
  location: string;
  purpose: string;
  capacity: string;
  badgeColor: string;
}[] = [
  {
    id: 'LABKOM 1 PID',
    name: 'LABKOM 1 PID',
    roomDesc: 'Laboratorium Komputer 1 Terintegrasi Papan Interaktif Digital (35 PC Client, 2 Server, 1 IFP 75" 4K)',
    location: 'Gedung Multimedia',
    purpose: 'Praktik Informatika Komputer Siswa + Presentasi Interaktif Papan Sentuh (PID)',
    capacity: '35 PC Client + 2 Server + 1 Papan Interaktif Digital 75"',
    badgeColor: 'blue',
  },
  {
    id: 'LABKOM 2',
    name: 'LABKOM 2',
    roomDesc: 'Laboratorium Komputer 2 (20 PC Client, 8 Chromebook, 25 Tablet)',
    location: 'Gedung Multimedia',
    purpose: 'Simulasi Sains, Praktik Office, Pengetikan & Riset Digital Siswa',
    capacity: '20 PC Client + 8 Chromebook + 25 Tablet',
    badgeColor: 'emerald',
  },
];

export const DEFAULT_PERIODS: Period[] = [
  { id: 1, label: 'JP 1', startTime: '07:20', endTime: '08:00' },
  { id: 2, label: 'JP 2', startTime: '08:00', endTime: '08:40' },
  { id: 3, label: 'JP 3', startTime: '08:40', endTime: '09:20' },
  { id: 101, label: 'Istirahat 1', startTime: '09:20', endTime: '09:40', isBreak: true },
  { id: 4, label: 'JP 4', startTime: '09:40', endTime: '10:20' },
  { id: 5, label: 'JP 5', startTime: '10:20', endTime: '11:00' },
  { id: 6, label: 'JP 6', startTime: '11:00', endTime: '11:40' },
  { id: 102, label: 'Istirahat 2 (Dzuhur)', startTime: '11:40', endTime: '12:30', isBreak: true },
  { id: 7, label: 'JP 7', startTime: '12:30', endTime: '13:10' },
  { id: 8, label: 'JP 8', startTime: '13:10', endTime: '13:50' },
];

export const FRIDAY_PERIODS: Period[] = [
  { id: 1, label: 'JP 1', startTime: '07:00', endTime: '07:40' },
  { id: 2, label: 'JP 2', startTime: '07:40', endTime: '08:20' },
  { id: 101, label: 'Istirahat', startTime: '08:20', endTime: '08:40', isBreak: true },
  { id: 3, label: 'JP 3', startTime: '08:40', endTime: '09:20' },
  { id: 4, label: 'JP 4', startTime: '09:20', endTime: '10:00' },
  { id: 5, label: 'JP 5', startTime: '10:00', endTime: '10:40' },
  { id: 102, label: 'Persiapan Sholat Jumat', startTime: '10:40', endTime: '11:45', isBreak: true },
];

export const DEFAULT_DAY_SCHEDULES: Record<DayOfWeek, { totalHours: number; periods: Period[] }> = {
  Senin: {
    totalHours: 8,
    periods: DEFAULT_PERIODS,
  },
  Selasa: {
    totalHours: 8,
    periods: DEFAULT_PERIODS,
  },
  Rabu: {
    totalHours: 8,
    periods: DEFAULT_PERIODS,
  },
  Kamis: {
    totalHours: 8,
    periods: DEFAULT_PERIODS,
  },
  Jumat: {
    totalHours: 5,
    periods: FRIDAY_PERIODS,
  },
  Sabtu: {
    totalHours: 6,
    periods: [
      { id: 1, label: 'JP 1', startTime: '07:20', endTime: '08:00' },
      { id: 2, label: 'JP 2', startTime: '08:00', endTime: '08:40' },
      { id: 3, label: 'JP 3', startTime: '08:40', endTime: '09:20' },
      { id: 101, label: 'Istirahat', startTime: '09:20', endTime: '09:40', isBreak: true },
      { id: 4, label: 'JP 4', startTime: '09:40', endTime: '10:20' },
      { id: 5, label: 'JP 5', startTime: '10:20', endTime: '11:00' },
      { id: 6, label: 'JP 6', startTime: '11:00', endTime: '11:40' },
    ],
  },
};

export const SAMPLE_CLASSES = [
  'VII A', 'VII B', 'VII C', 'VII D', 'VII E', 'VII F', 'VII G', 'VII H', 'VII I', 'VII J',
  'VIII A', 'VIII B', 'VIII C', 'VIII D', 'VIII E', 'VIII F', 'VIII G', 'VIII H', 'VIII I', 'VIII J',
  'IX A', 'IX B', 'IX C', 'IX D', 'IX E', 'IX F', 'IX G', 'IX H', 'IX I', 'IX J', 'IX K',
];

export const SAMPLE_SUBJECTS = [
  // Wajib Kurikulum Merdeka (Fase D)
  'Informatika',
  'IPA (Ilmu Pengetahuan Alam)',
  'IPS (Ilmu Pengetahuan Sosial)',
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Pendidikan Pancasila (PPKn)',
  'PAI & Budi Pekerti',
  'PJOK (Jasmani & Kesehatan)',
  'Seni Budaya',
  'Prakarya',
  'Bahasa Sunda (Mulok)',
  'Bimbingan Konseling (BK)',
  'Kokurikuler',
  // Latihan, Asesmen & Kegiatan Khusus
  'Asesmen / ANBK / Try Out',
  'Latihan / Simulasi Digital',
  'Ekstrakurikuler / Klub Komputer',
  'Pelatihan Guru / Rapat Sekolah',
];

export const INITIAL_BOOKINGS: Booking[] = [];

export const DEFAULT_TEACHERS: Teacher[] = [
  { id: 't-1', name: 'Ega Nugraha, S.Pd.', nip: '19880412 201403 1 002', subject: 'Informatika' },
  { id: 't-2', name: 'Drs. H. Ahmad Dahlan, M.Pd.', nip: '19680315 199412 1 001', subject: 'IPA (Ilmu Pengetahuan Alam)' },
  { id: 't-3', name: 'Siti Rahmah, S.Pd.', nip: '19820719 200801 2 014', subject: 'Matematika' },
  { id: 't-4', name: 'H. Dedi Mulyadi, M.Ag.', nip: '19751105 200212 1 003', subject: 'PAI & Budi Pekerti' },
  { id: 't-5', name: 'Nani Sumarni, S.Pd.', nip: '19900224 201903 2 008', subject: 'Bahasa Indonesia' },
  { id: 't-6', name: 'Irwan Setiawan, S.Kom.', nip: '19921008 202203 1 005', subject: 'Kokurikuler' },
];

