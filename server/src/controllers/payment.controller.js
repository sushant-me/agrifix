import { pool, withTransaction } from '../db/pool.js';
import { ApiError, asyncHandler } from '../middleware/error.js';
import { env } from '../config/env.js';
import { khaltiInitiate, khaltiLookup } from '../utils/payments.js';
import { insertTracking } from '../utils/audit.js';

/** Resolve the batch for the logged-in user (Khalti only). */
async function getBatchPayments(userId, batch) {
  const { rows } = await pool.query(
    `SELECT p.id, p.order_id, p.amount, p.payment_status, p.khalti_pidx,
            o.customer_name, o.customer_phone, o.buyer_id
     FROM payments p INNER JOIN orders o ON o.id = p.order_id
     WHERE p.checkout_batch = $1 AND o.buyer_id = $2 AND p.payment_method = 'khalti'
     ORDER BY p.id ASC`,
    [batch, userId]
  );
  return rows;
}

/** GET /api/payments/khalti/init?batch=... → { payment_url } (or already paid). */
export const khaltiInit = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  const { batch } = req.query;
  if (!batch) throw new ApiError(422, 'Missing batch reference.');

  const payments = await getBatchPayments(req.user.id, batch);
  if (!payments.length) throw new ApiError(404, 'Batch not found.');
  if (payments.every((p) => p.payment_status === 'paid')) {
    return res.json({ success: true, data: { alreadyPaid: true, redirect: '/my-orders?payment=already_paid' } });
  }

  const totalAmount = payments.reduce((s, p) => s + Number(p.amount), 0);
  const first = payments[0];
  const returnUrl = `${env.CLIENT_URL}/api/payments/khalti/callback?batch=${encodeURIComponent(batch)}`;

  const { paymentUrl, pidx } = await khaltiInitiate({
    batchRefId: batch,
    amount: totalAmount,
    name: first.customer_name || 'Customer',
    phone: first.customer_phone || '98' + String(Math.floor(Math.random() * 90000000 + 10000000)),
    email: '',
    returnUrl,
    websiteUrl: env.CLIENT_URL,
  });

  // Store the pidx so the callback can be matched even if the redirect drops it.
  await pool.query(
    'UPDATE payments SET khalti_pidx = $1 WHERE checkout_batch = $2 AND payment_method = $3',
    [pidx, batch, 'khalti']
  );

  res.json({ success: true, data: { paymentUrl } });
});

/**
 * GET /api/payments/khalti/callback?batch=...&pidx=...
 * Khalti redirects the browser here after payment. We verify server-side
 * and bounce the user back to the SPA with the outcome.
 */
export const khaltiCallback = asyncHandler(async (req, res) => {
  const { batch, pidx } = req.query;

  // Always prefer the latest pidx stored for this batch. A delayed redirect
  // from an earlier retry must not report on the new attempt.
  let pidxToCheck = null;
  if (batch) {
    const found = await pool.query(
      'SELECT khalti_pidx FROM payments WHERE checkout_batch = $1 AND payment_method = $2 LIMIT 1',
      [batch, 'khalti']
    );
    pidxToCheck = found.rows[0]?.khalti_pidx || pidx;
  }

  const { rows } = await pool.query(
    `SELECT p.id, p.order_id, p.amount, p.payment_status FROM payments p
     WHERE p.checkout_batch = $1 AND p.payment_method = $2`,
    [batch, 'khalti']
  );

  let outcome = 'error';
  if (!rows.length) {
    outcome = 'batch_not_found';
  } else if (rows.every((r) => r.payment_status === 'paid')) {
    outcome = 'success';
  } else if (!pidxToCheck) {
    outcome = 'error';
  } else {
    let lookup;
    try {
      lookup = await khaltiLookup(pidxToCheck);
    } catch {
      return res.redirect(`${env.CLIENT_URL}/payment-result?result=error&batch=${encodeURIComponent(batch || '')}`);
    }

    if (lookup.paid) {
      await withTransaction(async (client) => {
        for (const row of rows) {
          await client.query(
            `UPDATE payments SET payment_status = 'paid', khalti_transaction_id = $1,
                    khalti_response = $2, paid_at = NOW(), updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [lookup.txnId || null, JSON.stringify(lookup.response), row.id]
          );
          await client.query(
            `UPDATE orders SET status = 'confirmed' WHERE id = $1 AND status = 'pending'`,
            [row.order_id]
          );
          await insertTracking(client, row.order_id, 'confirmed', 'Khalti payment verified and order confirmed.');
        }
      });
      outcome = 'success';
    } else if (['pending', 'initiated', 'partially_paid'].includes(lookup.status)) {
      outcome = 'pending';
    } else {
      outcome = 'failed';
    }
  }

  res.redirect(`${env.CLIENT_URL}/payment-result?result=${outcome}&batch=${encodeURIComponent(batch || '')}`);
});