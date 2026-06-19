export interface CourseColor {
  /** Strong line / text color for the course. */
  color: string;
  /** Soft tinted background for blocks and chips. */
  bg: string;
}

// Warm, distinct palette echoing the refactor-ui mockup. Each course code is
// hashed to one of these so the same course always keeps the same color across
// the search list, timetable, explorer, and plan panel.
const PALETTE: CourseColor[] = [
  { color: '#4f46e5', bg: '#eef0fe' }, // indigo
  { color: '#0d9488', bg: '#e6f5f3' }, // teal
  { color: '#e11d48', bg: '#fdeaee' }, // rose
  { color: '#b45309', bg: '#fbf1e3' }, // amber
  { color: '#7c3aed', bg: '#f2ecfd' }, // violet
  { color: '#059669', bg: '#e6f4ef' }, // emerald
  { color: '#0284c7', bg: '#e0f2fe' }, // sky
  { color: '#db2777', bg: '#fce7f3' }, // pink
  { color: '#ca8a04', bg: '#fef5d8' }, // gold
  { color: '#475569', bg: '#eef1f5' }, // slate
];

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function courseColor(courseCode: string): CourseColor {
  const key = (courseCode || '').trim().toUpperCase();
  if (!key) return PALETTE[PALETTE.length - 1];
  return PALETTE[hashCode(key) % PALETTE.length];
}
