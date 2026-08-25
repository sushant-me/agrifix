import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../db/pool.js';
import { ApiError, asyncHandler } from '../middleware/error.js';
import { adminLog } from '../utils/audit.js';
import { parseCsvPreview } from '../utils/csv.js';
import { DATASETS_DIR } from '../middleware/upload.js';
import { uploadProductGallery, saveProductGalleryRows, replaceProductImages } from '../utils/media.js';

const safeCount = async (table) => {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) AS total FROM ${table}`);
    return Number(rows[0].total);
  } catch {
    return 0;
  }
};

/* ---------------------------------------------------------------- dashboard */

export const dashboardSummary = asyncHandler(async (_req, res) => {
  const [users, products, orders, news, datasets, models, pendingOrders, activeUsers, revenue] =
    await Promise.all([
      safeCount('users'),
      safeCount('marketplace_products'),
      safeCount('orders'),
      safeCount('news'),
      safeCount('ml_datasets'),
      safeCount('ml_models'),
      safeCount('orders WHERE status = \'pending\''),
      safeCount('user_accounts_meta WHERE is_active = 1'),
      pool
        .query(`SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status IN ('confirmed','shipped','delivered')`)
        .then((r) => Number(r.rows[0].total))
        .catch(() => 0),
    ]);

  res.json({
    success: true,
    data: {
      users, activeUsers, products, orders, pendingOrders, news, datasets, models,
      totalRevenue: Math.round(revenue * 100) / 100,
    },
  });
});

export const recentActivity = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT l.id, l.module, l.action, l.details, l.created_at, u.username
     FROM admin_activity_logs l LEFT JOIN users u ON u.id = l.admin_user_id
     ORDER BY l.created_at DESC LIMIT 25`
  );
  res.json({ success: true, data: rows });
});

export const notifications = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, title, message, type, is_read, created_at FROM admin_notifications ORDER BY created_at DESC LIMIT 20'
  );
  res.json({ success: true, data: rows });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  await pool.query('UPDATE admin_notifications SET is_read = 1 WHERE id = $1', [Number(req.body.id)]);
  res.json({ success: true });
});

/* ------------------------------------------------------------------- users */

