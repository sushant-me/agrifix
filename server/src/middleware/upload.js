import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');
export const MARKETPLACE_DIR = path.join(UPLOAD_ROOT, 'marketplace');
export const DATASETS_DIR = path.join(UPLOAD_ROOT, 'datasets');

for (const dir of [UPLOAD_ROOT, MARKETPLACE_DIR, DATASETS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

export const IMAGE_FILTER = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const DATASET_FILTER = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
];


function makeStorage(dest) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = (path.extname(file.originalname) || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
      cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  });
}

function makeUploader(dest, mimeFilter, maxBytes) {
  return multer({
    storage: makeStorage(dest),
    limits: { fileSize: maxBytes || 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (mimeFilter && !mimeFilter.includes(file.mimetype) && !mimeFilter.includes('*')) {
        return cb(new Error('File type not allowed.'));
      }
      cb(null, true);
    },
  });
}

export const uploadProductImage = makeUploader(MARKETPLACE_DIR, IMAGE_FILTER);
export const uploadDataset = makeUploader(DATASETS_DIR, DATASET_FILTER);

/* ------------------------------------------------------------
   Cloudinary-bound uploads (memory storage → uploaded by the
   controller via utils/cloudinary.js). Product galleries and
   profile avatars never touch the disk.
   ------------------------------------------------------------ */

function makeMemoryUploader({ maxFiles = 1, maxBytes = 6 * 1024 * 1024, mimeFilter = IMAGE_FILTER } = {}) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (mimeFilter && !mimeFilter.includes(file.mimetype)) {
        return cb(new Error('Only JPG, PNG, GIF or WEBP images are allowed.'));
      }
      cb(null, true);
    },
  });
}

export const uploadProductImages = makeMemoryUploader({ maxFiles: 4 });
export const uploadAvatar = makeMemoryUploader({ maxFiles: 1 });
export const uploadLeaf = makeMemoryUploader({ maxFiles: 1, maxBytes: 8 * 1024 * 1024 });
export const uploadApplicationDocs = makeMemoryUploader({ maxFiles: 2, maxBytes: 8 * 1024 * 1024 });