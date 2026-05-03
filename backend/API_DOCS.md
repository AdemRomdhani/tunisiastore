# Tunisia Store API Documentation

## Base URL
```
http://localhost:3000/api
```

---

## AUTH ENDPOINTS (`/api/auth`)

### POST /register
```json
{
  "firstName": "Adem",
  "lastName": "Ben Ali",
  "email": "adem@example.com",
  "password": "password123",
  "phone": "21234567"
}
```

### POST /login
```json
{
  "email": "adem@example.com",
  "password": "password123"
}
```
Returns: `{ success: true, token: "jwt...", user: {...} }`

### POST /forgot-password
```json
{ "email": "adem@example.com" }
```
Sends password reset email

### POST /reset-password
```json
{ "token": "jwt-token", "password": "newpassword123" }
```

### POST /verify-email
```json
{ "token": "jwt-token" }
```

### GET /me (Auth required)
Returns user profile

### PUT /profile (Auth required)
```json
{ "firstName": "New", "lastName": "Name", "phone": "29999999" }
```

---

## PRODUCTS (`/api/products`)

### GET /
| Parameter | Values | Description |
|-----------|--------|------------|
| page | number | Page number |
| limit | 1-50 | Items per page |
| category | string | Category slug |
| minPrice | number | Min price |
| maxPrice | number | Max price |
| sort | `price-asc`, `price-desc`, `rating`, `name` | Sort order |
| search | string | Text search |
| featured | true | Featured products |
| onSale | true | On sale products |
| inStock | true | In stock only |
| badges | PROMO,NEW,BESTSELLER | Filter by badge |
| rating | 1-5 | Min rating |

Example: `/api/products?category=phones&minPrice=500&maxPrice=2000&sort=price-asc`

### GET /:slug
Get single product with reviews

### POST / (Admin)
Create product

### PUT /:id (Admin)
Update product

### DELETE /:id (Admin)
Soft delete product

---

## CATEGORIES (`/api/categories`)

### GET /
### GET /:slug
### GET /:slug/products (products in category)

---

## CART (`/api/cart`)

### GET (Auth required)
Get cart with totals

### POST (Auth required)
```json
{ "productId": "...", "quantity": 1, "attributes": [] }
```

### PUT /:itemId (Auth required)
```json
{ "quantity": 2 }
```

### DELETE /:itemId (Auth required)

### DELETE /clear (Auth required)

---

## ORDERS (`/api/orders`)

### POST / (Auth OR Guest)
```json
{
  "shippingAddress": {
    "fullName": "Adem Ben Ali",
    "phone": "21234567",
    "governorate": "Tunis",
    "city": "Tunis",
    "streetAddress": "123 Main St"
  },
  "paymentMethod": "CASH_ON_DELIVERY",
  "couponCode": "SAVE10"  // optional
}
```

**Guest checkout** (no auth):
```json
{
  "shippingAddress": { ... },
  "paymentMethod": "CASH_ON_DELIVERY",
  "guestEmail": "guest@example.com",
  "guestPhone": "21234567"
}
```

### GET /track (Public)
```json
{ "orderNumber": "ORD-123", "email": "customer@example.com" }
```

### GET /my-orders (Auth required)
### GET /my-orders/:id (Auth required)

---

## COUPONS (`/api/coupons`)

### GET /validate?code=SAVE10&subtotal=100
Public - validate coupon

### POST /apply (Auth required)
```json
{ "code": "SAVE10", "subtotal": 100 }
```

### CRUD / (Admin only)
- GET / - list coupons
- POST / - create coupon
- PUT /:id - update coupon
- DELETE /:id - delete coupon

**Coupon Schema:**
```json
{
  "code": "SAVE20",
  "type": "PERCENTAGE",  // or FIXED, FREE_SHIPPING
  "value": 20,
  "minOrderAmount": 50,
  "maxDiscountAmount": 50,
  "usage": { "totalLimit": 100, "perUserLimit": 1 },
  "validFrom": "2024-01-01",
  "validUntil": "2024-12-31"
}
```

---

## WISHLIST (`/api/wishlist`)

### GET / (Auth required)
### POST /add (Auth required)
```json
{ "productId": "..." }
```
### DELETE /remove/:productId (Auth required)
### DELETE /clear (Auth required)

---

## NEWSLETTER (`/api/newsletter`)

### POST /subscribe
```json
{ "email": "user@example.com" }
```

### POST /unsubscribe
```json
{ "email": "user@example.com" }
```

### GET / (Admin)
List subscribers

---

## RECENTLY VIEWED (`/api/recently-viewed`)

### GET /
Headers: `x-device-id: uuid` (for guests)

### POST /add
```json
{ "productId": "..." }
```
Headers: `x-device-id: uuid` (for guests)

---

## CMS PAGES (`/api/cms`)

### GET /pages
List all pages

### GET /page/:slug
Get single page (about, terms, privacy)

### GET /faqs
Get all FAQs

### CRUD / (Admin)
Create/update/delete pages

---

## BUNDLES (`/api/bundles`)

### GET /
### GET /:slug
### CRUD / (Admin)

---

## ADMIN (`/api/admin`)

### GET /dashboard
Full analytics:
- Total orders, revenue, users, products
- Orders this month/week
- Monthly/weekly revenue
- Low stock alerts
- Orders by status
- Orders by governorate
- Top selling products

### GET /products
### GET /products/:id
### POST /products
### PUT /products/:id
### GET /orders
### PUT /orders/:id/status
```json
{ "status": "SHIPPED", "note": "Shipped via Aramex" }
```
### GET /low-stock

---

## PAYMENTS (`/api/payment`)

### POST /create-intent
```json
{ "amount": 100 }
```
Returns Stripe payment intent

---

## GOVERNORATES (Tunisia)

Valid shipping governorates:
- Tunis, Ariana, Ben Arous, Manouba, Nabeul, Zaghouan
- Bizerte, Beja, Jendouba, Kef, Siliana
- Sousse, Monastir, Mahdia, Kairouan, Kasserine
- Sidi Bouzid, Gabes, Medenine, Tataouine, Gafsa, Tozeur, Kebili

---

## PAYMENT METHODS

- `CASH_ON_DELIVERY` - Payment on delivery
- `CARD_ONLINE` - Stripe card payment
- `D17` - D17 payment
- `FLOUSSI` - Floussi payment
- `BANK_TRANSFER` - Bank transfer
- `EDINAR` - e-Dinar

---

## ORDER STATUS

- `PENDING` - Order placed
- `CONFIRMED` - Order confirmed
- `PROCESSING` - Being prepared
- `SHIPPED` - Shipped to customer
- `DELIVERED` - Delivered
- `CANCELLED` - Cancelled
- `REFUNDED` - Refunded

---

## ERROR RESPONSE

```json
{ "success": false, "message": "Error message" }
```

---

## SUCCESS RESPONSE

```json
{ "success": true, "data": {...} }
```