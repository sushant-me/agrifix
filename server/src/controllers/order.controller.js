import { pool, withTransaction } from '../db/pool.js';
import { ApiError, asyncHandler } from '../middleware/error.js';
import { PAYMENT_METHODS, ORDER_STATUS_FLOW, batchRef, estimatedDelivery, round2 } from '../utils/payments.js';
import { insertTracking, adminLog } from '../utils/audit.js';

/* -------------------------------------------------------------- place order */

export const placeOrder = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  if (req.method === 'GET') throw new ApiError(405, 'Method not allowed.');

  const { customerName, customerPhone, deliveryAddress, notes, paymentMethod } = req.body;

  if (!customerName?.trim() || !customerPhone?.trim() || !deliveryAddress?.trim()) {
    throw new ApiError(422, 'Name, phone and delivery address are required.');
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw new ApiError(422, 'Invalid payment method.');
  }

  const result = await withTransaction(async (client) => {
    // Update user's phone number and delivery address if provided
    if (customerPhone || deliveryAddress) {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (customerPhone?.trim()) {
        updates.push(`phone_number = $${paramIndex++}`);
        values.push(customerPhone.trim());
      }
      if (deliveryAddress?.trim()) {
        updates.push(`delivery_address = $${paramIndex++}`);
        values.push(deliveryAddress.trim());
      }

      if (updates.length > 0) {
        values.push(req.user.id);
        // await client.query(
        //   `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
        //   values
        // );
        await client.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }
    }
    const cart = await client.query(
      `SELECT sc.id AS cart_id, sc.product_id, sc.quantity,
              mp.product_name, mp.price, mp.seller_id, mp.quantity_available
       FROM shopping_cart sc
       INNER JOIN marketplace_products mp ON mp.id = sc.product_id
       WHERE sc.user_id = $1
       ORDER BY sc.id ASC`,
      [req.user.id]
    );
    if (!cart.rows.length) throw new ApiError(422, 'Your cart is empty.');

    for (const item of cart.rows) {
      if (Number(item.quantity_available) < Number(item.quantity)) {
        throw new ApiError(422, `"${item.product_name}" has only ${item.quantity_available} available.`);
      }
    }

    // Group cart items per seller.
    const sellerBuckets = new Map();
    for (const item of cart.rows) {
      if (!sellerBuckets.has(item.seller_id)) sellerBuckets.set(item.seller_id, []);
      sellerBuckets.get(item.seller_id).push(item);
    }

    const batch = batchRef();
    const subtotal = cart.rows.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
    const totalTax = round2(subtotal * 0.05);
    const orderIds = [];

    // Tax is allocated pro-rata; the last seller gets the rounding remainder.
    let allocatedTax = 0;
    const bucketArr = [...sellerBuckets.entries()];
    for (let index = 0; index < bucketArr.length; index++) {
      const [sellerId, items] = bucketArr[index];
      const sellerSub = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
      let tax = round2((sellerSub / subtotal) * totalTax);
      if (index === bucketArr.length - 1) tax = round2(totalTax - allocatedTax);
      allocatedTax += tax;
      const amount = round2(sellerSub + tax);

      const order = await client.query(
        `INSERT INTO orders
           (buyer_id, seller_id, total_amount, status, payment_method, delivery_address,
            customer_name, customer_phone, notes, estimated_delivery_date)
         VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          req.user.id, sellerId, amount, paymentMethod,
          String(deliveryAddress).trim(), String(customerName).trim(),
          String(customerPhone).trim(), notes || null, estimatedDelivery(),
        ]
      );
      orderIds.push(order.rows[0].id);

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price_per_unit, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.rows[0].id, item.product_id, item.quantity, item.price, round2(Number(item.price) * item.quantity)]
        );
      }

      // Stock deduction with guard (no negative stock), per product.
      for (const item of items) {
        const stock = await client.query(
          `UPDATE marketplace_products SET quantity_available = quantity_available - $1
           WHERE id = $2 AND quantity_available >= $1`,
          [Number(item.quantity), Number(item.product_id)]
        );
        if (!stock.rowCount) {
          throw new ApiError(422, `Not enough stock for ${item.product_name}. Please review your cart.`);
        }
      }

      await insertTracking(client, order.rows[0].id, 'pending', 'Order placed by customer.');
    }

    // One payment row per order, sharing the same checkout batch.
    for (const orderId of orderIds) {
      const amountSum = await client.query('SELECT total_amount FROM orders WHERE id = $1', [orderId]);
      await client.query(
        `INSERT INTO payments (order_id, checkout_batch, payment_method, amount, payment_status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [orderId, batch, paymentMethod, amountSum.rows[0].total_amount]
      );
    }

    await client.query('DELETE FROM shopping_cart WHERE user_id = $1', [req.user.id]);

    return {
      orderIds,
      orderCount: orderIds.length,
      batch,
      amount: round2(subtotal + totalTax),
    };
  });

  res.status(201).json({
    success: true,
    message: 'Order placed successfully.',
    ...result,
    redirect: paymentMethod === 'cod' ? '/my-orders?placed=1' : `/payment/khalti?batch=${result.batch}`,
  });
});

