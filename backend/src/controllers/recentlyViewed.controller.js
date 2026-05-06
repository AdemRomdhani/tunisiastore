const RecentlyViewed = require('../models/RecentlyViewed');
const Product = require('../models/Product');

exports.getRecentlyViewed = async (req, res) => {
  try {
    const deviceId = req.headers['x-device-id'];
    console.log('=== getRecentlyViewed ===');
    console.log('deviceId:', deviceId);
    
    let query = {};
    if (req.user?.id) {
      query = { user: req.user.id };
    } else if (deviceId) {
      query = { deviceId: deviceId };
    }
    
    if (!query.user && !query.deviceId) {
      console.log('No user or deviceId');
      return res.json({ success: true, products: [] });
    }
    
    console.log('Searching with query:', query);
    
    // Show ALL docs in collection
    const allDocs = await RecentlyViewed.find({});
    console.log('Total docs in DB:', allDocs.length);
    
    const doc = await RecentlyViewed.findOne(query);
    console.log('Found doc:', doc ? doc._id : 'null');
    
    if (!doc) {
      return res.json({ success: true, products: [] });
    }
    
    console.log('Products in doc:', doc.products.length);
    console.log('Raw products:', JSON.stringify(doc.products));
    
    await doc.populate('products.product');
    
    const products = doc.products.map(p => p.product).filter(p => p);
    
    console.log('Filtered products:', products.length);
    
    res.json({ success: true, products });
  } catch (error) {
    console.error('getRecentlyViewed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addRecentlyViewed = async (req, res) => {
  try {
    const { productId } = req.body;
    const deviceId = req.headers['x-device-id'];
    
    console.log('=== addRecentlyViewed ===');
    console.log('productId:', productId);
    console.log('deviceId:', deviceId);
    console.log('All headers:', req.headers);
    
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId required' });
    }
    
    let query = {};
    if (req.user?.id) {
      query.user = req.user.id;
    } else if (deviceId) {
      query.deviceId = deviceId;
    }
    
    if (!query.user && !query.deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId required' });
    }
    
    console.log('query:', query);
    
    // Try to find existing doc
    let doc = await RecentlyViewed.findOne(query);
    console.log('existing doc:', doc ? doc._id : 'null');
    
    // If no doc, create new one safely
    if (!doc) {
      try {
        const newDocData = { ...query, products: [] };
        console.log('Creating with data:', newDocData);
        doc = await RecentlyViewed.create(newDocData);
        console.log('Created new doc:', doc._id);
      } catch (createErr) {
        console.error('Create error:', createErr.code, createErr.message);
        // Handle duplicate key - race condition, find existing
        if (createErr.code === 11000) {
          doc = await RecentlyViewed.findOne(query);
        } else {
          return res.status(500).json({ success: false, message: 'Create failed: ' + createErr.message });
        }
      }
    }
    
    // Ensure doc has products array
    if (!doc) {
      return res.status(500).json({ success: false, message: 'Failed to find document' });
    }
    if (!doc.products) {
      doc.products = [];
    }
    
    // Remove if already exists (to move to front)
    const existingIdx = doc.products.findIndex(
      p => p.product && p.product.toString() === productId
    );
    
    if (existingIdx > -1) {
      doc.products.splice(existingIdx, 1);
    }
    
    // Add to beginning
    doc.products.unshift({
      product: productId,
      viewedAt: new Date()
    });
    
    // Keep only last 20
    if (doc.products.length > 20) {
      doc.products = doc.products.slice(0, 20);
    }
    
    await doc.save();
    
    console.log('Saved, doc id:', doc._id, 'products:', doc.products.length);
    console.log('products:', doc.products.map(p => p.product));
    
    res.json({ success: true });
  } catch (error) {
    console.error('addRecentlyViewed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};