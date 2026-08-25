import { env } from '../config/env.js';

/** Call an independently trained artifact service; unavailable means fallback. */
export async function predictWithMlService(task, features) {
  const base = String(env.ML_SERVICE_URL || '').trim().replace(/\/$/, '');
  if (!base) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.ML_SERVICE_TIMEOUT);
  try {
    const response = await fetch(`${base}/predict/${encodeURIComponent(task)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`ML service returned ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`[ML] service unavailable task=${task} reason=${error.message || error}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
