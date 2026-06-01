const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

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
const useImageOptimization = process.env.IMAGE_OPTIMIZATION_ENABLED !== 'false' && !useCloudinary;

// Import image optimizer only when needed
let imageOptimizer;
if (useImageOptimization) {
  try {
    imageOptimizer = require('../services/image-optimizer.service');
    console.log('📷 Image optimization enabled');
  } catch (err) {
    console.log('⚠️  Image optimizer not available:', err.message);
  }
}

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
  
  const uploadDir = path.join(__dirname, '../../uploads/products');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: async (req, file, cb) => {
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

// Post-process uploaded images with optimizer
upload._postProcess = async (files) => {
  if (!useImageOptimization || !imageOptimizer || useCloudinary) {
    return files;
  }
  
  if (!Array.isArray(files)) {
    files = [files];
  }
  
  const results = [];
  for (const file of files) {
    if (file && file.path) {
      try {
        const optimized = await imageOptimizer.processImage(file.path, 'products');
        file.optimized = optimized;
        console.log(`✅ Image optimized: ${file.filename}`);
      } catch (err) {
        console.error(`❌ Image optimization failed for ${file.filename}:`, err.message);
      }
    }
    results.push(file);
  }
  
  return results;
};

// Helper to get full image URL from Cloudinary file object
upload.getImageUrl = (file) => {
  if (!file) return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
  
  // If using local storage - return path as-is since express serves it at /uploads
  if (!useCloudinary && file.path) {
    return file.path;
  }
  
  // Cloudinary returns secure_url in the file object - use this first
  if (file.secure_url) {
    return file.secure_url;
  }
  
  // If we have a path that starts with http, return as-is
  if (file.path && file.path.startsWith('http')) {
    return file.path;
  }
  
  // If we have a public_id, construct URL
  if (file.path && file.path.includes('tunisia-store')) {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${file.path}`;
  }
  
  return 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image';
};

module.exports = upload;