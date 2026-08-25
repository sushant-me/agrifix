import { env } from '../config/env.js';

const HOSTS = [
  // Hugging Face Inference API - primary (free tier with the user's HF token).
  (model) => ({
    url: `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}/v1/chat/completions`,
    headers: env.HUGGING_FACE_TOKEN ? { Authorization: `Bearer ${env.HUGGING_FACE_TOKEN}` } : {},
    model,
  }),
  (model) => ({
    url: `https://router.huggingface.co/v1/chat/completions`,
    headers: env.HUGGING_FACE_TOKEN ? { Authorization: `Bearer ${env.HUGGING_FACE_TOKEN}` } : {},
    model,
  }),
  // DeepSeek (OpenAI-compatible) - paid fallback, used only when a key is configured.
  () => (env.DEEPSEEK_API_KEY
    ? {
        url: `${env.DEEPSEEK_BASE_URL}/chat/completions`,
        headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
        model: env.DEEPSEEK_MODEL,
      }
    : null),
];

/** Tiny LRU cache so repeated queries don't burn the free API rate limit. */
const CACHE = new Map();
const CACHE_MAX = 100;
function cached(key, value) {
  if (CACHE.has(key)) {
    const v = CACHE.get(key);
    CACHE.delete(key);
    CACHE.set(key, v);
    return v;
  }
  CACHE.set(key, value);
  if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value);
  return value;
}

/**
 * Ask the configured Hugging Face text-generation model (OpenAI-compatible
 * inference endpoint). Works without a token on free models; a token lifts
 * rate limits. Resolves with the assistant's message content.
 */
export async function askTextModel(system, user, { maxNewTokens = 300 } = {}) {
  const messages = system
    ? [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ]
    : [{ role: 'user', content: user }];

  const payload = {
    model: env.HUGGING_TEXT_MODEL,
    messages,
    max_tokens: maxNewTokens,
    temperature: 0.2,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.HUGGING_TIMEOUT);

  let lastError = null;
  try {
    const cacheKey = `${env.HUGGING_TEXT_MODEL}:${JSON.stringify(messages)}`;
    const hit = CACHE.get(cacheKey);
    if (hit) return hit;
    for (const build of HOSTS) {
      const endpoint = build(env.HUGGING_TEXT_MODEL);
      if (!endpoint) continue;
      try {
        const resp = await fetch(endpoint.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...endpoint.headers },
          body: JSON.stringify({ ...payload, model: endpoint.model }),
          signal: controller.signal,
        });
        if (!resp.ok) {
          const detail = (await resp.text()).slice(0, 160);
          lastError = new Error(`${endpoint.url.includes('deepseek') ? 'DeepSeek' : 'Hugging Face'} ${resp.status}: ${detail}`);
          continue;
        }
        const out = await resp.json();
        const content = String(out.choices?.[0]?.message?.content || '').trim();
        if (!content) throw new Error('Model returned an empty response.');
        return cached(cacheKey, content);
      } catch (err) {
        if (err.name === 'AbortError') throw new Error('Model request timed out.');
        lastError = err;
      }
    }
  } finally {
    clearTimeout(timer);
  }
  throw lastError || new Error('Model request failed.');
}

// const VISION_MODELS = [
//   'Qwen/Qwen3-VL-30B-A3B-Instruct',
//   'Qwen/Qwen2.5-VL-72B-Instruct',
//   'Qwen/Qwen3-VL-235B-A22B-Instruct',
// ];
const VISION_MODELS = [
  'Qwen/Qwen2.5-VL-3B-Instruct',
];

/**
 * Ask a vision-language model to analyse an uploaded image. The image travels
 * as a base64 data-URL inside an OpenAI-compatible chat message. Tries a few
 * free Hugging Face vision models, then throws the last error if all fail.
 */
