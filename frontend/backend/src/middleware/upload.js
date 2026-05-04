const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create uploads directory if not exists
const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Map of safe extensions by mimetype
const safeExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate UUID-like random filename
    const uniqueId = crypto.randomUUID();
    // Get safe extension based on mimetype, default to .jpg
    const ext = safeExtensions[file.mimetype] || '.jpg';
    cb(null, file.fieldname + '-' + uniqueId + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Only allow safe image mimetypes
    if (safeExtensions[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
    }
  }
});

module.exports = upload;