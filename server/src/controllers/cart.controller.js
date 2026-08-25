import { pool } from '../db/pool.js';
import { ApiError, asyncHandler } from '../middleware/error.js';

export const getCart = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  const { rows } = await pool.query(
    `SELECT sc.id, sc.product_id, sc.quantity,
            mp.product_name, mp.price, mp.unit, mp.category,
            mp.quantity_available, mp.image_url,
            u.username AS seller_name
     FROM shopping_cart sc
     INNER JOIN marketplace_products mp ON mp.id = sc.product_id
     LEFT JOIN users u ON mp.seller_id = u.id
     WHERE sc.user_id = $1
     ORDER BY sc.id DESC`,
    [req.user.id]
  );

  const subtotal = rows.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;

  res.json({
    success: true,
    data: {
      items: rows,
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total: Math.round((subtotal + tax) * 100) / 100,
    },
  });
});

export const addToCart = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  const productId = Number(req.body.productId);
  const quantity = Math.max(1, Number(req.body.quantity || 1));

  const { rows } = await pool.query('SELECT quantity_available FROM marketplace_products WHERE id = $1', [productId]);
  if (!rows.length) throw new ApiError(404, 'Product not found.');
  if (Number(rows[0].quantity_available) < quantity) throw new ApiError(422, `Only ${rows[0].quantity_available} available.`);

  await pool.query(
    `INSERT INTO shopping_cart (user_id, product_id, quantity) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = shopping_cart.quantity + $3`,
    [req.user.id, productId, quantity]
  );

  res.json({ success: true, message: 'Added to cart.' });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  const itemId = Number(req.params.id);
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) throw new ApiError(422, 'Quantity must be a positive integer.');

  const { rows } = await pool.query(
    `SELECT sc.id, mp.quantity_available FROM shopping_cart sc
     INNER JOIN marketplace_products mp ON mp.id = sc.product_id
     WHERE sc.id = $1 AND sc.user_id = $2`,
    [itemId, req.user.id]
  );
  if (!rows.length) throw new ApiError(404, 'Cart item not found.');
  if (quantity > Number(rows[0].quantity_available)) {
    throw new ApiError(422, `Only ${rows[0].quantity_available} available.`);
  }

  await pool.query('UPDATE shopping_cart SET quantity = $1 WHERE id = $2 AND user_id = $3', [
    quantity, itemId, req.user.id,
  ]);
  res.json({ success: true, message: 'Cart updated.' });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  await pool.query('DELETE FROM shopping_cart WHERE id = $1 AND user_id = $2', [
    Number(req.params.id), req.user.id,
  ]);
  res.json({ success: true, message: 'Removed from cart.' });
});