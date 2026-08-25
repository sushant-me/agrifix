import { pool } from '../db/pool.js';
import { ApiError, asyncHandler } from '../middleware/error.js';
import { adminLog } from '../utils/audit.js';
import { uploadProductGallery, saveProductGalleryRows, deleteProductImages, getProductGallery, deleteCloudinaryImage } from '../utils/media.js';

/* ------------------------------------------------------------ product list */

export const listProducts = asyncHandler(async (req, res) => {
  const { search, category, location, organic } = req.query;
  const conditions = ['mp.quantity_available > 0'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(mp.product_name ILIKE $${params.length} OR mp.description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`mp.category = $${params.length}`);
  }
  if (location) {
    params.push(`%${location}%`);
    conditions.push(`mp.location ILIKE $${params.length}`);
  }
  if (organic === '1' || organic === 'true') {
    conditions.push('mp.is_organic = 1');
  }

  const { rows } = await pool.query(
    `SELECT mp.id, mp.seller_id, mp.product_name, mp.category, mp.description,
            mp.price, mp.quantity_available, mp.unit, mp.image_url, mp.location,
            mp.is_organic, mp.created_at,
            COALESCE(u.username, 'Unknown Seller') AS seller_name,
            COALESCE(sp.shop_name, 'Independent Seller') AS shop_name,
            COALESCE(sp.rating, 0) AS seller_rating,
            COALESCE(AVG(pr.rating), 0) AS rating,
            COUNT(pr.id) AS total_reviews
     FROM marketplace_products mp
     LEFT JOIN users u ON mp.seller_id = u.id
     LEFT JOIN seller_profiles sp ON sp.user_id = mp.seller_id
     LEFT JOIN product_reviews pr ON pr.product_id = mp.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY mp.id, u.username, sp.shop_name, sp.rating
     ORDER BY mp.created_at DESC
     LIMIT 50`,
    params
  );

  res.json({ success: true, data: rows });
});

/* ---------------------------------------------------------- product detail */

export const getProduct = asyncHandler(async (req, res) => {
  const productId = Number(req.params.id);
  if (!productId) throw new ApiError(422, 'Invalid product id.');

  const { rows: products } = await pool.query(
    `SELECT mp.*, u.username AS seller_name, sp.shop_name,
            sp.rating AS seller_rating, sp.id AS seller_profile_id
     FROM marketplace_products mp
     LEFT JOIN users u ON mp.seller_id = u.id
     LEFT JOIN seller_profiles sp ON sp.user_id = u.id
     WHERE mp.id = $1`,
    [productId]
  );
  const product = products[0];
  if (!product) throw new ApiError(404, 'Product not found.');

  const stats = await pool.query(
    `SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total
     FROM product_reviews WHERE product_id = $1`,
    [productId]
  );

  const images = await getProductGallery(productId);
  const gallery = images.length
    ? images.map((i) => ({ id: i.id, url: i.image_url }))
    : product.image_url
      ? [{ id: 0, url: product.image_url }]
      : [];

  const reviews = await pool.query(
    `SELECT pr.id, pr.rating, pr.review_text, pr.created_at, u.username AS reviewer_name,
            CASE WHEN EXISTS (
              SELECT 1 FROM orders o
              INNER JOIN order_items oi ON oi.order_id = o.id
              WHERE o.buyer_id = pr.user_id AND oi.product_id = pr.product_id
                AND o.status <> 'cancelled'
            ) THEN 1 ELSE 0 END AS is_verified_purchaser
     FROM product_reviews pr
     LEFT JOIN users u ON u.id = pr.user_id
     WHERE pr.product_id = $1
     ORDER BY pr.created_at DESC, pr.id DESC`,
    [productId]
  );

  let hasPurchased = false;
  let myReview = null;
  if (req.user) {
    const purchased = await pool.query(
      `SELECT COUNT(*) AS total FROM orders o
       INNER JOIN order_items oi ON oi.order_id = o.id
       WHERE o.buyer_id = $1 AND oi.product_id = $2 AND o.status <> 'cancelled'`,
      [req.user.id, productId]
    );
    hasPurchased = Number(purchased.rows[0].total) > 0;

    const mine = await pool.query(
      `SELECT * FROM product_reviews WHERE product_id = $1 AND user_id = $2 LIMIT 1`,
      [productId, req.user.id]
    );
    myReview = mine.rows[0] || null;
  }

  res.json({
    success: true,
    data: {
      product,
      gallery,
      avgRating: Number(stats.rows[0].avg_rating),
      totalReviews: Number(stats.rows[0].total),
      reviews: reviews.rows,
      hasPurchased,
      myReview,
    },
  });
});

/* ----------------------------------------------------------------- reviews */

