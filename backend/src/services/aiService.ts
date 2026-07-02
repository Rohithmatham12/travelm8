/**
 * AI service — Groq (Llama 3.3 70B) primary, Gemini 1.5 Flash fallback.
 * Responses cached by prompt hash for 1 hour to stay within free-tier limits.
 */

import crypto from 'crypto';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface CacheEntry {
  data: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function cacheKey(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: string): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const groq = new Groq({ apiKey });

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
    temperature: 0.4,
  });

  return response.choices[0]?.message?.content ?? '';
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function askAI(prompt: string): Promise<string> {
  const key = cacheKey(prompt);
  const cached = getCached(key);
  if (cached) return cached;

  let result: string;
  try {
    result = await callGroq(prompt);
  } catch (err) {
    console.warn('[AI] Groq failed, falling back to Gemini:', (err as Error).message);
    try {
      result = await callGemini(prompt);
    } catch (err2) {
      console.error('[AI] Gemini fallback also failed:', (err2 as Error).message);
      return '';
    }
  }

  setCached(key, result);
  return result;
}

// ---------------------------------------------------------------------------
// Structured helpers
// ---------------------------------------------------------------------------

export interface RouteInsight {
  tripSummary: string;
  fatigueWarning: string | null;
  lateArrivalNote: string | null;
  topTip: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export async function getRouteInsights(
  origin: string,
  destination: string,
  distanceMiles: number,
  driveMinutes: number,
  departureTime: string,
  travelers: number
): Promise<RouteInsight> {
  const driveHours = (driveMinutes / 60).toFixed(1);
  const prompt = `You are a road trip safety advisor. Answer in JSON only — no markdown, no explanation.

Trip: ${origin} → ${destination}
Distance: ${distanceMiles} miles | Drive time: ${driveHours} hours
Departure: ${departureTime} | Travelers: ${travelers}

Return this exact JSON shape:
{
  "tripSummary": "one friendly sentence about the trip",
  "fatigueWarning": "warning if drive is over 4 hours, else null",
  "lateArrivalNote": "note if they may arrive after 10pm based on departure time and drive duration, else null",
  "topTip": "single most useful tip for this specific route",
  "riskLevel": "low | medium | high"
}`;

  const raw = await askAI(prompt);
  try {
    const json = raw.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json) as RouteInsight;
  } catch {
    return {
      tripSummary: `${origin} to ${destination} — ${driveHours}h drive.`,
      fatigueWarning: driveMinutes > 240 ? 'Drive is over 4 hours — plan rest stops.' : null,
      lateArrivalNote: null,
      topTip: 'Check fuel before leaving.',
      riskLevel: driveMinutes > 360 ? 'high' : driveMinutes > 240 ? 'medium' : 'low',
    };
  }
}

export interface StopInsight {
  whyStop: string;
  bestTimeToVisit: string;
  localTip: string;
}

export async function getStopInsight(
  stopName: string,
  stopCategory: string,
  routeContext: string
): Promise<StopInsight> {
  const prompt = `You are a local travel guide. Answer in JSON only — no markdown.

Stop: ${stopName} (${stopCategory})
On route: ${routeContext}

Return this exact JSON:
{
  "whyStop": "one sentence on why this stop is worth it",
  "bestTimeToVisit": "quick note on best time",
  "localTip": "one specific local tip"
}`;

  const raw = await askAI(prompt);
  try {
    const json = raw.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json) as StopInsight;
  } catch {
    return {
      whyStop: `${stopName} is a recommended ${stopCategory} on this route.`,
      bestTimeToVisit: 'Anytime during daylight hours.',
      localTip: 'Check hours before visiting.',
    };
  }
}

export interface DestinationInsight {
  headline: string;
  bestFor: string[];
  budgetTip: string;
  avoidTip: string;
}

export async function getDestinationInsight(
  destination: string,
  days: number,
  budgetLevel: string,
  travelers: number
): Promise<DestinationInsight> {
  const prompt = `You are a travel expert. Answer in JSON only — no markdown.

Destination: ${destination}
Stay: ${days} days | Budget: ${budgetLevel} | Travelers: ${travelers}

Return this exact JSON:
{
  "headline": "one exciting sentence about ${destination}",
  "bestFor": ["up to 3 short phrases for what this place is best for"],
  "budgetTip": "one concrete money-saving tip for ${budgetLevel} travelers",
  "avoidTip": "one thing tourists commonly waste money on here"
}`;

  const raw = await askAI(prompt);
  try {
    const json = raw.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(json) as DestinationInsight;
  } catch {
    return {
      headline: `${destination} awaits — plan smart and travel well.`,
      bestFor: ['sightseeing', 'local food', 'culture'],
      budgetTip: 'Book accommodation in advance for better rates.',
      avoidTip: 'Avoid tourist-trap restaurants right next to major attractions.',
    };
  }
}
