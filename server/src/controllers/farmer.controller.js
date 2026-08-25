import { pool, withTransaction } from '../db/pool.js';
import { ApiError, asyncHandler } from '../middleware/error.js';
import { adminLog } from '../utils/audit.js';
import { uploadImage } from '../utils/cloudinary.js';

const requireText = (v, name, max) => {
  const s = String(v ?? '').trim();
  if (!s) throw new ApiError(422, `Field "${name}" is required.`);
  if (max && s.length > max) throw new ApiError(422, `Field "${name}" must be at most ${max} characters.`);
  return s;
};

const APPLICATION_FIELDS = `
  fa.id, fa.user_id, fa.full_name, fa.citizenship_no, fa.citizenship_doc, fa.kisan_doc,
  fa.sell_items, fa.description, fa.status, fa.admin_note, fa.reviewed_at, fa.created_at,
  u.username, u.email, u.avatar_url, u.name AS user_name, u.phone_number,
  sp.id AS seller_profile_id
`;

const APP_JOIN = `
  JOIN users u ON u.id = fa.user_id
  LEFT JOIN seller_profiles sp ON sp.user_id = fa.user_id
`;

/** Apply to become a farmer: documents + what they want to sell + description. */
export const applyFarmer = asyncHandler(async (req, res) => {
  const files = req.files || {};
  const citizenship = files.citizenshipDoc?.[0];
  const kisan = files.kisanDoc?.[0];
  if (!citizenship || !kisan) {
    throw new ApiError(422, 'Both the citizenship and Kisan card documents are required.');
  }

  const fullName = requireText(req.body.fullName, 'fullName', 120);
  const citizenshipNo = requireText(req.body.citizenshipNo, 'citizenshipNo', 64);
  const sellItems = requireText(req.body.sellItems, 'sellItems', 500);
  const description = requireText(req.body.description, 'description', 2000);

    const [existing, alreadySeller] = await Promise.all([
    pool.query(
      'SELECT status FROM farmer_applications WHERE user_id = $1 LIMIT 1',
      [req.user.id]
    ),
    pool.query('SELECT 1 AS ok FROM seller_profiles WHERE user_id = $1 LIMIT 1', [req.user.id]),
  ]);
  const state = existing.rows[0];
  if (state) {
    if (state.status === 'approved') throw new ApiError(409, 'You already have an approved application.');
    if (state.status === 'pending') throw new ApiError(409, 'You already have an application under review.');
    if (state.status === 'rejected') throw new ApiError(409, 'A rejected application cannot be resubmitted. Contact the administrator.');
  }

  const [citUrl, kisanUrl] = await Promise.all([
    uploadImage(citizenship.buffer, 'farmer-docs'),
    uploadImage(kisan.buffer, 'farmer-docs'),
  ]);

  const inserted = await pool.query(
    `INSERT INTO farmer_applications
       (user_id, full_name, citizenship_no, citizenship_doc, kisan_doc, sell_items, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, status, created_at`,
    [req.user.id, fullName, citizenshipNo, citUrl.url, kisanUrl.url, sellItems, description]
  );

  res.status(201).json({ success: true, data: inserted.rows[0] });
});

/** My application status (used by /user-profile and /apply-farmer). */
export const myFarmerApplication = asyncHandler(async (req, res) => {
  const [app, seller] = await Promise.all([
    pool.query(
      `SELECT ${APPLICATION_FIELDS}
       FROM farmer_applications fa ${APP_JOIN}
       WHERE fa.user_id = $1`,
      [req.user.id]
    ),
    pool.query('SELECT 1 AS ok FROM seller_profiles WHERE user_id = $1 LIMIT 1', [req.user.id]),
  ]);
  res.json({ success: true, data: app.rows[0] || null, isSeller: !!seller.rows[0] });
});

/** Superadmin: list applications, optionally filtered by status. */
export const listFarmerApplications = asyncHandler(async (req, res) => {
  const status = String(req.query.status || '');
  const allowed = ['pending', 'approved', 'rejected'];
  if (status && !allowed.includes(status)) throw new ApiError(422, 'Invalid status filter.');

  const params = [];
  let where = '';
  if (status) {
    params.push(status);
    where = `WHERE fa.status = $1`;
  }
  const apps = await pool.query(
    `SELECT ${APPLICATION_FIELDS} FROM farmer_applications fa ${APP_JOIN}
     ${where} ORDER BY fa.created_at DESC LIMIT 200`,
    params
  );
  res.json({ success: true, data: apps.rows });
});

