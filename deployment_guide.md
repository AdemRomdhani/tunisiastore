# 🚀 Tunisia Store — Deployment Guide (Go Live on Internet)

> Your app is **100% ready** to go online. You just need to set up the services below and configure the environment variables.

---

## ✅ What You Already Have (Good)
- ✅ SMTP email (Gmail configured and working)
- ✅ `npm start` script in backend
- ✅ `ng build` available in frontend
- ✅ All features tested and working

---

## ❌ What Is Missing / Needs To Be Set Up

### Summary Table

| What | Current Value | Needed For |
|---|---|---|
| `MONGODB_URI` | `localhost:27017` ❌ | Database on the internet |
| `CLOUDINARY_*` | `your_cloud_name` ❌ | Image uploads |
| `JWT_SECRET` | Weak default ❌ | Security |
| `KONNECT_API_KEY` | placeholder ❌ | Online card payment |
| `SMS_TO_KEY` | placeholder ❌ | SMS notifications |
| `FRONTEND_URL` | `localhost:4200` ❌ | CORS + payment redirects |
| Angular `apiUrl` | `localhost:3000` ❌ | Frontend → Backend connection |

---

## 📋 Step-by-Step Setup

---

## STEP 1 — MongoDB Atlas (Free Database Online)

> Replace your local MongoDB with a cloud database.

1. Go to **https://cloud.mongodb.com** → Create free account
2. Create a **free M0 cluster** (choose region: Europe - Paris or Frankfurt)
3. Create a database user (username + password)
4. Add your IP: **Allow access from anywhere** (0.0.0.0/0)
5. Click **Connect** → **Drivers** → Copy your connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/tunisia_store
   ```
6. In your `.env`, replace:
   ```env
   MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/tunisia_store
   ```

---

## STEP 2 — Cloudinary (Free Image Hosting)

> Currently your images upload to the local `uploads/` folder — this won't work online.

1. Go to **https://cloudinary.com** → Create free account
2. Go to **Dashboard** → Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret
3. In your `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_real_cloud_name
   CLOUDINARY_API_KEY=your_real_api_key
   CLOUDINARY_API_SECRET=your_real_api_secret
   ```

---

## STEP 3 — Fix JWT Secret

> Your current secret is weak. Generate a strong one.

Run this command and copy the output:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Then in `.env`:
```env
JWT_SECRET=paste_the_generated_value_here
```

---

## STEP 4 — Deploy Backend (Choose One)

### Option A: Railway (Recommended — Easiest, Free Tier)
1. Go to **https://railway.app** → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub Repo**
3. Select your `tunisia-store` repository → select the `backend` folder
4. Railway will auto-detect Node.js and run `npm start`
5. Go to **Variables** tab → Add ALL your `.env` variables
6. Click **Generate Domain** → You get a URL like: `https://tunisia-store-api.railway.app`

### Option B: Render (Free — 512MB RAM)
1. Go to **https://render.com** → Sign up
2. New → **Web Service** → Connect GitHub repo → Root directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables in the dashboard
6. You get a URL like: `https://tunisia-store-api.onrender.com`

> ⚠️ **Note:** Free Render tier sleeps after 15 min of inactivity. Use Railway for better performance.

---

## STEP 5 — Deploy Frontend (Vercel — Free)

> After deploying backend, you'll have a real API URL (e.g., `https://tunisia-store-api.railway.app`).

### First — Create Production Environment File

Create file: `frontend/src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://YOUR-BACKEND-URL.railway.app/api',  // ← your real backend URL
  appName: 'Tunisia Store',
  currency: 'TND',
  currencySymbol: 'DT',
  freeShippingThreshold: 200,
  contact: {
    phone: '+216 55 226 228',
    email: 'adem.micro13@gmail.com',
    address: 'Tunis, Tunisia'
  }
};
```

### Deploy to Vercel
1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **New Project** → Import your repo → Set **Root Directory** to `frontend`
3. Framework: **Angular**
4. Build Command: `ng build --configuration production`
5. Output Directory: `dist/tunisia-store/browser`
6. Deploy → You get a URL like: `https://tunisia-store.vercel.app`

### Fix Angular Router (Important!)
Create file `frontend/public/vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This prevents 404 errors when refreshing the page on routes like `/products`.

---

## STEP 6 — Update Backend CORS & FRONTEND_URL

After deploying frontend, update your backend `.env`:
```env
FRONTEND_URL=https://tunisia-store.vercel.app
```

And update `server.js` CORS to allow your Vercel domain:
```javascript
// In server.js, replace:
res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
// With:
res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL);

// And:
app.use(cors({ origin: [process.env.FRONTEND_URL], credentials: true }));
```

---

## STEP 7 — Payment (Konnect - Optional)

> Only needed if you want online card payments. COD (cash on delivery) works without this.

1. Register at **https://konnect.network** (Tunisian payment gateway)
2. Get your API key and wallet ID
3. In `.env`:
   ```env
   KONNECT_API_KEY=your_real_key
   KONNECT_WALLET_ID=your_wallet_id
   ```

---

## STEP 8 — SMS Notifications (Optional)

> SMS.to has a free trial. Register at **https://sms.to**

```env
SMS_TO_KEY=your_real_sms_to_key
```

---

## 🏁 Final Checklist Before Going Live

- [ ] MongoDB Atlas connected (not localhost)
- [ ] Cloudinary credentials real (not placeholder)
- [ ] JWT_SECRET is a strong random string
- [ ] Backend deployed to Railway/Render
- [ ] `environment.prod.ts` has real backend URL
- [ ] Frontend deployed to Vercel
- [ ] `FRONTEND_URL` in backend `.env` updated
- [ ] CORS in `server.js` updated to use env variable
- [ ] `vercel.json` added to frontend for Angular routing
- [ ] Test all pages live after deployment

---

## 💰 Cost Summary

| Service | Cost |
|---|---|
| MongoDB Atlas M0 | **FREE** (512MB) |
| Cloudinary | **FREE** (25GB storage) |
| Railway | **FREE** ($5 credit/month) |
| Vercel | **FREE** (hobby plan) |
| Domain name | ~10$/year (optional) |
| Konnect payment | Commission per transaction |
| **Total** | **0 DT/month** to start |

---

## 🌐 Custom Domain (Optional)

If you buy a domain (e.g., `tunisiastore.tn` from **https://www.tn-domains.tn**):
- Point `api.tunisiastore.tn` → your Railway/Render URL
- Point `www.tunisiastore.tn` → your Vercel URL
- Update `environment.prod.ts` and `FRONTEND_URL` accordingly
