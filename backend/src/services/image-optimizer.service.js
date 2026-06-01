const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class ImageOptimizer {
  constructor() {
    this.config = {
      maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH) || 1920,
      quality: parseInt(process.env.IMAGE_QUALITY) || 85,
      webpEnabled: process.env.IMAGE_WEBP_ENABLED !== 'false',
      thumbnails: [
        { name: 'thumb', width: 150, height: 150 },
        { name: 'medium', width: 400, height: 400 },
        { name: 'large', width: 800, height: 800 }
      ]
    };
    
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  }

  async processImage(filePath, category = 'products') {
    try {
      const filename = path.basename(filePath, path.extname(filePath));
      const ext = path.extname(filePath).toLowerCase();
      const categoryDir = path.join(this.uploadDir, category);
      
      // Ensure directory exists
      await fs.mkdir(categoryDir, { recursive: true });
      
      const results = {
        original: filePath,
        optimized: null,
        webp: null,
        thumbnails: []
      };

      // Get image metadata
      const metadata = await sharp(filePath).metadata();
      console.log(`📷 Processing ${filename}: ${metadata.width}x${metadata.height}, ${metadata.format}`);

      // Optimized version (resize if needed)
      let optimizedBuffer = await sharp(filePath)
        .resize(this.config.maxWidth, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ quality: this.config.quality, progressive: true })
        .toBuffer();

      const optimizedPath = path.join(categoryDir, `${filename}_optimized.jpg`);
      await fs.writeFile(optimizedPath, optimizedBuffer);
      results.optimized = optimizedPath;
      console.log(`✅ Optimized: ${optimizedPath}`);

      // WebP version (if enabled)
      if (this.config.webpEnabled) {
        let webpBuffer = await sharp(filePath)
          .resize(this.config.maxWidth, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ quality: this.config.quality })
          .toBuffer();

        const webpPath = path.join(categoryDir, `${filename}.webp`);
        await fs.writeFile(webpPath, webpBuffer);
        results.webp = webpPath;
        console.log(`✅ WebP: ${webpPath}`);
      }

      // Generate thumbnails
      for (const thumb of this.config.thumbnails) {
        const thumbBuffer = await sharp(filePath)
          .resize(thumb.width, thumb.height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbPath = path.join(categoryDir, `${filename}_${thumb.name}.jpg`);
        await fs.writeFile(thumbPath, thumbBuffer);
        results.thumbnails.push({
          name: thumb.name,
          path: thumbPath,
          width: thumb.width,
          height: thumb.height
        });
        console.log(`✅ Thumbnail ${thumb.name}: ${thumbPath}`);
      }

      return results;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      throw error;
    }
  }

  async processUpload(file) {
    const category = file.mimetype.startsWith('image/') ? 'products' : 'general';
    return this.processImage(file.path, category);
  }

  async cleanup(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`🗑️  Deleted original: ${filePath}`);
    } catch (error) {
      console.error(`❌ Error deleting ${filePath}:`, error.message);
    }
  }
  
  // Standalone mode - watch for new images
  async watchAndProcess(watchDir) {
    console.log(`👀 Watching ${watchDir} for new images...`);
    
    const processFile = async (filename) => {
      const ext = path.extname(filename).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return;
      
      const filePath = path.join(watchDir, filename);
      try {
        await this.processImage(filePath, 'products');
      } catch (err) {
        console.error(`Failed to process ${filename}:`, err.message);
      }
    };

    // Simple polling for now
    setInterval(async () => {
      try {
        const files = await fs.readdir(watchDir);
        for (const file of files.slice(0, 5)) {
          await processFile(file);
        }
      } catch (err) {
        // Directory might not exist yet
      }
    }, 5000);
  }
}

const imageOptimizer = new ImageOptimizer();

// If run directly, start watching
if (require.main === module) {
  const watchDir = process.argv[2] || path.join(__dirname, '../../uploads/products');
  imageOptimizer.watchAndProcess(watchDir).catch(console.error);
}

module.exports = imageOptimizer;