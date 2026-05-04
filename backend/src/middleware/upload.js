const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const crypto = require('crypto');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const safeExtensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

let storage;
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY;

if (useCloudinary) {
  console.log('📷 Using Cloudinary for image uploads');
  
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'tunisia-store',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
    },
    filename: (req, file, cb) => {
      const uniqueId = crypto.randomUUID();
      const ext = safeExtensions[file.mimetype] || '.jpg';
      cb(null, file.fieldname + '-' + uniqueId + ext);
    }
  });
} else {
  console.log('📷 Using local storage for image uploads (Cloudinary not configured)');
  const path = require('path');
  const fs = require('fs');
  
  const uploadDir = path.join(__dirname, '../../uploads/products');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueId = crypto.randomUUID();
      const ext = safeExtensions[file.mimetype] || '.jpg';
      cb(null, file.fieldname + '-' + uniqueId + ext);
    }
  });
}

const upload = multer({
  storage: storage,
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

// Helper to get full image URL from Cloudinary file object
upload.getImageUrl = (file) => {
  if (!file) return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
  
  // If using local storage
  if (!useCloudinary && file.path) {
    return file.path;
  }
  
  // Cloudinary returns secure_url in the file object
  if (file.secure_url) {
    return file.secure_url;
  }
  
  // If we have a path/public_id, construct URL
  if (file.path && file.path.includes('tunisia-store')) {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${file.path}`;
  }
  
  return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
};

module.exports = upload;