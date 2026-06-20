import type { MeetingSession } from '@renderer/types/meeting'

function session(
  id: string,
  title: string,
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  durationSeconds: number
): MeetingSession {
  return {
    id,
    title,
    startedAt: new Date(year, month - 1, day, hours, minutes),
    durationSeconds
  }
}

export const mockSessions: MeetingSession[] = [
  session('1', 'Untitled Session', 2026, 6, 20, 18, 9, 0),
  session('2', 'Untitled Session', 2026, 6, 18, 20, 41, 76),
  session('3', 'Untitled Session', 2026, 6, 18, 20, 39, 6),
  session('4', 'Untitled Session', 2026, 6, 18, 20, 22, 30),
  session('5', 'Untitled Session', 2026, 6, 18, 20, 21, 50),
  session('6', 'Untitled Session', 2026, 6, 18, 20, 21, 61),
  session('7', 'Natively Demo & Guide', 2026, 6, 18, 9, 30, 300)
]
