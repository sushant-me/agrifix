import { pool } from '../db/pool.js';
import { ApiError, asyncHandler } from '../middleware/error.js';
import { ADMIN_ROLES } from '../middleware/auth.js';
import { getProductGallery } from '../utils/media.js';

const ONLINE_WINDOW_MS = 90 * 1000;

/* ------------------------------------------------------------ helpers */

export const statusInfo = (lastSeenAt) => {
  if (!lastSeenAt) return { online: false, lastSeenAt: null };
  const last = new Date(lastSeenAt);
  const online = Date.now() - last.getTime() < ONLINE_WINDOW_MS;
  return { online, lastSeenAt: last.toISOString() };
};

async function userSummary(userId, extraCols = '') {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.name, u.avatar_url, u.last_seen_at,
            COALESCE(sp.phone_number, u.phone_number) AS phone_number,
            m.role, sp.shop_name, sp.rating
     FROM users u
     LEFT JOIN user_accounts_meta m ON m.user_id = u.id
     LEFT JOIN seller_profiles sp ON sp.user_id = u.id
     WHERE u.id = $1 ${extraCols}`,
    [userId]
  );
  return rows[0] || null;
}

/* ------------------------------------------------------- my profile */

export const myProfile = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.name, u.email, u.phone_number, u.delivery_address,
            u.avatar_url, u.last_seen_at, u.created_at, m.role
     FROM users u
     LEFT JOIN user_accounts_meta m ON m.user_id = u.id
     WHERE u.id = $1`,
    [req.user.id]
  );
  const user = rows[0];
  if (!user) throw new ApiError(404, 'User not found.');

  const [cart, wishlist, orders] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS c FROM shopping_cart WHERE user_id = $1', [user.id]),
    pool.query('SELECT COUNT(*)::int AS c FROM wishlist WHERE user_id = $1', [user.id]),
    pool.query('SELECT COUNT(*)::int AS c FROM orders WHERE buyer_id = $1', [user.id]),
  ]);

  res.json({
    success: true,
    data: {
      user: {
        ...user,
        createdAt: user.created_at,
        cartCount: cart.rows[0].c,
        wishlistCount: wishlist.rows[0].c,
        ordersCount: orders.rows[0].c,
      },
      status: statusInfo(user.last_seen_at),
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, username, email, phoneNumber, deliveryAddress } = req.body;
  const fields = [];
  const values = [];
  let i = 1;

  if (name !== undefined) { fields.push(`name = $${i++}`); values.push(String(name).slice(0, 100)); }
  if (phoneNumber !== undefined) { fields.push(`phone_number = $${i++}`); values.push(String(phoneNumber).slice(0, 20)); }
  if (deliveryAddress !== undefined) { fields.push(`delivery_address = $${i++}`); values.push(String(deliveryAddress).slice(0, 500)); }
  if (username !== undefined) {
    const userVal = String(username).trim();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(userVal)) throw new ApiError(422, 'Username must be 3-30 characters (letters, numbers, underscore).');
    const dup = await pool.query('SELECT id FROM users WHERE username = $1 AND id <> $2', [userVal, req.user.id]);
    if (dup.rows.length) throw new ApiError(409, 'That username is already taken.');
    fields.push(`username = $${i++}`);
    values.push(userVal);
  }
  if (email !== undefined) {
    const emailVal = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) throw new ApiError(422, 'Invalid email address.');
    const dup = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [emailVal, req.user.id]);
    if (dup.rows.length) throw new ApiError(409, 'That email is already in use.');
    fields.push(`email = $${i++}`);
    values.push(emailVal);
  }
  if (!fields.length) throw new ApiError(422, 'Nothing to update.');

  values.push(req.user.id);
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, username, name, email, phone_number, delivery_address`,
    values
  );
  res.json({ success: true, data: rows[0] });
});

/* --------------------------------------------------- public profile */

export const publicProfile = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) throw new ApiError(422, 'Invalid user id.');

  const user = await userSummary(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  const [shop, products] = await Promise.all([
    pool.query(
      `SELECT shop_name, shop_description, rating, phone_number, profile_image
       FROM seller_profiles WHERE user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT mp.id, mp.product_name, mp.price, mp.unit, mp.quantity_available, mp.image_url, mp.location
       FROM marketplace_products mp WHERE mp.seller_id = $1 AND mp.quantity_available > 0
       ORDER BY mp.created_at DESC LIMIT 50`,
      [userId]
    ),
  ]);

  const galleryRows = products.rows.length ? await getProductGallery(products.rows.map((p) => p.id)) : [];
  const gallery = {};
  for (const g of galleryRows) if (!gallery[g.product_id]) gallery[g.product_id] = g.image_url;

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role,
        phone_number: user.phone_number,
      },
      shop: shop.rows[0] || null,
      status: statusInfo(user.last_seen_at),
      products: products.rows.map((p) => ({
        id: p.id,
        name: p.product_name,
        price: p.price,
        unit: p.unit,
        quantity_available: p.quantity_available,
        location: p.location,
        image: gallery[p.id] || p.image_url || null,
      })),
    },
  });
});

export const userStatus = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT last_seen_at FROM users WHERE id = $1', [Number(req.params.id)]);
  if (!rows.length) throw new ApiError(404, 'User not found.');
  res.json({ success: true, data: statusInfo(rows[0].last_seen_at) });
});

export const userSummaryMini = asyncHandler(async (req, res) => {
  const user = await userSummary(Number(req.params.id));
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url,
      role: user.role,
      shop_name: user.shop_name,
      rating: user.rating,
      phone_number: user.phone_number,
      status: statusInfo(user.last_seen_at),
    },
  });
});

export const heartbeat = asyncHandler(async (req, res) => {
  await pool.query('UPDATE users SET last_seen_at = now() WHERE id = $1', [req.user.id]);
  res.json({ success: true });
});

/* ----------------------------------------------------- conversations */

async function conversationSummary(conversation, currentUserId) {
  const otherId = conversation.buyer_id === currentUserId ? conversation.farmer_id : conversation.buyer_id;
  const other = await userSummary(otherId);
  const { rows: last } = await pool.query(
    `SELECT id, sender_id, message_text, is_read, created_at FROM messages
     WHERE conversation_id = $1 ORDER BY id DESC LIMIT 1`,
    [conversation.id]
  );
  const { rows: unread } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM messages
     WHERE conversation_id = $1 AND sender_id <> $2 AND is_read = FALSE`,
    [conversation.id, currentUserId]
  );
  const lastMsg = last[0] || null;
  return {
    id: conversation.id,
    otherUser: {
      id: other?.id,
      username: other?.username,
      name: other?.name,
      avatar_url: other?.avatar_url,
      role: other?.role,
      shop_name: other?.shop_name,
      phone_number: other?.phone_number,
      ...statusInfo(other?.last_seen_at),
    },
    lastMessage: lastMsg ? { text: lastMsg.message_text, senderId: lastMsg.sender_id, createdAt: lastMsg.created_at } : null,
    unreadCount: unread[0] ? unread[0].c : 0,
  };
}