export const usersList = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.email, u.created_at,
            COALESCE(m.role, 'user') AS role, COALESCE(m.is_active, 1) AS is_active
     FROM users u LEFT JOIN user_accounts_meta m ON m.user_id = u.id
     ORDER BY u.id DESC`
  );
  res.json({ success: true, data: rows });
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id ?? req.body.userId);
  const isActive = req.body.isActive ? 1 : 0;
  if (!userId) throw new ApiError(422, 'Invalid user id.');
  await pool.query(
    `INSERT INTO user_accounts_meta (user_id, role, is_active) VALUES ($1, 'user', $2)
     ON CONFLICT (user_id) DO UPDATE SET is_active = $2`,
    [userId, isActive]
  );
  await adminLog(req.user.id, 'users', 'toggle_active', `user_id=${userId}, active=${isActive}`);
  res.json({ success: true });
});

export const setUserRole = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id ?? req.body.userId);
  const role = String(req.body.role || 'user');
  const allowed = ['farmer', 'vendor', 'user'];
  if (!userId) throw new ApiError(422, 'Invalid user id.');
  if (!allowed.includes(role)) throw new ApiError(422, 'Invalid role.');
  if (userId === req.user.id) throw new ApiError(422, 'You cannot change your own role.');

  const current = await pool.query(
    'SELECT COALESCE(role, \'user\') AS role FROM user_accounts_meta WHERE user_id = $1',
    [userId]
  );
  if (current.rows[0]?.role === 'super_admin') {
    throw new ApiError(422, 'You cannot change the role of a Super Admin account.');
  }

  await pool.query(
    `INSERT INTO user_accounts_meta (user_id, role, is_active) VALUES ($1, $2, 1)
     ON CONFLICT (user_id) DO UPDATE SET role = $2`,
    [userId, role]
  );
  await adminLog(req.user.id, 'users', 'set_role', `user_id=${userId}, role=${role}`);
  res.json({ success: true });
});

export const createUser = asyncHandler(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');
  const role = String(req.body.role || 'user');
  const allowed = ['user', 'farmer', 'vendor'];
  if (username.length < 3) throw new ApiError(422, 'Username must be at least 3 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(422, 'A valid email is required.');
  if (password.length < 8) throw new ApiError(422, 'Password must be at least 8 characters.');
  if (!allowed.includes(role)) throw new ApiError(422, 'Invalid role.');

  const exists = await pool.query(
    'SELECT id FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
    [username.toLowerCase(), email]
  );
  if (exists.rows[0]) throw new ApiError(422, 'Username or email is already in use.');

  const hash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
    [username, email, hash]
  );
  const userId = result.rows[0].id;
  if (role !== 'user') {
    await pool.query(
      `INSERT INTO user_accounts_meta (user_id, role, is_active) VALUES ($1, $2, 1)
       ON CONFLICT (user_id) DO UPDATE SET role = $2`,
      [userId, role]
    );
  }
  await adminLog(req.user.id, 'users', 'create', `user_id=${userId}, role=${role}`);
  res.status(201).json({ success: true, data: { id: userId } });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  if (userId === req.user.id) throw new ApiError(422, 'You cannot delete your own account.');

  const target = await pool.query(
    'SELECT COALESCE(m.role, \'user\') AS role FROM users u LEFT JOIN user_accounts_meta m ON m.user_id = u.id WHERE u.id = $1',
    [userId]
  );
  if (!target.rows[0]) throw new ApiError(404, 'User not found.');
  if (target.rows[0].role === 'super_admin') {
    throw new ApiError(422, 'You cannot delete a Super Admin account.');
  }

  try {
    await withTransaction(async (client) => {
      await client.query('DELETE FROM user_accounts_meta WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM wishlist WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM shopping_cart WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM seller_profiles WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    });
  } catch {
    throw new ApiError(422, 'This user has orders or other records. Deactivate them instead of deleting.');
  }
  await adminLog(req.user.id, 'users', 'delete', `user_id=${userId}`);
  res.json({ success: true });
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id ?? req.body.userId);
  const password = String(req.body.newPassword || '');
  if (!userId) throw new ApiError(422, 'Invalid user id.');
  if (password.length < 8) throw new ApiError(422, 'Password must be at least 8 characters.');
  const hash = await bcrypt.hash(password, 12);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, userId]);
  await adminLog(req.user.id, 'users', 'reset_password', `user_id=${userId}`);
  res.json({ success: true });
});

/* --------------------------------------------------------------- products */

export const adminProductsList = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.product_name, p.category, p.price, p.quantity_available, p.unit,
            p.location, p.is_organic, p.created_at, p.seller_id, p.image_url,
            COALESCE(u.username, 'Unknown') AS seller_name
     FROM marketplace_products p LEFT JOIN users u ON u.id = p.seller_id
     ORDER BY p.id DESC`
  );
  res.json({ success: true, data: rows });
});

