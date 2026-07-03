import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface CalEvent {
  id?: string;
  title: string;
  startTime: string;
  endTime?: string;
  description?: string;
  location?: string;
}

function fmtICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function esc(s: string): string {
  return (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function generateICS(events: CalEvent[], calName: string): string {
  const now = fmtICS(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TravelM8//RoadTrip//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(calName)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const ev of events) {
    const start = new Date(ev.startTime);
    const end = ev.endTime ? new Date(ev.endTime) : new Date(start.getTime() + 60 * 60 * 1000);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.id || Math.random().toString(36).slice(2)}@travelm8`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${fmtICS(start)}`);
    lines.push(`DTEND:${fmtICS(end)}`);
    lines.push(`SUMMARY:${esc(ev.title)}`);
    if (ev.description) lines.push(`DESCRIPTION:${esc(ev.description)}`);
    if (ev.location)    lines.push(`LOCATION:${esc(ev.location)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export async function shareCalendar(events: CalEvent[], calName: string): Promise<void> {
  const ics = generateICS(events, calName);
  const filename = calName.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '') + '.ics';
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(ics);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/calendar',
    dialogTitle: 'Add to Calendar',
    UTI: 'public.calendar-event',
  });
}
