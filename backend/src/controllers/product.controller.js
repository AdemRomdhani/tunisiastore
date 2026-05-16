const Product = require('../models/Product');
const Category = require('../models/Category');

// Cache for categories to avoid repeated DB calls
let categoryCache = null;
let categoryCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCategories() {
  const now = Date.now();
  if (!categoryCache || (now - categoryCacheTime) > CACHE_TTL) {
    const cats = await Category.find({}).lean();
    categoryCache = new Map(cats.map(c => [c.slug, c]));
    categoryCacheTime = now;
  }
  return categoryCache;
}

exports.autocomplete = async (req, res) => {
  try {
    const { q, limit = 8 } = req.query;
    
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, results: [] });
    }

    const safeLimit = Math.min(Number(limit) || 8, 10);
    const escapedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const products = await Product.find({
      isActive: true,
      name: { $regex: `^${escapedQuery}`, $options: 'i' }
    })
      .select('name slug pricing media category badges')
      .populate('category', 'name')
      .sort({ name: 1 })
      .limit(safeLimit)
      .lean()
      .maxTimeMS(3000);

    res.json({ success: true, results: products });
  } catch (error) {
    console.error('autocomplete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      search,
      featured,
      onSale,
      badges,
      inStock
    } = req.query;

    const maxLimit = 50;
    const safeLimit = Math.min(Number(limit) || 12, maxLimit);

    const query = { isActive: true };

    // Use cached categories
    if (category) {
      const categories = await getCategories();
      const categoryDoc = categories.get(category.toLowerCase().trim());
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    if (featured === 'true') {
      query.$or = [
        { featured: true },
        { badges: { $in: ['BESTSELLER', 'PROMO'] } }
      ];
    }

    if (onSale === 'true') {
      const now = new Date();
      query.$or = [
        // Products explicitly marked onSale with a future or no expiry date
        { onSale: true, saleEndsAt: { $gt: now } },
        { onSale: true, saleEndsAt: { $exists: false } },
        { onSale: true, saleEndsAt: null },
        // Products with PROMO badge
        { badges: { $in: ['PROMO'] } },
        // Products with a discounted price (originalPrice > price)
        { $expr: { $gt: ['$pricing.originalPrice', '$pricing.price'] } }
      ];
    } else if (onSale === 'false') {
      query.onSale = { $ne: true };
    }

    if (inStock === 'true') query['inventory.quantity'] = { $gt: 0 };
    if (badges) query.badges = { $in: badges.split(',') };
    
    if (minPrice || maxPrice) {
      query['pricing.price'] = {};
      if (minPrice) query['pricing.price'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.price'].$lte = Number(maxPrice);
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { shortDescription: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    if (sort === 'price-asc') sortOptions['pricing.price'] = 1;
    else if (sort === 'price-desc') sortOptions['pricing.price'] = -1;
    else if (sort === 'name') sortOptions.name = 1;
    else if (sort === 'rating') sortOptions['ratings.average'] = -1;
    else sortOptions.createdAt = -1;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .select('name slug pricing media category badges onSale saleEndsAt ratings inventory')
      .lean()
      .sort(sortOptions)
      .limit(safeLimit)
      .skip((page - 1) * safeLimit);

    const count = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(count / limit),
        total: count,
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category')
      .populate('relatedProducts', 'name slug pricing images badges ratings');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const data = mapFormData(req.body);
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    console.log('UPDATE PRODUCT - Raw body:', req.body);
    const data = mapFormData(req.body);
    console.log('UPDATE PRODUCT - Mapped data:', data);
    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

function mapFormData(body) {
  if (!body || Object.keys(body).length === 0) return body;
  const mapped = {};
  if (body.name) mapped.name = body.name;
  if (body.description) mapped.description = body.description;
  if (body.slug) mapped.slug = body.slug;
  if (body.shortDescription) mapped.shortDescription = body.shortDescription;
  if (body.category) mapped.category = body.category;
  if (body.featured !== undefined) mapped.featured = body.featured === 'true';
  if (body.isActive !== undefined) mapped.isActive = body.isActive === 'true';
  if (body.onSale !== undefined) mapped.onSale = body.onSale === 'true';
  if (body.saleEndsAt) mapped.saleEndsAt = body.saleEndsAt;
  if (body.badges) {
    try { mapped.badges = typeof body.badges === 'string' ? JSON.parse(body.badges) : body.badges; }
    catch { mapped.badges = []; }
  }
  if (body.warranty) mapped.warranty = body.warranty;
  if (body.weight) mapped.weight = body.weight;
  if (body.dimensions) mapped.dimensions = body.dimensions;
  if (body.subcategory) mapped.subcategory = body.subcategory;
  if (body.specifications) {
    try { mapped.specifications = typeof body.specifications === 'string' ? JSON.parse(body.specifications) : body.specifications; }
    catch { mapped.specifications = []; }
  }
  if (body.attributes) {
    try { mapped.attributes = typeof body.attributes === 'string' ? JSON.parse(body.attributes) : body.attributes; }
    catch { mapped.attributes = []; }
  }
  if (body.price !== undefined) mapped.pricing = { price: parseFloat(body.price) };
  if (body.originalPrice !== undefined) mapped.pricing = { ...mapped.pricing, originalPrice: parseFloat(body.originalPrice) };
  if (body.cost !== undefined) mapped.pricing = { ...mapped.pricing, cost: parseFloat(body.cost) };
  if (body.stock !== undefined) mapped.inventory = { quantity: parseInt(body.stock) };
  if (body.sku) mapped.inventory = { ...mapped.inventory, sku: body.sku };
  if (body.lowStockThreshold !== undefined) mapped.inventory = { ...mapped.inventory, lowStockThreshold: parseInt(body.lowStockThreshold) };
  return mapped;
}

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .select('reviews ratings')
      .populate('reviews.user', 'firstName lastName email')
      .lean();
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = (product.reviews || [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(r => ({
        _id: r._id,
        userId: { _id: r.user?._id, name: r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() : 'Client' },
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        verified: r.verified,
        helpful: r.helpful,
        createdAt: r.createdAt
      }));

    res.json({
      success: true,
      reviews,
      ratings: product.ratings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'La note doit être entre 1 et 5' });
    }
    
    const product = await Product.findOne({ slug: req.params.slug });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existingReview = product.reviews.find(r => r.user.toString() === req.user.id);
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà noté ce produit' });
    }

    const newReview = {
      user: req.user.id,
      rating: Number(rating),
      title: title || '',
      comment: comment || '',
      verified: false,
      helpful: 0,
      createdAt: new Date()
    };

    product.reviews.push(newReview);

    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.ratings.average = Math.round((totalRating / product.reviews.length) * 10) / 10;
    product.ratings.count = product.reviews.length;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    product.reviews.forEach(r => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });
    product.ratings.distribution = distribution;

    await product.save();

    res.json({ success: true, message: 'Avis enregistré' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};