/** Superadmin: one application with its documents. */
export const getFarmerApplication = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const app = await pool.query(
    `SELECT ${APPLICATION_FIELDS} FROM farmer_applications fa ${APP_JOIN} WHERE fa.id = $1`,
    [id]
  );
  if (!app.rows[0]) throw new ApiError(404, 'Application not found.');
  res.json({ success: true, data: app.rows[0] });
});

/**
 * Superadmin: approve → creates a seller profile and promotes the account to
 * farmer role; reject → records a note/reason. Either action happens once.
 */
export const reviewFarmerApplication = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const action = String(req.body.action || '');
  const note = String(req.body.note ?? '').trim().slice(0, 500);
  if (!['approve', 'reject'].includes(action)) throw new ApiError(422, 'Action must be "approve" or "reject".');
  if (action === 'reject' && !note) throw new ApiError(422, 'A rejection note is required.');

  const app = await pool.query(
    `SELECT fa.*, u.phone_number, u.name AS user_name
     FROM farmer_applications fa JOIN users u ON u.id = fa.user_id
     WHERE fa.id = $1`,
    [id]
  );
  const row = app.rows[0];
  if (!row) throw new ApiError(404, 'Application not found.');
  if (row.status !== 'pending') throw new ApiError(409, `This application was already ${row.status}.`);

  await pool.query('BEGIN');
  try {
    if (action === 'approve') {
      await pool.query(
        `INSERT INTO seller_profiles (user_id, shop_name, shop_description)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO NOTHING`,
        [row.user_id, `${row.full_name}'s Farm`, `Fresh produce from ${row.full_name}. Joined AgriSmart as a farmer.\nSelling: ${row.sell_items}`]
      );
      await pool.query(
        `INSERT INTO user_accounts_meta (user_id, role, is_active) VALUES ($1, 'farmer', 1)
         ON CONFLICT (user_id) DO UPDATE SET role = 'farmer'`,
        [row.user_id]
      );
    }
    await pool.query(
      `UPDATE farmer_applications
       SET status = $1, admin_note = NULLIF($2, ''), reviewed_by = $3, reviewed_at = now()
       WHERE id = $4`,
      [action === 'approve' ? 'approved' : action, note, req.user.id, id]
    );
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
  await adminLog(req.user.id, 'farmer_applications', action, `application_id=${id}, user_id=${row.user_id}`);
  res.json({
    success: true,
    data: { id, status: action, note },
    message: action === 'approve'
      ? `Approved — ${row.user_name || 'applicant'} is now a farmer and can sell on the marketplace.`
      : `Application rejected. The applicant was notified.`,
  });
});

/* ------------------------------- farmer workspace (seller-scoped) ------------------------------- */

const ITEMS_PREVIEW = `(SELECT STRING_AGG(mp.product_name || ' x' || oi.quantity, ', ')
   FROM order_items oi INNER JOIN marketplace_products mp ON mp.id = oi.product_id
   WHERE oi.order_id = o.id)`;

const SELLER_SCOPE = '';

