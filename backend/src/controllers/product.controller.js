const Product = require('../models/Product');
const Category = require('../models/Category'); // make sure this import exists

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

    // Enforce max limit to prevent abuse
    const maxLimit = 50;
    const safeLimit = Math.min(Number(limit) || 12, maxLimit);

    const query = { isActive: true };

    if (onSale === 'true') {
      query.$or = [
        { onSale: true, $or: [{ saleEndsAt: { $gt: new Date() } }, { saleEndsAt: { $exists: false } }] },
        { badges: { $in: ['PROMO'] }, $or: [{ saleEndsAt: { $gt: new Date() } }, { saleEndsAt: { $exists: false } }, { onSale: { $ne: false } }] }
      ];
    }

    // Resolve category slug to ObjectId - optional filter
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category.toLowerCase().trim() });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
      // If category not found, just don't filter by category instead of returning 400
    }

    if (featured === 'true') {
      query.$or = [
        { featured: true },
        { badges: { $in: ['BESTSELLER', 'PROMO'] } }
      ];
    }
    if (onSale === 'true') {
      query.$or = [
        { onSale: true },
        { badges: { $in: ['PROMO'] }, onSale: { $ne: false } }
      ];
    } else if (onSale === 'false') {
      query.$and = [
        { onSale: false },
        { badges: { $ne: 'PROMO' } }
      ];
    }
    if (inStock === 'true') query['inventory.quantity'] = { $gt: 0 };
    if (badges) query.badges = { $in: badges.split(',') };
    
    if (minPrice || maxPrice) {
      query['pricing.price'] = {};
      if (minPrice) query['pricing.price'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.price'].$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
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

    if (onSale === 'true') {
      console.log('[getProducts] Returning products:', products.map(p => ({
        name: p.name,
        onSale: p.onSale,
        saleEndsAt: p.saleEndsAt,
        badges: p.badges
      })));
    }
      .lean();

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
    console.error('getProducts error:', error); // log full error server-side
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

    // Increment view count (you might want to track this separately)
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
        user: r.user,
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

    // Check if user already reviewed
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

    // Update ratings average
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.ratings.average = Math.round((totalRating / product.reviews.length) * 10) / 10;
    product.ratings.count = product.reviews.length;

    // Update distribution
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