export const adminProductSave = asyncHandler(async (req, res) => {
  const id = Number(req.body.id || 0);
  const sellerId = Number(req.body.sellerId);
  const productName = String(req.body.productName || '').trim();
  const category = String(req.body.category || '').trim();
  const description = req.body.description || null;
  const price = Number(req.body.price);
  const quantity = Number(req.body.quantityAvailable ?? req.body.quantity ?? 0);
  const unit = String(req.body.unit || 'kg');
  const location = String(req.body.location || '').trim();
  const isOrganic = req.body.isOrganic ? 1 : 0;

  if (!sellerId) throw new ApiError(422, 'Seller is required.');
  if (!productName) throw new ApiError(422, 'Product name is required.');
  if (!(price > 0)) throw new ApiError(422, 'Price must be greater than zero.');
  if (!(quantity >= 0)) throw new ApiError(422, 'Quantity cannot be negative.');

  if (id > 0) {
    let cover = req.body.currentImageUrl || null;
    if ((req.files || []).length) {
      const uploaded = await replaceProductImages(id, req.files.slice(0, 4));
      cover = uploaded[0]?.url || null;
    }
    await pool.query(
      `UPDATE marketplace_products SET seller_id = $1, product_name = $2, category = $3,
              description = $4, price = $5, quantity_available = $6, unit = $7,
              image_url = $8, location = $9, is_organic = $10
       WHERE id = $11`,
      [sellerId, productName, category, description, price, quantity, unit, cover, location, isOrganic, id]
    );
    await adminLog(req.user.id, 'marketplace', 'update_product', `product_id=${id}`);
  } else {
    const uploads = (req.files || []).slice(0, 4);
    if (!uploads.length) throw new ApiError(422, 'Add at least one product photo.');
    const uploaded = await uploadProductGallery(uploads);
    const cover = uploaded[0]?.url || null;
    const inserted = await pool.query(
      `INSERT INTO marketplace_products
        (seller_id, product_name, category, description, price, quantity_available, unit, image_url, location, is_organic)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [sellerId, productName, category, description, price, quantity, unit, cover, location, isOrganic]
    );
    await saveProductGalleryRows(inserted.rows[0].id, uploaded);
    await adminLog(req.user.id, 'marketplace', 'create_product', productName);
  }

  res.json({ success: true });
});

/* ------------------------------------------------------------------ orders */

export const adminOrdersList = asyncHandler(async (req, res) => {
  const { status, paymentMethod, paymentStatus, date } = req.query;
  const conditions = [];
  const params = [];
  let i = 1;

  if (status) { conditions.push(`o.status = $${i++}`); params.push(status); }
  if (paymentMethod) { conditions.push(`p.payment_method = $${i++}`); params.push(paymentMethod); }
  if (paymentStatus) { conditions.push(`p.payment_status = $${i++}`); params.push(paymentStatus); }
  if (date) { conditions.push(`DATE(o.order_date) = $${i++}`); params.push(date); }

  const { rows } = await pool.query(
    `SELECT o.id, o.order_date, o.total_amount, o.status, o.customer_name, o.customer_phone,
            o.delivery_address, o.estimated_delivery_date, o.buyer_id,
            buyer.username AS buyer_name,
            p.payment_method, p.payment_status, p.khalti_transaction_id
     FROM orders o
     LEFT JOIN users buyer ON buyer.id = o.buyer_id
     LEFT JOIN payments p ON p.order_id = o.id
     ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
     ORDER BY o.id DESC`,
    params
  );
  res.json({ success: true, data: rows });
});

/* -------------------------------------------------------------------- news */

export const newsList = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT id, title, description, url, image, published_at FROM news ORDER BY id DESC LIMIT 150');
  res.json({ success: true, data: rows });
});

export const newsSave = asyncHandler(async (req, res) => {
  const id = Number(req.body.id || 0);
  const title = String(req.body.title || '').trim();
  if (!title) throw new ApiError(422, 'Title is required.');
  const description = req.body.description || null;
  const url = req.body.url || null;
  const image = req.body.image || null;
  const publishedAt = req.body.publishedAt || new Date().toISOString();

  if (id > 0) {
    await pool.query(
      'UPDATE news SET title = $1, description = $2, url = $3, image = $4, published_at = $5 WHERE id = $6',
      [title, description, url, image, publishedAt, id]
    );
    await adminLog(req.user.id, 'content', 'update_news', `news_id=${id}`);
  } else {
    await pool.query(
      'INSERT INTO news (title, description, url, image, published_at) VALUES ($1, $2, $3, $4, $5)',
      [title, description, url, image, publishedAt]
    );
    await adminLog(req.user.id, 'content', 'create_news', title);
  }
  res.json({ success: true });
});

export const newsDelete = asyncHandler(async (req, res) => {
  const id = Number(req.body.id);
  await pool.query('DELETE FROM news WHERE id = $1', [id]);
  await adminLog(req.user.id, 'content', 'delete_news', `news_id=${id}`);
  res.json({ success: true });
});

/* ----------------------------------------------------------------- support */

export const contactMessagesList = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM contact_messages ORDER BY id DESC');
  res.json({ success: true, data: rows });
});

export const contactMessageDelete = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM contact_messages WHERE id = $1', [Number(req.params.id)]);
  await adminLog(req.user.id, 'support', 'delete_contact', `message_id=${req.params.id}`);
  res.json({ success: true });
});

export const qnaAdminList = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT id, question, answer, created_at FROM qna ORDER BY id DESC');
  res.json({ success: true, data: rows });
});

export const qnaAnswer = asyncHandler(async (req, res) => {
  const id = Number(req.body.id);
  const answer = String(req.body.answer || '').trim();
  if (!answer) throw new ApiError(422, 'Answer is required.');
  await pool.query('UPDATE qna SET answer = $1 WHERE id = $2', [answer, id]);
  await adminLog(req.user.id, 'support', 'answer_qna', `qna_id=${id}`);
  res.json({ success: true });
});

/* ---------------------------------------------------------------------- ML */

export const datasetsList = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT d.id, d.dataset_name, d.original_filename, d.row_count, d.column_count,
            d.file_size_bytes, d.created_at, u.username AS uploaded_by_name
     FROM ml_datasets d LEFT JOIN users u ON u.id = d.uploaded_by
     ORDER BY d.id DESC`
  );
  res.json({ success: true, data: rows });
});

export const datasetUpload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(422, 'CSV / XLS / XLSX file required.');
  const filePath = `${DATASETS_DIR}/${req.file.filename}`;

  let rowCount = null;
  let columnCount = null;
  const isCsv = req.file.mimetype === 'text/csv' || req.file.originalname.toLowerCase().endsWith('.csv');
  if (isCsv) {
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    columnCount = lines[0] ? lines[0].split(',').length : 0;
    rowCount = Math.max(0, lines.length - 1);
  }

  const datasetName = String(req.body.datasetName || '').trim() || req.file.originalname;

  const inserted = await pool.query(
    `INSERT INTO ml_datasets
       (dataset_name, original_filename, stored_path, row_count, column_count, file_size_bytes, mime_type, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      datasetName, req.file.originalname,
      `uploads/datasets/${req.file.filename}`, rowCount, columnCount,
      req.file.size, req.file.mimetype, req.user.id,
    ]
  );
  await adminLog(req.user.id, 'ml', 'upload_dataset', `dataset_id=${inserted.rows[0].id}`);
  res.status(201).json({ success: true, message: 'Dataset uploaded.' });
});

export const datasetDelete = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const found = await pool.query('SELECT stored_path FROM ml_datasets WHERE id = $1', [id]);
  if (found.rows.length) {
    const abs = `${DATASETS_DIR}/${found.rows[0].stored_path.split('/').pop()}`;
    fs.unlink(abs, () => {});
    await pool.query('DELETE FROM ml_datasets WHERE id = $1', [id]);
  }
  await adminLog(req.user.id, 'ml', 'delete_dataset', `dataset_id=${id}`);
  res.json({ success: true });
});

export const datasetPreview = asyncHandler(async (req, res) => {
  const id = Number(req.params.id || req.query.id);
  const found = await pool.query('SELECT stored_path, original_filename FROM ml_datasets WHERE id = $1', [id]);
  if (!found.rows.length) throw new ApiError(404, 'Dataset not found.');
  const storedPath = found.rows[0].stored_path;
  const filename = found.rows[0].original_filename.toLowerCase();

  if (!filename.endsWith('.csv')) {
    return res.json({
      success: true,
      data: { headers: [], rows: [], note: 'Preview is available for CSV datasets. XLS/XLSX can still be used for storage.' },
    });
  }

  const abs = `${DATASETS_DIR}/${storedPath.split('/').pop()}`;
  if (!fs.existsSync(abs)) throw new ApiError(404, 'Stored file is missing.');
  const { headers, rows } = parseCsvPreview(fs.readFileSync(abs, 'utf8'));
  res.json({ success: true, data: { headers, rows, note: 'Showing first 30 rows.' } });
});

export const modelsList = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT m.id, m.model_name, m.target_column, m.algorithm, m.model_path,
            m.metrics_json, m.trained_at, d.dataset_name, u.username AS trained_by_name
     FROM ml_models m
     LEFT JOIN ml_datasets d ON d.id = m.dataset_id
     LEFT JOIN users u ON u.id = m.trained_by
     ORDER BY m.id DESC`
  );
  res.json({ success: true, data: rows });
});


