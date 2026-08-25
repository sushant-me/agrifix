import { pool } from '../db/pool.js';
import { uploadImage, deleteCloudinaryImage, deleteStoredImage, publicIdFromUrl } from './cloudinary.js';

export const MAX_PRODUCT_IMAGES = 4;

/**
 * Upload an array of buffers (multer memory storage) to Cloudinary as a
 * product gallery. Returns [{ url, publicId }].
 */
export async function uploadProductGallery(files) {
  const uploaded = [];
  for (const file of files) {
    uploaded.push(await uploadImage(file.buffer, 'products'));
  }
  return uploaded;
}

/** Persist gallery rows for a product (position = array order). */
export async function saveProductGalleryRows(productId, images, client = pool) {
  for (let i = 0; i < images.length; i++) {
    await client.query(
      `INSERT INTO product_images (product_id, image_url, public_id, position)
       VALUES ($1, $2, $3, $4)`,
      [productId, images[i].url, images[i].publicId, i]
    );
  }
}

/** Fetch the gallery rows of a product (ordered by position). */
export async function getProductGallery(productIds) {
  const ids = Array.isArray(productIds) ? productIds : [productIds];
  if (!ids.length) return [];
  const { rows } = await pool.query(
    `SELECT id, image_url, public_id FROM product_images
     WHERE product_id = ANY($1::int[]) ORDER BY product_id, position, id`,
    [ids]
  );
  return rows;
}

/**
 * Permanently remove a product's images: Cloudinary assets (gallery +
 * legacy cover) are destroyed, then the gallery rows are deleted.
 */
export async function deleteProductImages(productId) {
  const images = await getProductGallery(productId);
  for (const img of images) {
    if (img.public_id) await deleteCloudinaryImage(img.public_id);
    else if (img.image_url) await deleteStoredImage(img.image_url);
  }
  await pool.query('DELETE FROM product_images WHERE product_id = $1', [productId]);

  const { rows } = await pool.query(
    'SELECT image_url FROM marketplace_products WHERE id = $1',
    [productId]
  );
  const cover = rows[0]?.image_url;
  if (cover) await deleteStoredImage(cover);
}

/**
 * Replace a product's gallery with new uploads: every previous image
 * (Cloudinary + legacy cover) is removed before persisting the new set.
 */
export async function replaceProductImages(productId, files) {
  await deleteProductImages(productId);
  const uploaded = await uploadProductGallery(files);
  await saveProductGalleryRows(productId, uploaded);
  const cover = uploaded[0] ? uploaded[0].url : null;
  await pool.query(
    `UPDATE marketplace_products SET image_url = $1 WHERE id = $2`,
    [cover, productId]
  );
  return uploaded;
}

export { publicIdFromUrl, deleteStoredImage, deleteCloudinaryImage };