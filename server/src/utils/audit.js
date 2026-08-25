import { pool } from '../db/pool.js';

/**
 * Write an entry into the admin activity log (audit trail).
 */
export async function adminLog(adminUserId, module, action, details = '') {
  try {
    await pool.query(
      `INSERT INTO admin_activity_logs (admin_user_id, module, action, details)
       VALUES ($1, $2, $3, $4)`,
      [adminUserId, module, action, details]
    );
  } catch (err) {
    console.error('[audit] log failed:', err.message);
  }
}

/** Insert a notification visible in the admin panel. */
export async function pushAdminNotification(title, message, type = 'info') {
  try {
    await pool.query(
      `INSERT INTO admin_notifications (title, message, type) VALUES ($1, $2, $3)`,
      [title, message, type]
    );
  } catch (err) {
    console.error('[audit] notification failed:', err.message);
  }
}

/** Insert an order-tracking event. */
export async function insertTracking(client, orderId, status, note, changedBy = null) {
  await client.query(
    `INSERT INTO order_tracking (order_id, status, note, changed_by) VALUES ($1, $2, $3, $4)`,
    [orderId, status, note, changedBy]
  );
}
