const Product = require('../models/Product');
const Review = require('../models/Review');
const Category = require('../models/Category');
const CacheService = require('../services/cache.service');

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

    // Check cache first
    const cacheKey = `autocomplete:${escapedQuery}:${safeLimit}`;
    let cached = await CacheService.get('product', cacheKey);
    if (cached) {
      return res.json({ success: true, results: cached, cached: true });
    }

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

    // Cache for 5 minutes
    await CacheService.set('product', cacheKey, products, 5 * 60 * 1000);

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

    // Check cache for paginated query
    const cacheKey = `list:${JSON.stringify({ page, safeLimit, category, minPrice, maxPrice, sort, search, featured, onSale, badges, inStock })}`;
    let cached = await CacheService.get('product', cacheKey);
    if (cached && !req.headers['x-force-refresh']) {
      return res.json({
        success: true,
        products: cached.products,
        pagination: cached.pagination,
        cached: true
      });
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .select('name slug description shortDescription pricing media category badges onSale saleEndsAt ratings inventory')
      .lean()
      .sort(sortOptions)
      .limit(safeLimit)
      .skip((page - 1) * safeLimit);

    const count = await Product.countDocuments(query);

    const pagination = {
      current: Number(page),
      pages: Math.ceil(count / limit),
      total: count,
      limit: Number(limit)
    };

    // Cache for 5 minutes
    await CacheService.set('product', cacheKey, { products, pagination }, 5 * 60 * 1000);

    res.json({
      success: true,
      products,
      pagination
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
      .populate('relatedProducts', 'name slug pricing media badges ratings');

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
    
    // Invalidate product list cache
    await CacheService.invalidate('product');
    
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

    // Invalidate caches
    await CacheService.invalidateProduct(product._id);
    await CacheService.invalidate('product');
    
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

    // Invalidate caches
    await CacheService.invalidateProduct(product._id);
    await CacheService.invalidate('product');

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).select('ratings');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = await Review.find({ product: product._id })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      reviews: reviews.map(r => ({
        _id: r._id,
        userId: { _id: r.user?._id, name: r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() : 'Client' },
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        verified: r.isVerified,
        helpful: r.helpful,
        createdAt: r.createdAt
      })),
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

    const existingReview = await Review.findOne({ product: product._id, user: req.user.id });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà noté ce produit' });
    }

    await Review.create({
      product: product._id,
      user: req.user.id,
      rating: Number(rating),
      title: title || '',
      comment: comment || ''
    });

    // Update product ratings from Review model
    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const distribution = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);

    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(d => { dist[d._id] = d.count; });

    product.ratings.average = Math.round((stats[0]?.avg || 0) * 10) / 10;
    product.ratings.count = stats[0]?.count || 0;
    product.ratings.distribution = dist;

    await product.save();
    await CacheService.invalidateProduct(product._id);

    res.json({ success: true, message: 'Avis enregistré' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
