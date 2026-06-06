const Product = require('../../models/Product');
const upload = require('../../middleware/upload');

exports.getAllProductsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: { current: Number(page), pages: Math.ceil(count / limit), total: count }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductByIdAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .select('name slug description shortDescription pricing inventory media category badges onSale saleEndsAt featured ratings isActive specifications attributes warranty weight dimensions')
      .lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProductAdmin = async (req, res) => {
  try {
    const body = req.body;
    
    // Build nested objects from flat FormData
    const pricing = {};
    if (body.price) pricing.price = parseFloat(body.price);
    if (body.originalPrice) pricing.originalPrice = parseFloat(body.originalPrice);
    pricing.currency = 'TND';

    const inventory = {};
    if (body.stock) inventory.quantity = parseInt(body.stock);
    if (body.sku) inventory.sku = body.sku;
    inventory.reserved = 0;

    const images = req.files && req.files.length > 0 
      ? req.files.map(file => upload.getImageUrl(file))
      : ['https://placehold.co/400x400?text=No+Image'];

    // Handle badges - parse JSON if string, otherwise use as array
    let badges = [];
    if (body.badges) {
      try {
        badges = typeof body.badges === 'string' ? JSON.parse(body.badges) : body.badges;
      } catch (e) {
        badges = [];
      }
    }

    // Automatic badge logic
    const stock = parseInt(body.stock) || 0;
    const lowStockThreshold = 5;
    
    // Add STOCK_LIMITED badge automatically if stock is low
    if (stock > 0 && stock <= lowStockThreshold && !badges.includes('STOCK_LIMITED')) {
      badges.push('STOCK_LIMITED');
    }
    
    // Remove STOCK_LIMITED badge if stock is increased above threshold
    if (stock > lowStockThreshold && badges.includes('STOCK_LIMITED')) {
      badges = badges.filter(b => b !== 'STOCK_LIMITED');
    }
    
    // Add PROMO badge automatically if product is on sale
    if ((body.onSale === 'true' || body.onSale === true) && !badges.includes('PROMO')) {
      badges.push('PROMO');
    }

    // Handle featured boolean
    const featured = body.featured === 'true' || body.featured === true;

    // Handle sale timer
    const onSale = body.onSale === 'true' || body.onSale === true;
    console.log('[Create] onSale:', body.onSale, '->', onSale);
    let saleEndsAt = undefined;
    if (body.saleEndsAt && body.saleEndsAt.trim()) {
      const saleEndsAtRaw = new Date(body.saleEndsAt);
      if (!isNaN(saleEndsAtRaw.getTime())) {
        saleEndsAt = saleEndsAtRaw;
        console.log('[Create] saleEndsAt:', body.saleEndsAt, '->', saleEndsAt);
      }
    }
    const finalOnSale = onSale || (saleEndsAt && saleEndsAt > new Date());
    console.log('[Create] finalOnSale:', finalOnSale);

    const productData = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: body.description,
      shortDescription: body.description?.substring(0, 100),
      pricing,
      inventory,
      media: { images },
      category: body.category,
      badges,
      featured,
      onSale: finalOnSale,
      saleEndsAt,
      ratings: { average: 0, count: 0 },
      isActive: true
    };

    const product = await Product.create(productData);
    
    // Send promo notification if product has PROMO badge
    if (badges.includes('PROMO') || finalOnSale) {
      console.log('📧 [Email] New promo product detected:', product.name);
      const EmailService = require('../../services/email.service');
      const Newsletter = require('../../models/Newsletter');
      
      try {
        const subscribers = await Newsletter.find({ isActive: true }).select('email');
        console.log('📧 [Email] Found subscribers:', subscribers.length);
        await EmailService.sendNewPromoNotification(product, subscribers);
      } catch (emailErr) {
        console.error('📧 [Email] Promo notification failed:', emailErr.message);
      }
    }
    
    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProductAdmin = async (req, res) => {
  try {
    const body = req.body;
    const updateData = { ...body };
    const existingProduct = await Product.findById(req.params.id);
    
    // Handle featured boolean
    if (body.featured !== undefined) {
      updateData.featured = body.featured === 'true' || body.featured === true;
    }

    // Handle badges - parse JSON if string
    if (body.badges) {
      try {
        updateData.badges = typeof body.badges === 'string' ? JSON.parse(body.badges) : body.badges;
      } catch (e) {
        delete updateData.badges;
      }
    }

    // Handle sale timer
    if (body.onSale !== undefined) {
      updateData.onSale = body.onSale === 'true';
      console.log('[Update] onSale:', body.onSale, '->', updateData.onSale);
    }
    // Only update saleEndsAt if explicitly provided (not empty string)
    if (body.saleEndsAt !== undefined && body.saleEndsAt !== null && body.saleEndsAt.trim() !== '') {
      const saleEndsAtRaw = new Date(body.saleEndsAt);
      if (!isNaN(saleEndsAtRaw.getTime())) {
        updateData.saleEndsAt = saleEndsAtRaw;
        console.log('[Update] saleEndsAt:', body.saleEndsAt, '->', updateData.saleEndsAt);
      }
    } else if (body.saleEndsAt === '') {
      // User cleared the date
      updateData.saleEndsAt = null;
      console.log('[Update] saleEndsAt cleared');
    }

    // Build nested pricing object if price is provided
    if (body.price) {
      updateData.pricing = {
        price: parseFloat(body.price),
        originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : undefined,
        currency: 'TND'
      };
    }

    // Build nested inventory object if stock is provided - preserve existing reserved quantity
    if (body.stock !== undefined && existingProduct) {
      const currentReserved = existingProduct.inventory?.reserved || 0;
      const newQuantity = parseInt(body.stock);
      updateData.inventory = {
        quantity: newQuantity + currentReserved,
        sku: body.sku || existingProduct.inventory?.sku,
        reserved: currentReserved
      };
    }
    
    if (req.files && req.files.length > 0) {
      updateData.media = {
        images: req.files.map(file => upload.getImageUrl(file))
      };
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    
    // Check if product was newly set to PROMO or onSale (not was already)
    const hadPromo = existingProduct?.badges?.includes('PROMO') || existingProduct?.onSale;
    const hasPromo = product.badges?.includes('PROMO') || product.onSale;
    
    if (!hadPromo && hasPromo) {
      console.log('📧 [Email] Product now has promo (was updated):', product.name);
      const EmailService = require('../../services/email.service');
      const Newsletter = require('../../models/Newsletter');
      
      try {
        const subscribers = await Newsletter.find({ isActive: true }).select('email');
        await EmailService.sendNewPromoNotification(product, subscribers);
      } catch (emailErr) {
        console.error('📧 [Email] Promo notification failed:', emailErr.message);
      }
    }
    
    res.json({ success: true, product });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProductAdmin = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const ruptureProducts = await Product.find({
      $expr: { $lte: ['$inventory.quantity', '$inventory.reserved'] }
    })
    .select('name inventory sku')
    .limit(20);
    
    const faibleProducts = await Product.find({
      $expr: { $gt: ['$inventory.quantity', '$inventory.reserved'] },
      $expr: { $lte: ['$inventory.quantity', { $add: ['$inventory.reserved', threshold] }] }
    })
    .select('name inventory sku')
    .limit(20);

    res.json({ 
      success: true, 
      products: [...ruptureProducts, ...faibleProducts],
      ruptureProducts,
      faibleProducts,
      ruptureCount: ruptureProducts.length,
      faibleCount: faibleProducts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, action, data } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Product IDs required' });
    }

    let result;
    switch (action) {
      case 'delete':
        result = await Product.deleteMany({ _id: { $in: productIds } });
        break;
      case 'activate':
        result = await Product.updateMany({ _id: { $in: productIds } }, { isActive: true });
        break;
      case 'deactivate':
        result = await Product.updateMany({ _id: { $in: productIds } }, { isActive: false });
        break;
      case 'updateStock':
        if (data?.stock !== undefined) {
          result = await Product.updateMany(
            { _id: { $in: productIds } },
            { 'inventory.quantity': data.stock }
          );
        } else {
          return res.status(400).json({ success: false, message: 'Stock value required' });
        }
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    res.json({ success: true, modified: result.modifiedCount || result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.duplicateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newProduct = new Product({
      ...product.toObject(),
      _id: undefined,
      name: `${product.name} (Copie)`,
      slug: `${product.slug}-copy-${Date.now()}`,
      createdAt: undefined,
      updatedAt: undefined,
      isActive: false
    });

    await newProduct.save();
    res.json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Quantité valide requise' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const addedQuantity = parseInt(quantity);
    const currentQuantity = product.inventory?.quantity || 0;
    product.inventory.quantity = currentQuantity + addedQuantity;

    await product.save();
    res.json({ 
      success: true, 
      message: `Stock ajouté: ${addedQuantity}`,
      product: {
        _id: product._id,
        name: product.name,
        inventory: product.inventory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