export const saveReview = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  const productId = Number(req.params.id);
  const { rating, reviewText } = req.body;

  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) throw new ApiError(422, 'Rating must be 1-5.');
  if (!reviewText || String(reviewText).trim().length < 3 || String(reviewText).length > 2000) {
    throw new ApiError(422, 'Review must be between 3 and 2000 characters.');
  }

  const existing = await pool.query(
    'SELECT id FROM product_reviews WHERE product_id = $1 AND user_id = $2',
    [productId, req.user.id]
  );
  if (existing.rows.length) {
    await pool.query(
      'UPDATE product_reviews SET rating = $1, review_text = $2 WHERE id = $3',
      [r, String(reviewText).trim(), existing.rows[0].id]
    );
  } else {
    await pool.query(
      'INSERT INTO product_reviews (product_id, user_id, rating, review_text) VALUES ($1, $2, $3, $4)',
      [productId, req.user.id, r, String(reviewText).trim()]
    );
  }

  res.json({ success: true, message: 'Review saved.' });
});

export const deleteReview = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  const productId = Number(req.params.id);
  await pool.query('DELETE FROM product_reviews WHERE product_id = $1 AND user_id = $2', [productId, req.user.id]);
  res.json({ success: true, message: 'Review deleted.' });
});

/* ------------------------------------------------------------ add product */

export const addProduct = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');

  const {
    productName, category, location, description, price, unit, quantity, isOrganic,
  } = req.body;

  if (!productName?.trim()) throw new ApiError(422, 'Product name is required.');
  if (!category) throw new ApiError(422, 'Category is required.');
  if (!['vegetables', 'fruits', 'grains', 'dairy', 'seeds', 'fertilizers', 'equipment', 'other'].includes(category)) {
    throw new ApiError(422, 'Invalid category.');
  }
  if (!location?.trim()) throw new ApiError(422, 'Location is required.');
  if (!(Number(price) > 0)) throw new ApiError(422, 'Enter a valid price.');
  if (!(Number(quantity) >= 1)) throw new ApiError(422, 'Quantity must be at least 1.');

  const uploads = (req.files || []).slice(0, 4);

  // Cloudinary is set up, so at least one photo is expected for the listing.
  if (!uploads.length) throw new ApiError(422, 'Add at least one product photo.');

  const uploaded = await uploadProductGallery(uploads);
  const imageUrl = uploaded[0]?.url || null;

  // Ensure a seller profile exists (auto-create from username).
  let profile = await pool.query('SELECT id FROM seller_profiles WHERE user_id = $1', [req.user.id]);
  if (!profile.rows.length) {
    profile = await pool.query('INSERT INTO seller_profiles (user_id, shop_name) VALUES ($1, $2) RETURNING id', [
      req.user.id, req.user.username,
    ]);
  }

  const inserted = await pool.query(
    `INSERT INTO marketplace_products
      (seller_id, product_name, category, description, price, quantity_available, unit, image_url, location, is_organic)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      req.user.id, String(productName).trim(), category, description || null,
      Number(price), Number(quantity), unit || 'kg', imageUrl,
      String(location).trim(), isOrganic ? 1 : 0,
    ]
  );
  await saveProductGalleryRows(inserted.rows[0].id, uploaded);

  res.status(201).json({ success: true, message: 'Product added successfully.' });
});

/* --------------------------------------------------------------- wishlist */

export const listWishlist = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  const { rows } = await pool.query(
    `SELECT w.product_id, mp.product_name, mp.price, mp.unit, mp.image_url, mp.quantity_available
     FROM wishlist w
     INNER JOIN marketplace_products mp ON mp.id = w.product_id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: rows });
});

export const addWishlist = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  const productId = Number(req.body.productId);
  if (!productId) throw new ApiError(422, 'Invalid product id.');
  await pool.query(
    `INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT (user_id, product_id) DO NOTHING`,
    [req.user.id, productId]
  );
  res.json({ success: true, message: 'Added to wishlist.' });
});

export const removeWishlist = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  await pool.query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [
    req.user.id, Number(req.params.productId),
  ]);
  res.json({ success: true, message: 'Removed from wishlist.' });
});

export const adminDeleteProduct = asyncHandler(async (req, res) => {
  const productId = Number(req.params.id);
  if (!productId) throw new ApiError(422, 'Invalid product id.');
  await deleteProductImages(productId);
  await pool.query('DELETE FROM marketplace_products WHERE id = $1', [productId]);
  await adminLog(req.user.id, 'marketplace', 'delete_product', `product_id=${productId}`);
  res.json({ success: true });
});

/* ----------------------------------------------------------- update product */

