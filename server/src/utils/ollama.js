import { env } from '../config/env.js';

/**
 * Ask an explicitly configured local or remote Ollama model using the native
 * /api/generate endpoint. Hosted deployments normally leave it disabled and
 * use the deterministic local knowledge base instead.
 */
export function isOllamaEnabled() {
  return Boolean(String(env.OLLAMA_URL || '').trim());
}

export async function askOllama(system, prompt, { maxTokens = 300 } = {}) {
  const base = String(env.OLLAMA_URL || '').replace(/\/+$/, '');
  if (!base) throw new Error('Ollama is disabled. Set OLLAMA_URL to enable it.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.OLLAMA_TIMEOUT);
  try {
    const resp = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        prompt: `${system}\n\n${prompt}`,
        stream: false,
        options: { temperature: 0.2, num_predict: maxTokens },
      }),
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`Ollama ${resp.status}: ${(await resp.text()).slice(0, 160)}`);
    const out = await resp.json();
    const text = String(out.response || '').trim();
    if (!text) throw new Error('Ollama returned an empty response.');
    return text;
  } finally {
    clearTimeout(timer);
  }
}