export const listConversations = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM conversations WHERE buyer_id = $1 OR farmer_id = $1 ORDER BY id DESC`,
    [req.user.id]
  );
  const summaries = await Promise.all(rows.map((c) => conversationSummary(c, req.user.id)));
  res.json({ success: true, data: summaries });
});

export const getOrCreateConversation = asyncHandler(async (req, res) => {
  const farmerId = Number(req.body.farmerId);
  if (!farmerId) throw new ApiError(422, 'Farmer id required.');
  if (farmerId === req.user.id) throw new ApiError(422, 'Cannot message yourself.');

  const { rows: existing } = await pool.query(
    'SELECT * FROM conversations WHERE (buyer_id = $1 AND farmer_id = $2) OR (buyer_id = $2 AND farmer_id = $1)',
    [req.user.id, farmerId]
  );
  let conversation = existing[0];
  if (!conversation) {
    const { rows: created } = await pool.query(
      `INSERT INTO conversations (buyer_id, farmer_id) VALUES ($1, $2) RETURNING *`,
      [req.user.id, farmerId]
    );
    conversation = created[0];
  }
  res.json({ success: true, data: await conversationSummary(conversation, req.user.id) });
});

export const listMessages = asyncHandler(async (req, res) => {
  const conversationId = Number(req.params.id);
  const { rows: convs } = await pool.query(
    'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR farmer_id = $2)',
    [conversationId, req.user.id]
  );
  if (!convs.length) throw new ApiError(404, 'Conversation not found.');
  const conversation = convs[0];

  await pool.query(
    `UPDATE messages SET is_read = TRUE
     WHERE conversation_id = $1 AND sender_id <> $2 AND is_read = FALSE`,
    [conversationId, req.user.id]
  );

  const { rows } = await pool.query(
    `SELECT id, sender_id, message_text, created_at FROM messages
     WHERE conversation_id = $1 ORDER BY id ASC`,
    [conversationId]
  );
  res.json({ success: true, data: { conversation: await conversationSummary(conversation, req.user.id), messages: rows } });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversationId = Number(req.params.id);
  const message = String(req.body.message || '').trim();
  if (!message) throw new ApiError(422, 'Message cannot be empty.');

  const { rows: convs } = await pool.query(
    'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR farmer_id = $2)',
    [conversationId, req.user.id]
  );
  if (!convs.length) throw new ApiError(404, 'Conversation not found.');

  const { rows } = await pool.query(
    `INSERT INTO messages (conversation_id, sender_id, message_text) VALUES ($1, $2, $3) RETURNING id, sender_id, message_text, created_at`,
    [conversationId, req.user.id, message.slice(0, 2000)]
  );
  res.json({ success: true, data: rows[0] });
});

export const markConversationRead = asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE messages SET is_read = TRUE
     WHERE conversation_id = $1 AND sender_id <> $2 AND is_read = FALSE`,
    [Number(req.params.id), req.user.id]
  );
  res.json({ success: true });
});

