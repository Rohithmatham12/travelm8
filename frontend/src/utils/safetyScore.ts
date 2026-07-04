export interface SafetyScore {
  score: number;
  label: string;
  color: string;
  bg: string;
  risks: string[];
}

export function computeSafetyScore(
  estimatedDriveTimeMin: number,
  suggestedStops: number,
  departureTime?: string | null,
): SafetyScore {
  let score = 100;
  const risks: string[] = [];
  const driveHours = estimatedDriveTimeMin / 60;

  if (driveHours > 8) { score -= 35; risks.push('Very long drive (8h+)'); }
  else if (driveHours > 6) { score -= 20; risks.push('Long drive (6h+)'); }
  else if (driveHours > 4) { score -= 10; risks.push('Drive exceeds 4 hours'); }

  if (departureTime) {
    const hour = parseInt(departureTime.split(':')[0], 10);
    if (hour >= 22 || hour < 5) { score -= 25; risks.push('Late-night or early-morning departure'); }
    else if (hour >= 20) { score -= 10; risks.push('Evening departure'); }
  }

  if (driveHours > 4 && suggestedStops === 0) {
    score -= 15; risks.push('No rest stops on a long drive');
  }

  score = Math.max(0, Math.min(100, score));

  if (score >= 85) return { score, label: 'Safe', color: '#16a34a', bg: '#dcfce7', risks };
  if (score >= 65) return { score, label: 'Moderate', color: '#d97706', bg: '#fef3c7', risks };
  if (score >= 45) return { score, label: 'Risky', color: '#ea580c', bg: '#ffedd5', risks };
  return { score, label: 'High Risk', color: '#dc2626', bg: '#fee2e2', risks };
}
