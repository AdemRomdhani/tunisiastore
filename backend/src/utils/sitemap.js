const Product = require('../models/Product');
const Category = require('../models/Category');

exports.generateSitemap = async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://tunisiastore.tn';
    
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select('slug updatedAt'),
      Category.find({ isActive: true }).select('slug updatedAt')
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Static pages
    const staticPages = ['', '/products', '/login', '/register'];
    staticPages.forEach(page => {
      xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // Categories
    categories.forEach(cat => {
      xml += `  <url>\n    <loc>${baseUrl}/products?category=${cat.slug}</loc>\n    <lastmod>${cat.updatedAt?.toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    // Products
    products.forEach(prod => {
      xml += `  <url>\n    <loc>${baseUrl}/product/${prod.slug}</loc>\n    <lastmod>${prod.updatedAt?.toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
};