/* ------------------------------------------------------------ refunds */

export const requestRefund = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const reason = String(req.body.reason || '').trim().slice(0, 500);

  const { rows: orders } = await pool.query(
    `SELECT id, status FROM orders WHERE id = $1 AND buyer_id = $2`,
    [orderId, req.user.id]
  );
  if (!orders.length) throw new ApiError(404, 'Order not found.');
  const order = orders[0];

  const already = await pool.query('SELECT id FROM refund_requests WHERE order_id = $1', [orderId]);
  if (already.rows.length) throw new ApiError(409, 'A refund request already exists for this order.');
  if (order.status === 'pending') throw new ApiError(422, 'Wait until the order is fulfilled to request a refund.');

  const { rows } = await pool.query(
    `INSERT INTO refund_requests (order_id, buyer_id, reason) VALUES ($1, $2, $3) RETURNING *`,
    [orderId, req.user.id, reason || null]
  );
  res.status(201).json({ success: true, data: rows[0] });
});

export const listRefunds = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT rr.*, o.order_date, o.total_amount, o.status AS order_status, o.estimated_delivery_date, o.delivery_address
     FROM refund_requests rr JOIN orders o ON o.id = rr.order_id
     WHERE rr.buyer_id = $1 ORDER BY rr.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: rows });
});

export const adminListRefunds = asyncHandler(async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user?.role)) throw new ApiError(403, 'Farmers and admins only.');
  const { rows } = await pool.query(
    `SELECT rr.id, rr.order_id, rr.reason, rr.status, rr.created_at, rr.resolved_at,
            o.total_amount, o.customer_name, o.delivery_address,
            b.username AS buyer_name, b.phone_number AS buyer_phone
     FROM refund_requests rr
     JOIN orders o ON o.id = rr.order_id
     JOIN users b ON b.id = rr.buyer_id
     ORDER BY rr.created_at DESC`,
    []
  );
  res.json({ success: true, data: rows });
});

export const resolveRefund = asyncHandler(async (req, res) => {
  if (!ADMIN_ROLES.includes(req.user?.role)) throw new ApiError(403, 'Farmers and admins only.');
  const refundId = Number(req.params.id);
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) throw new ApiError(422, 'Status must be approved or rejected.');

  const { rows } = await pool.query(
    `UPDATE refund_requests SET status = $1, resolved_at = now()
     WHERE id = $2 AND status = 'pending' RETURNING *`,
    [status, refundId]
  );
  if (!rows.length) {
    const exists = await pool.query('SELECT id, status FROM refund_requests WHERE id = $1', [refundId]);
    if (!exists.rows.length) throw new ApiError(404, 'Refund request not found.');
    throw new ApiError(409, `Refund already ${exists.rows[0].status}.`);
  }
  res.json({ success: true, data: rows[0] });
});
