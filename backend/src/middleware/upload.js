const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const safeExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomUUID();
    const ext = safeExtensions[file.mimetype] || '.jpg';
    cb(null, file.fieldname + '-' + uniqueId + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format d\'image non autorisé. Utilisez JPG, PNG, WebP ou GIF.'));
    }
  }
});

upload.getImageUrl = (file) => {
  if (!file) return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
  if (file.path && file.path.startsWith('http')) return file.path;
  return file.path || 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
};

module.exports = upload;
