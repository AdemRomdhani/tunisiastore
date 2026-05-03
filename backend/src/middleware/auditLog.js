const AuditLog = require('../models/AuditLog');

const getResourceName = (resource, body, req) => {
  switch (resource) {
    case 'PRODUCT':
      return body?.product?.name || body?.name || req.body?.name || req.body?.title || '';
    case 'CATEGORY':
      return body?.category?.name || body?.name || req.body?.name || '';
    case 'COUPON':
      return body?.coupon?.code || body?.code || req.body?.code || '';
    case 'USER':
      return body?.user ? `${body.user.firstName} ${body.user.lastName}` : 
             req.body?.firstName ? `${req.body.firstName} ${req.body.lastName}` : '';
    case 'CONTACT':
      return body?.contact?.email || req.body?.email || '';
    case 'ORDER':
      return body?.order?.orderNumber || body?.orderNumber || '';
    case 'RETURN':
      return body?.return?.orderNumber || '';
    case 'CMS':
      return body?.page?.title || body?.title || req.body?.title || '';
    case 'NEWSLETTER':
      return body?.subscriber?.email || req.params?.id || '';
    case 'BUNDLE':
      return body?.bundle?.name || body?.name || req.body?.name || '';
    default:
      return req.body?.name || req.body?.title || req.body?.code || '';
  }
};

const getResourceId = (resource, body, req) => {
  switch (resource) {
    case 'PRODUCT':
      return body?.product?._id || body?._id || req.params?.id || req.body?._id || null;
    case 'CATEGORY':
      return body?.category?._id || body?._id || req.params?.id || req.body?._id || null;
    case 'COUPON':
      return body?.coupon?._id || body?._id || req.params?.id || req.body?._id || null;
    case 'USER':
      return body?.user?._id || req.params?.id || req.body?._id || null;
    case 'CONTACT':
      return body?.contact?._id || req.params?.id || null;
    case 'ORDER':
      return body?.order?._id || req.params?.id || null;
    case 'RETURN':
      return body?.return?._id || req.params?.id || null;
    case 'CMS':
      return body?.page?._id || body?._id || req.params?.id || null;
    default:
      return body?._id || req.params?.id || req.body?._id || null;
  }
};

const getDescription = (action, resource, resourceName, body, previousData) => {
  const actionLabels = {
    'CREATE': 'a créé',
    'UPDATE': 'a modifié',
    'DELETE': 'a supprimé',
    'LIST': 'a listé',
    'READ': 'a consulté',
    'LOGIN': 's\'est connecté',
    'LOGOUT': 's\'est déconnecté',
    'EXPORT': 'a exporté',
    'RESTORE': 'a restauré'
  };
  
  const resourceLabels = {
    'PRODUCT': 'produit',
    'CATEGORY': 'catégorie',
    'COUPON': 'coupon',
    'USER': 'utilisateur',
    'CONTACT': 'message',
    'ORDER': 'commande',
    'RETURN': 'retour',
    'CMS': 'page',
    'NEWSLETTER': 'abonné',
    'BUNDLE': 'bundle'
  };

  const actionLabel = actionLabels[action] || action;
  const resourceLabel = resourceLabels[resource] || resource;
  const name = resourceName ? ` "${resourceName}"` : '';

  let details = '';
  
  if (action === 'UPDATE' && body) {
    const changes = [];
    
    // Product fields
    if (body.name) changes.push(`nom: ${body.name}`);
    if (body.price !== undefined) changes.push(`prix: ${body.price}`);
    if (body.pricing?.price !== undefined) changes.push(`prix: ${body.pricing.price}`);
    if (body.stock !== undefined || body.inventory?.quantity !== undefined) changes.push(`stock: ${body.inventory?.quantity || body.stock}`);
    if (body.status) changes.push(`status: ${body.status}`);
    if (body.isActive !== undefined) changes.push(`actif: ${body.isActive}`);
    if (body.category) changes.push(`catégorie`);
    if (body.description) changes.push(`description`);
    if (body.media?.images) changes.push(`images`);
    
    // Order fields
    if (body.status) changes.push(`statut: ${body.status}`);
    if (body.trackingNumber) changes.push(`suivi: ${body.trackingNumber}`);
    if (body.shippingCost !== undefined) changes.push(`livraison: ${body.shippingCost}`);
    
    // User fields
    if (body.firstName || body.lastName) changes.push(`nom: ${body.firstName} ${body.lastName}`);
    if (body.email) changes.push(`email: ${body.email}`);
    if (body.role) changes.push(`rôle: ${body.role}`);
    
    // Category fields
    if (body.name) changes.push(`nom: ${body.name}`);
    if (body.slug) changes.push(`slug: ${body.slug}`);
    
    // Coupon fields
    if (body.code) changes.push(`code: ${body.code}`);
    if (body.discount !== undefined) changes.push(`réduction: ${body.discount}`);
    if (body.usageLimit !== undefined) changes.push(`utilisations: ${body.usageLimit}`);
    
    // Return fields
    if (body.status) changes.push(`statut: ${body.status}`);
    if (body.adminNotes) changes.push(`notes admin`);
    
    if (changes.length > 0) {
      details = ` [${changes.slice(0, 4).join(', ')}${changes.length > 4 ? '...' : ''}]`;
    } else {
      details = ` (champs mis à jour)`;
    }
  } else if (action === 'CREATE') {
    details = ` (nouveau${resource === 'PRODUCT' ? ' produit créé' : ''})`;
  } else if (action === 'DELETE') {
    details = ` (supprimé définitivement)`;
  } else if (action === 'LIST' || action === 'READ') {
    const page = body?.page || body?.pageNumber || 1;
    const limit = body?.limit || 10;
    const total = body?.total || body?.length;
    details = ` (page: ${page}, limite: ${limit}${total !== undefined ? `, total: ${total}` : ''})`;
  } else if (action === 'EXPORT') {
    const format = body?.format || 'CSV';
    const count = body?.count || body?.length;
    details = ` (format: ${format}${count ? `, ${count} éléments` : ''})`;
  } else if (action === 'LOGIN') {
    details = ` (connexion réussie)`;
  } else if (action === 'LOGOUT') {
    details = ` (déconnexion)`;
  }

  return `${actionLabel} ${resourceLabel}${name}${details}`;
};

exports.auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const user = req.user;
        if (user && (user.role === 'admin' || user.role === 'moderator' || user.role === 'supervisor')) {
          const resourceName = getResourceName(resource, body, req);
          const resourceId = getResourceId(resource, body, req);
          const description = getDescription(action, resource, resourceName, req.body, null);

          AuditLog.create({
            adminId: user._id,
            adminName: `${user.firstName} ${user.lastName}`,
            adminEmail: user.email,
            action,
            resource,
            resourceId,
            resourceName,
            description,
            changes: req.body,
            ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || req.headers['x-real-ip'] || '',
            userAgent: req.headers['user-agent'] || ''
          }).catch(err => console.error('Audit log error:', err));
        }
      }
      return originalJson(body);
    };

    next();
  };
};