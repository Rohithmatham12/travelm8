interface CalEvent {
  id?: string;
  title: string;
  startTime: string; // ISO
  endTime?: string;  // ISO
  description?: string;
  location?: string;
}

function fmtICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function esc(s: string): string {
  return (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateICS(events: CalEvent[], calName: string): string {
  const now = fmtICS(new Date());
  const lines = [
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

export function downloadICS(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