export const trainModel = asyncHandler(async (_req, res) => {
  res.status(501).json({
    success: false,
    message: 'Local model training is not implemented. No uploaded dataset is connected to a trained prediction model.',
  });
});

/* -------------------------------------------------------------------- farm */

export const FARM_TABLES = {
  irrigation: 'farm_irrigation_schedules',
  soil: 'farm_soil_records',
  tasks: 'farm_tasks',
  weather: 'farm_weather_reports',
  devices: 'farm_sensor_devices',
};

const farmColumns = {
  irrigation: ['farm_zone', 'start_time', 'duration_minutes', 'status', 'notes', 'created_by'],
  soil: ['farm_zone', 'ph_value', 'nitrogen_level', 'phosphorus_level', 'potassium_level', 'recorded_at', 'remarks', 'created_by'],
  tasks: ['task_name', 'assigned_to', 'due_date', 'priority', 'status', 'notes', 'created_by'],
  weather: ['location', 'temperature', 'humidity', 'rainfall_mm', 'wind_speed', 'report_time', 'source'],
  devices: ['device_name', 'device_type', 'farm_zone', 'is_online', 'last_seen', 'metadata_json'],
};

const farmDefaults = {
  irrigation: { status: 'scheduled' },
  soil: { recorded_at: () => new Date().toISOString() },
  tasks: { status: 'pending', priority: 'medium' },
  weather: { report_time: () => new Date().toISOString() },
  devices: { is_online: 1 },
};