// export async function askVisionModel(system, userText, imageBase64, mime = 'image/jpeg') {
//   const messages = [
//     { role: 'system', content: system },
//     {
//       role: 'user',
//       content: [
//         { type: 'text', text: userText },
//         { type: 'image_url', image_url: { url: `data:${mime};base64,${imageBase64}` } },
//       ],
//     },
//   ];

//   let lastError = null;
//   for (const model of VISION_MODELS) {
//     const endpoints = [
//       { url: `https://api-inference.huggingface.co/models/${model}/v1/chat/completions` },
//       { url: 'https://router.huggingface.co/v1/chat/completions' },
//     ];
//     for (const { url } of endpoints) {
//       const controller = new AbortController();
//       const timer = setTimeout(() => controller.abort(), env.HUGGING_TIMEOUT);
//       try {
//         const resp = await fetch(url, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             ...(env.HUGGING_FACE_TOKEN ? { Authorization: `Bearer ${env.HUGGING_FACE_TOKEN}` } : {}),
//           },
//           body: JSON.stringify({ model, messages, max_tokens: 1200, temperature: 0.2 }),
//           signal: controller.signal,
//         });
//         if (!resp.ok) {
//           lastError = new Error(`Vision ${resp.status}: ${(await resp.text()).slice(0, 160)}`);
//           continue;
//         }
//         const out = await resp.json();
//         const content = String(out.choices?.[0]?.message?.content || '').trim();
//         if (content) return content;
//         lastError = new Error('Vision model returned an empty response.');
//       } catch (err) {
//         lastError = err;
//       } finally {
//         clearTimeout(timer);
//       }
//     }
//   }
//   throw lastError || new Error('Vision model request failed.');
// }
export async function askVisionModel(
  system,
  userText,
  imageBase64,
  mime = 'image/jpeg'
) {
  const model = 'Qwen/Qwen2.5-VL-3B-Instruct';

  const messages = [
    {
      role: 'system',
      content: system,
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: userText,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mime};base64,${imageBase64}`,
          },
        },
      ],
    },
  ];

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    env.HUGGING_TIMEOUT
  );

  try {
    if (!env.HUGGING_FACE_TOKEN) {
      throw new Error('Hugging Face token is not configured.');
    }

    const response = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.HUGGING_FACE_TOKEN}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1200,
          temperature: 0.2,
        }),
        signal: controller.signal,
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Hugging Face Vision ${response.status}: ${responseText.slice(0, 500)}`
      );
    }

    const result = JSON.parse(responseText);

    const content = String(
      result.choices?.[0]?.message?.content || ''
    ).trim();

    if (!content) {
      throw new Error('Vision model returned an empty response.');
    }

    return content;
  } 
  catch (error) {
     console.error('[VISION ERROR]', error);
    if (error.name === 'AbortError') {
      throw new Error('Vision model request timed out.');
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function classifyPlantDisease(imageBuffer) {
  if (!env.HUGGING_FACE_TOKEN) throw new Error('Hugging Face token is not configured.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.HUGGING_TIMEOUT);
  try {
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${env.PLANT_DISEASE_MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
        signal: controller.signal,
      }
    );
    const text = await response.text();
    if (!response.ok) throw new Error(`Plant classifier ${response.status}: ${text.slice(0, 300)}`);
    const predictions = JSON.parse(text);
    const top = Array.isArray(predictions)
      ? predictions
        .filter((item) => item && typeof item.label === 'string' && Number.isFinite(Number(item.score)))
        .sort((a, b) => Number(b.score) - Number(a.score))[0]
      : null;
    if (!top) throw new Error('Plant classifier returned no predictions.');
    return { label: top.label.trim(), score: Number(top.score) };
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Plant classifier request timed out.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** Strip markdown fences, quotes and blank lines from the model output. */
export function cleanAnswer(text) {
  return String(text || '')
    .replace(/```[a-z]*/gi, '')
    .replace(/`/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ');
}

/** First decimal/integer number found in the answer, or null. */
export function firstNumber(text) {
  const m = String(text || '').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}