export const updateProduct = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  
  const productId = Number(req.params.id);
  if (!productId) throw new ApiError(422, 'Invalid product id.');

  // Check if user owns this product
  const { rows: productCheck } = await pool.query(
    'SELECT seller_id FROM marketplace_products WHERE id = $1',
    [productId]
  );
  if (!productCheck.length) throw new ApiError(404, 'Product not found.');
  if (productCheck[0].seller_id !== req.user.id) {
    throw new ApiError(403, 'You can only edit your own products.');
  }

  const {
    productName, category, location, description, price, unit, quantity, isOrganic,
  } = req.body;

  // Validation
  if (productName?.trim()) {
    if (productName.trim().length < 3) {
      throw new ApiError(422, 'Product name must be at least 3 characters.');
    }
  }
  if (category) {
    if (!['vegetables', 'fruits', 'grains', 'dairy', 'seeds', 'fertilizers', 'equipment', 'other'].includes(category)) {
      throw new ApiError(422, 'Invalid category.');
    }
  }
  if (location?.trim()) {
    if (location.trim().length < 2) {
      throw new ApiError(422, 'Location must be at least 2 characters.');
    }
  }
  if (price !== undefined) {
    if (!(Number(price) > 0)) {
      throw new ApiError(422, 'Enter a valid price.');
    }
  }
  if (quantity !== undefined) {
    if (!(Number(quantity) >= 0)) {
      throw new ApiError(422, 'Quantity must be 0 or greater.');
    }
  }
  if (description !== undefined) {
    if (description && description.length > 2000) {
      throw new ApiError(422, 'Description must be less than 2000 characters.');
    }
  }

  // Build update query dynamically
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (productName?.trim()) {
    updates.push(`product_name = $${paramCount++}`);
    values.push(productName.trim());
  }
  if (category) {
    updates.push(`category = $${paramCount++}`);
    values.push(category);
  }
  if (location?.trim()) {
    updates.push(`location = $${paramCount++}`);
    values.push(location.trim());
  }
  if (description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(description || null);
  }
  if (price !== undefined) {
    updates.push(`price = $${paramCount++}`);
    values.push(Number(price));
  }
  if (unit !== undefined) {
    updates.push(`unit = $${paramCount++}`);
    values.push(unit || 'kg');
  }
  if (quantity !== undefined) {
    updates.push(`quantity_available = $${paramCount++}`);
    values.push(Number(quantity));
  }
  if (isOrganic !== undefined) {
    updates.push(`is_organic = $${paramCount++}`);
    values.push(isOrganic ? 1 : 0);
  }

  if (updates.length === 0) {
    throw new ApiError(422, 'No fields to update.');
  }

  values.push(productId);
  const query = `UPDATE marketplace_products SET ${updates.join(', ')} WHERE id = $${paramCount}`;

  await pool.query(query, values);

  // Handle image updates if new images are provided
  const uploads = (req.files || []).slice(0, 4);
  if (uploads.length > 0) {
    const uploaded = await uploadProductGallery(uploads);
    
    // Delete old images for this product
    const oldImages = await getProductGallery(productId);
    for (const img of oldImages) {
      if (img.public_id) await deleteCloudinaryImage(img.public_id);
    }
    await pool.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
    
    // Save new images
    await saveProductGalleryRows(productId, uploaded);
    
    // Update cover image
    if (uploaded[0]) {
      await pool.query(
        'UPDATE marketplace_products SET image_url = $1 WHERE id = $2',
        [uploaded[0].url, productId]
      );
    }
  }

  res.json({ success: true, message: 'Product updated successfully.' });
});

/* ----------------------------------------------------------- delete single image */

export const deleteProductImage = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Login required.');
  
  const imageId = Number(req.params.imageId);
  if (!imageId) throw new ApiError(422, 'Invalid image id.');

  // Get the image and check ownership
  const { rows: imageCheck } = await pool.query(
    `SELECT pi.id, pi.image_url, pi.public_id, pi.product_id, mp.seller_id 
     FROM product_images pi
     JOIN marketplace_products mp ON mp.id = pi.product_id
     WHERE pi.id = $1`,
    [imageId]
  );
  
  if (!imageCheck.length) throw new ApiError(404, 'Image not found.');
  if (imageCheck[0].seller_id !== req.user.id) {
    throw new ApiError(403, 'You can only delete your own product images.');
  }

  const productId = imageCheck[0].product_id;

  // Delete from Cloudinary if public_id exists
  if (imageCheck[0].public_id) {
    await deleteCloudinaryImage(imageCheck[0].public_id);
  }

  // Delete from database
  await pool.query('DELETE FROM product_images WHERE id = $1', [imageId]);

  // Update cover image if this was the cover
  const { rows: remainingImages } = await pool.query(
    'SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY position LIMIT 1',
    [productId]
  );
  
  if (remainingImages.length > 0) {
    await pool.query(
      'UPDATE marketplace_products SET image_url = $1 WHERE id = $2',
      [remainingImages[0].image_url, productId]
    );
  } else {
    await pool.query(
      'UPDATE marketplace_products SET image_url = NULL WHERE id = $1',
      [productId]
    );
  }

  res.json({ success: true, message: 'Image deleted successfully.' });
});