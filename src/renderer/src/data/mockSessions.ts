import type { MeetingSession, TranscriptEntry } from '@renderer/types/meeting'

export const DEFAULT_SUMMARY_MARKDOWN = `# Session Summary

## Overview
No summary available for this session yet.

## Key Takeaways
- Recording captured successfully
- Summary will be generated after processing
`

export const NATIVELY_SUMMARY_MARKDOWN = `# Session Summary: Natively Demo & Guide
**Date:** Thursday, June 18

## Overview
This session provided an introductory walkthrough of the Natively platform's core features and quick action buttons.

## Key Takeaways
- **Quick Action Buttons:** There are 5 main tools:
    - *What to answer:* Real-time suggestions based on active listening.
    - *Clarify:* Helps identify and ask for missing constraints.
    - *Recap:* Generates a summary of the conversation history.
    - *Follow Up:* Suggests logical next questions.
- **Setup:** Users should refer to the 'How to Use' section in the notes for detailed API configuration.
`

export const NATIVELY_TRANSCRIPT: TranscriptEntry[] = [
  {
    speaker: 'Them',
    time: '0:00',
    text: 'Welcome to Natively! Let me show you how it works.'
  },
  {
    speaker: 'Me',
    time: '07:00 am',
    text: "Thanks! I'm excited to try it out."
  },
  {
    speaker: 'Them',
    time: '07:00 am',
    text: "You have 5 quick action buttons. 'What to answer' listens to the conversation and suggests what you should say."
  },
  {
    speaker: 'Me',
    time: '07:00 am',
    text: 'That sounds helpful for interviews.'
  },
  {
    speaker: 'Them',
    time: '07:00 am',
    text: "Check out the 'How to Use' section in the notes for API setup instructions."
  },
  {
    speaker: 'Them',
    time: '07:00 am',
    text: "'Clarify' asks a targeted question to get missing constraints. 'Recap' summarizes the entire conversation so far."
  },
  {
    speaker: 'Me',
    time: '07:00 am',
    text: 'What about the other buttons?'
  },
  {
    speaker: 'Them',
    time: '07:00 am',
    text: "'Follow Up Questions' suggests relevant next steps to keep the conversation flowing."
  }
]

function session(
  id: string,
  title: string,
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  durationSeconds: number,
  extras?: Pick<MeetingSession, 'summary' | 'transcript'>
): MeetingSession {
  return {
    id,
    title,
    startedAt: new Date(year, month - 1, day, hours, minutes),
    durationSeconds,
    summary: extras?.summary ?? DEFAULT_SUMMARY_MARKDOWN,
    transcript: extras?.transcript
  }
}

export const mockSessions: MeetingSession[] = [
  session('1', 'Untitled Session', 2026, 6, 20, 18, 9, 0),
  session('2', 'Untitled Session', 2026, 6, 18, 20, 41, 76),
  session('3', 'Untitled Session', 2026, 6, 18, 20, 39, 6),
  session('4', 'Untitled Session', 2026, 6, 18, 20, 22, 30),
  session('5', 'Untitled Session', 2026, 6, 18, 20, 21, 50),
  session('6', 'Untitled Session', 2026, 6, 18, 20, 21, 61),
  session('7', 'Natively Demo & Guide', 2026, 6, 18, 9, 30, 300, {
    summary: NATIVELY_SUMMARY_MARKDOWN,
    transcript: NATIVELY_TRANSCRIPT
  })
]
