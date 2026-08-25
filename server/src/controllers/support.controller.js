import { pool } from '../db/pool.js';
import { ApiError, asyncHandler } from '../middleware/error.js';

/* ------------------------------------------------------------------ Q & A */

export const qnaList = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM qna ORDER BY created_at DESC LIMIT 100');
  res.json({ success: true, data: rows });
});

export const qnaAsk = asyncHandler(async (req, res) => {
  const question = String(req.body.question || '').trim();
  if (!question) throw new ApiError(422, 'Question is required.');
  if (question.length > 2000) throw new ApiError(422, 'Question is too long.');
  const inserted = await pool.query('INSERT INTO qna (question) VALUES ($1) RETURNING id, question, created_at', [
    question,
  ]);
  res.status(201).json({ success: true, message: 'Question submitted.', data: inserted.rows[0] });
});

/* ---------------------------------------------------------------- contact */

export const contactUs = asyncHandler(async (req, res) => {
  const { fullName, email, phone, address, message } = req.body;
  if (!fullName?.trim() || !email || !message?.trim()) {
    throw new ApiError(422, 'Name, email and message are required.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(422, 'Enter a valid email address.');
  if (phone && !/^\d{10}$/.test(String(phone))) throw new ApiError(422, 'Phone must be 10 digits.');

  await pool.query(
    `INSERT INTO contact_messages (full_name, email, phone, address, message) VALUES ($1, $2, $3, $4, $5)`,
    [String(fullName).trim(), email, phone || null, address || null, String(message).trim()]
  );
  res.status(201).json({ success: true, message: 'Message sent successfully.' });
});