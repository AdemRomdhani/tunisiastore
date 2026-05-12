const Product = require('../models/Product');
const Category = require('../models/Category');

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
      .lean();

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

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category.toLowerCase().trim() });
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
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
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