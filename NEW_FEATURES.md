# Tunisia Store - New Features Added

## Completed Features

### Backend (Node.js/Express)

1. **Order Cancellation** (`order.controller.js`)
   - Added `cancelOrder` endpoint
   - Allows cancellation for PENDING/CONFIRMED orders
   - Releases reserved stock
   
2. **Return/Refund System** (NEW)
   - `models/Return.js` - Return/refund model
   - `controllers/return.controller.js` - CRUD operations
   - `routes/return.routes.js` - API routes
   - Supports returns within 14 days of delivery
   
3. **Saved Addresses** (NEW)
   - `models/Address.js` - Address model
   - `controllers/address.controller.js` - CRUD operations
   - `routes/address.routes.js` - API routes
   - Supports default addresses
   
4. **Shipping Integration** (NEW)
   - `services/shipping.service.js` - Tunisia Post, Amena, Aramex
   - `routes/shipping.routes.js` - Shipment creation, tracking, costs
   
### Frontend (Angular)

5. **PWA Support**
   - Added `@angular/pwa`
   - Created `manifest.webmanifest`
   - Created `ngsw-config.json`
   - Service worker for offline support
   
6. **Arabic/i18n** (NEW)
   - `core/services/i18n.service.ts` - Translation service
   - `shared/components/language-switcher` - Language toggle
   - RTL styles in `styles.css`
   - Full French/Arabic translations

7. **WhatsApp Chat** (NEW)
   - `shared/components/whatsapp-chat` - Floating button
   - `core/services/whatsapp.service.ts` - Configuration

### Already Available
- Guest checkout (already in code)
- Local payment methods D17/Card (already in checkout)