/* ------------------------------------------------------------------- list */

export const myOrders = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  const { status, payment } = req.query;
  const conditions = ['o.buyer_id = $1'];
  const params = [req.user.id];
  let paramIndex = 2;

  if (status && ORDER_STATUS_FLOW.includes(status)) {
    conditions.push(`o.status = $${paramIndex++}`);
    params.push(status);
  }
  if (payment && PAYMENT_METHODS.includes(payment)) {
    conditions.push(`p.payment_method = $${paramIndex++}`);
    params.push(payment);
  }

  const { rows } = await pool.query(
    `SELECT o.id, o.order_date, o.total_amount, o.status, o.payment_method,
            o.customer_name, o.estimated_delivery_date, p.payment_status,
            (SELECT STRING_AGG(mp.product_name || ' x' || oi.quantity, ', ')
             FROM order_items oi INNER JOIN marketplace_products mp ON mp.id = oi.product_id
             WHERE oi.order_id = o.id) AS items_preview
     FROM orders o
     INNER JOIN payments p ON p.order_id = o.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY o.id DESC`,
    params
  );
  res.json({ success: true, data: rows });
});

/* ------------------------------------------------------------ order detail */

export const orderDetails = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  const orderId = Number(req.params.id);
  if (!orderId) throw new ApiError(422, 'Invalid order id.');

  const order = await pool.query(
    `SELECT o.*, buyer.username AS buyer_name, buyer.avatar_url AS buyer_avatar,
            seller.username AS seller_name,
            p.payment_method, p.payment_status, p.khalti_transaction_id
     FROM orders o
     LEFT JOIN users buyer ON buyer.id = o.buyer_id
     LEFT JOIN users seller ON seller.id = o.seller_id
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.id = $1`,
    [orderId]
  );
  if (!order.rows.length) throw new ApiError(404, 'Order not found.');
  const row = order.rows[0];
  // const isBuyer = Number(row.buyer_id) === req.user.id;
  // const isSeller = Number(row.seller_id) === req.user.id;
  console.log('[ORDER DEBUG]', {
  orderId,
  buyerId: row.buyer_id,
  sellerId: row.seller_id,
  loggedInUserId: req.user?.id,
  username: req.user?.username,
  role: req.user?.role,
  buyerMatch: Number(row.buyer_id) === Number(req.user?.id),
  sellerMatch: Number(row.seller_id) === Number(req.user?.id),
});