export const farmList = asyncHandler(async (req, res) => {
  const module = String(req.query.module || 'tasks');
  const table = FARM_TABLES[module];
  if (!table) return res.json({ success: true, data: [] });
  try {
    const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 200`);
    res.json({ success: true, data: rows });
  } catch {
    res.json({ success: true, data: [] });
  }
});

export const farmSave = asyncHandler(async (req, res) => {
  const module = String(req.body.module || '');
  const table = FARM_TABLES[module];
  if (!table) throw new ApiError(422, 'Invalid farm module.');
  const columns = farmColumns[module];
  const id = Number(req.body.id || 0);

  const values = columns.map((c) => {
    if (c === 'created_by') return req.user.id;
    const raw = req.body[c];
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      const def = farmDefaults[module]?.[c];
      return typeof def === 'function' ? def() : (def ?? null);
    }
    return raw;
  });

  if (id > 0) {
    const sets = columns.map((c, i) => `${c} = $${i + 1}`);
    await pool.query(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${columns.length + 1}`, [...values, id]);
  } else {
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    await pool.query(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
  }
  await adminLog(req.user.id, 'farm', `save_${module}`, `id=${id || 'new'}`);
  res.json({ success: true });
});

export const farmDelete = asyncHandler(async (req, res) => {
  const module = String(req.params.module);
  const table = FARM_TABLES[module];
  if (!table) throw new ApiError(422, 'Invalid farm module.');
  await pool.query(`DELETE FROM ${table} WHERE id = $1`, [Number(req.params.id)]);
  await adminLog(req.user.id, 'farm', `delete_${module}`, `id=${req.params.id}`);
  res.json({ success: true });
});

/* ------------------------------------------------------------------ export */

const EXPORT_QUERIES = {
  users: `SELECT u.id, u.username, COALESCE(m.role, 'user') AS role, COALESCE(m.is_active, 1) AS is_active, u.created_at
           FROM users u LEFT JOIN user_accounts_meta m ON m.user_id = u.id ORDER BY u.id DESC`,
  products: `SELECT id, seller_id, product_name, category, price, quantity_available, unit, location, is_organic, created_at
             FROM marketplace_products ORDER BY id DESC`,
  predictions: `SELECT id, model_id, input_json, output_json, predicted_by, predicted_at FROM ml_prediction_logs ORDER BY id DESC`,
  orders: `SELECT id, buyer_id, seller_id, order_date, total_amount, status, payment_method, delivery_address FROM orders ORDER BY id DESC`,
};

const toCsv = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
};

export const exportReport = asyncHandler(async (req, res) => {
  const type = String(req.query.type || 'orders');
  const query = EXPORT_QUERIES[type];
  if (!query) throw new ApiError(422, 'Invalid export type.');
  let rows;
  try {
    const result = await pool.query(query);
    rows = result.rows;
  } catch {
    rows = [];
  }
  res.json({ success: true, data: { filename: `${type}_report.csv`, csv: toCsv(rows) } });
});
