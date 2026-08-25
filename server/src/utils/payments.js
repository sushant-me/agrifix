import axios from 'axios';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/error.js';

export const ORDER_STATUS_FLOW = [
  'pending', 'confirmed', 'processing', 'packed', 'shipped',
  'out_for_delivery', 'delivered', 'cancelled',
];
export const PAYMENT_METHODS = ['cod', 'khalti'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export const batchRef = () => `AGRI${new Date().toISOString().slice(0, 10).replaceAll('-', '')}${Math.random().toString(16).slice(2, 8)}`;

export function estimatedDelivery() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d.toISOString().slice(0, 10);
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Initiate a Khalti payment for a checkout batch.
 * Returns the hosted payment URL.
 */
export async function khaltiInitiate({ batchRefId, amount, name, phone, email, returnUrl, websiteUrl }) {
  if (!env.KHALTI_SECRET_KEY || env.KHALTI_SECRET_KEY.includes('REPLACE')) {
    throw new ApiError(500, 'Khalti is not configured. Use COD or set KHALTI_SECRET_KEY.');
  }
  const payload = {
    return_url: returnUrl,
    website_url: websiteUrl || env.APP_URL,
    amount: Math.round(amount * 100), // paisa
    purchase_order_id: batchRefId,
    purchase_order_name: `AgriSmart Order ${batchRefId}`,
    customer_info: { name, email: email || '', phone },
  };
  const res = await axios.post(`${env.KHALTI_BASE_URL}/epayment/initiate/`, payload, {
    headers: { Authorization: `Key ${env.KHALTI_SECRET_KEY}` },
    timeout: 20000,
  });
  if (!res.data?.payment_url) throw new ApiError(502, 'Khalti initiate failed.');
  return { paymentUrl: res.data.payment_url, pidx: res.data.pidx };
}

/**
 * Look up a Khalti payment by pidx.
 * Returns the gateway status plus a normalized paid flag.
 */
export async function khaltiLookup(pidx) {
  const res = await axios.post(
    `${env.KHALTI_BASE_URL}/epayment/lookup/`,
    { pidx },
    { headers: { Authorization: `Key ${env.KHALTI_SECRET_KEY}` }, timeout: 20000 }
  );
  const d = res.data || {};
  const paid = ['completed', 'paid'].includes(d.status);
  return { paid, status: String(d.status || '').toLowerCase(), txnId: d.transaction_id, response: d };
}