const isBuyer = Number(row.buyer_id) === Number(req.user.id);
const isSeller = Number(row.seller_id) === Number(req.user.id);
  if (!isBuyer && !isSeller && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Access denied.');
  }

  const items = await pool.query(
    `SELECT oi.*, mp.product_name, mp.unit, mp.image_url
     FROM order_items oi
     INNER JOIN marketplace_products mp ON mp.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  const tracking = await pool.query(
    `SELECT status, note, created_at FROM order_tracking WHERE order_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [orderId]
  );

  res.json({
    success: true,
    data: { order: order.rows[0], items: items.rows, tracking: tracking.rows },
  });
});

export const trackOrder = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  const orderId = Number(req.params.id);
  if (!orderId) throw new ApiError(422, 'Invalid order id.');

  const order = await pool.query(
    `SELECT o.*, p.payment_method, p.payment_status
     FROM orders o LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.id = $1`,
    [orderId]
  );
  if (!order.rows.length) throw new ApiError(404, 'Order not found.');
  const row = order.rows[0];
  const isBuyer = Number(row.buyer_id) === req.user.id;
  const isSeller = Number(row.seller_id) === req.user.id;
  if (!isBuyer && !isSeller && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Access denied.');
  }

  let tracking = await pool.query(
    `SELECT t.status, t.note, t.created_at, u.username AS changed_by_name
     FROM order_tracking t LEFT JOIN users u ON u.id = t.changed_by
     WHERE t.order_id = $1 ORDER BY t.created_at ASC`,
    [orderId]
  );
  if (!tracking.rows.length) {
    await pool.query(
      `INSERT INTO order_tracking (order_id, status, note, changed_by) VALUES ($1, $2, $3, NULL)`,
      [orderId, order.rows[0].status, 'Order status initialized.']
    );
    tracking = await pool.query(
      `SELECT t.status, t.note, t.created_at, u.username AS changed_by_name
       FROM order_tracking t LEFT JOIN users u ON u.id = t.changed_by
       WHERE t.order_id = $1 ORDER BY t.created_at ASC`,
      [orderId]
    );
  }

  res.json({ success: true, data: { order: order.rows[0], tracking: tracking.rows } });
});

/* -------------------------------------------------------------- admin flow */

export const adminOrderStatus = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const { status, paymentStatus, note, confirmCodPayment } = req.body;

  if (!orderId) throw new ApiError(422, 'Invalid order id.');
  if (status && !ORDER_STATUS_FLOW.includes(status)) throw new ApiError(422, 'Invalid status.');

  const result = await withTransaction(async (client) => {
    const order = await client.query(
      `SELECT o.id, o.status, o.payment_method, p.payment_status
       FROM orders o LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.id = $1 LIMIT 1`,
      [orderId]
    );
    if (!order.rows.length) throw new ApiError(404, 'Order not found.');
    const row = order.rows[0];

    if (status && status !== row.status) {
      await client.query(
        `UPDATE orders
         SET status = $1,
             delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE delivered_at END
         WHERE id = $2`,
        [status, orderId]
      );
      await insertTracking(client, orderId, status, note || 'Order status changed by admin.', req.user.id);
    }

    // Payment resolution: explicit value, COD confirm, or COD auto-paid on delivery.
    let resolvedPayment = paymentStatus || row.payment_status;
    if ((confirmCodPayment === '1' || confirmCodPayment === 1 || confirmCodPayment === true) && row.payment_method === 'cod') {
      resolvedPayment = 'paid';
    }
    if (status === 'delivered' && row.payment_method === 'cod') {
      resolvedPayment = 'paid';
    }

    await client.query(
      `UPDATE payments
       SET payment_status = $1,
           paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $2`,
      [resolvedPayment, orderId]
    );

    const fresh = await client.query(
      `SELECT o.status, p.payment_status, p.payment_method
       FROM orders o JOIN payments p ON p.order_id = o.id WHERE o.id = $1`,
      [orderId]
    );
    return fresh.rows[0];
  });

  await adminLog(req.user.id, 'orders', 'update_status', `order_id=${orderId}, status=${status || '-'}`);
  res.json({ success: true, message: 'Order updated.', data: result });
});