/** /admin/farmer/summary — dashboard cards + recent sales for the seller. */
export const mySummary = asyncHandler(async (req, res) => {
  const [prod, sales, rev, recent, chart, top, pend, payments, statusCounts] = await Promise.all([
    pool.query('SELECT count(*)::int AS c FROM marketplace_products WHERE seller_id = $1', [req.user.id]),
    pool.query('SELECT count(*)::int AS c FROM orders WHERE seller_id = $1', [req.user.id]),
    pool.query(
      `SELECT COALESCE(SUM(total_amount), 0)::float AS revenue FROM orders
       WHERE seller_id = $1 AND status NOT IN ('cancelled')`,
      [req.user.id]
    ),
    pool.query(
      `SELECT o.id, ${ITEMS_PREVIEW} AS items_preview, o.customer_name, o.total_amount,
              o.status, o.order_date
       FROM orders o WHERE o.seller_id = $1 ORDER BY o.order_date DESC LIMIT 6`,
      [req.user.id]
    ),
    pool.query(
      `SELECT to_char(day, 'Mon DD') AS label, day,
              COALESCE(SUM(o.total_amount), 0)::float AS revenue, count(o.id)::int AS orders
       FROM generate_series(CURRENT_DATE - 13, CURRENT_DATE, interval '1 day') AS day
       LEFT JOIN orders o
         ON date_trunc('day', o.order_date)::date = day::date
        AND o.seller_id = $1 AND o.status <> 'cancelled'
       GROUP BY day ORDER BY day`,
      [req.user.id]
    ),
    pool.query(
      `SELECT mp.product_name, SUM(oi.quantity)::int AS qty, SUM(oi.total_price)::float AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN marketplace_products mp ON mp.id = oi.product_id
       WHERE o.seller_id = $1 AND o.status <> 'cancelled'
       GROUP BY mp.id, mp.product_name
       ORDER BY SUM(oi.quantity) DESC LIMIT 5`,
      [req.user.id]
    ),
    pool.query(
      `SELECT count(*)::int AS c FROM orders
       WHERE seller_id = $1 AND status IN ('pending','confirmed','processing','packed','shipped','out_for_delivery')`,
      [req.user.id]
    ),
    pool.query(
      `SELECT payment_method, count(*)::int AS c, SUM(total_amount)::float AS amount
       FROM orders WHERE seller_id = $1 GROUP BY payment_method`,
      [req.user.id]
    ),
    pool.query(
      `SELECT status, count(*)::int AS c FROM orders WHERE seller_id = $1 GROUP BY status`,
      [req.user.id]
    ),
  ]);
  res.json({
    success: true,
    data: {
      myProducts: prod.rows[0].c,
      mySales: sales.rows[0].c,
      revenue: Number(rev.rows[0].revenue || 0).toFixed(2),
      recentSales: recent.rows,
      growthChart: chart.rows.map((r) => ({ label: r.label, revenue: Number(r.revenue || 0), orders: r.orders })),
      topProducts: top.rows,
      pendingDeliveries: pend.rows[0].c,
      payments: payments.rows,
      statusCounts: statusCounts.rows,
    },
  });
});

/** /admin/farmer/products — the seller's own products. */
export const myProducts = asyncHandler(async (req, res) => {
  const rows = await pool.query(
    `SELECT id, product_name, category, price, quantity_available, unit, image_url,
            is_organic, created_at
     FROM marketplace_products WHERE seller_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: rows.rows });
});

/** /admin/farmer/products/:id (DELETE) — remove one of the seller's products. */
export const myProductDelete = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const del = await pool.query(
    'DELETE FROM marketplace_products WHERE id = $1 AND seller_id = $2 RETURNING id',
    [id, req.user.id]
  );
  if (!del.rows[0]) throw new ApiError(404, 'Product not found or not yours.');
  res.json({ success: true, data: { id } });
});

/** /admin/farmer/orders — orders received by this seller. */
export const mySales = asyncHandler(async (req, res) => {
  const rows = await pool.query(
    `SELECT o.id, ${ITEMS_PREVIEW} AS items_preview, o.customer_name, o.customer_phone,
            o.delivery_address, o.total_amount, o.payment_method, o.status, o.order_date
     FROM orders o WHERE o.seller_id = $1 ORDER BY o.order_date DESC LIMIT 200`,
    [req.user.id]
  );
  res.json({ success: true, data: rows.rows });
});

/** /admin/farmer/orders/:id (DELETE) — remove an order; sellers may delete their own, super admins any. */
export const deleteOrder = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new ApiError(422, 'Invalid order id.');

  const order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  if (!order.rows.length) throw new ApiError(404, 'Order not found.');
  const row = order.rows[0];

  const isSeller = Number(row.seller_id) === req.user.id;
  if (!isSeller && req.user.role !== 'super_admin') throw new ApiError(403, 'Access denied.');

  await withTransaction(async (client) => {
    await client.query('DELETE FROM order_tracking WHERE order_id = $1', [id]);
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
    await client.query('DELETE FROM payments WHERE order_id = $1', [id]);
    await client.query('DELETE FROM orders WHERE id = $1', [id]);
  });
  await adminLog(req.user.id, 'orders', 'delete', `order_id=${id}, total=${row.total_amount}, buyer_id=${row.buyer_id}`);
  res.json({ success: true, message: `Order #${id} deleted.` });
});

const FLOW = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

/** /admin/farmer/orders/:id/status — advance an order's status (seller-scoped). */
export const myOrderStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body.status || '');
  if (!FLOW.includes(status)) throw new ApiError(422, 'Invalid order status.');
  const upd = await pool.query(
    `UPDATE orders SET status = $1, updated_at = now(),
            delivered_at = CASE WHEN $1 = 'delivered' THEN now() ELSE delivered_at END
     WHERE id = $2 AND seller_id = $3 RETURNING id, status`,
    [status, id, req.user.id]
  );
  if (!upd.rows[0]) throw new ApiError(404, 'Order not found or not yours.');
  res.json({ success: true, data: upd.rows[0] });
});