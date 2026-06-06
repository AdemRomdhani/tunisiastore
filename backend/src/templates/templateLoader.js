const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'emails');
const partialsDir = path.join(TEMPLATES_DIR, 'partials');
const cache = {};

function loadPartial(name) {
  if (cache[`partial:${name}`]) return cache[`partial:${name}`];
  const filePath = path.join(partialsDir, `${name}.html`);
  const content = fs.readFileSync(filePath, 'utf-8');
  cache[`partial:${name}`] = content;
  return content;
}

function loadTemplate(templateName) {
  if (cache[templateName]) return cache[templateName];
  const filePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
  const content = fs.readFileSync(filePath, 'utf-8');
  cache[templateName] = content;
  return content;
}

function renderTemplate(templateName, variables = {}) {
  let html = loadTemplate(templateName);

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, value ?? '');
  }

  return html;
}

function buildHeader() {
  return loadPartial('header');
}

function buildFooter() {
  return loadPartial('footer');
}

function buildItemsTable(items) {
  const rows = items.map(item => {
    const name = item.name || item.product?.name || 'Produit';
    const qty = item.quantity;
    const price = (item.price || 0).toFixed(3);
    return `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569; text-align: center;">${qty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #1e293b;">${price} TND</td>
      </tr>`;
  }).join('');

  const tableTemplate = loadPartial('items-table');
  return tableTemplate.replace('{{itemsRows}}', rows);
}

function buildStatusBadge(status, label) {
  const colors = {
    PENDING: '#fef3c7; color: #92400e;',
    CONFIRMED: '#dbeafe; color: #1e40af;',
    PROCESSING: '#e0e7ff; color: #3730a3;',
    SHIPPED: '#d1fae5; color: #065f46;',
    DELIVERED: '#dcfce7; color: #166534;',
    CANCELLED: '#fee2e2; color: #991b1b;',
    APPROVED: '#d1fae5; color: #065f46;',
    REJECTED: '#fee2e2; color: #991b1b;'
  };
  const color = colors[status] || '#f1f5f9; color: #475569;';
  return `<span style="background: ${color}; display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${label}</span>`;
}

function clearCache() {
  Object.keys(cache).forEach(key => delete cache[key]);
}

module.exports = {
  loadTemplate,
  renderTemplate,
  loadPartial,
  buildHeader,
  buildFooter,
  buildItemsTable,
  buildStatusBadge,
  clearCache
};
