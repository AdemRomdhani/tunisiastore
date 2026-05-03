# Deployment Guide (Free)

## Tech Stack
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

---

## Step 1: MongoDB Atlas Setup

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free account
3. Create free cluster (M0)
4. Create database user (username + password)
5. Network Access → Allow All (0.0.0.0/0)
6. Database → Connect → Copy connection string:
   ```
   mongodb+srv://<user>:<password>@cluster.mongodb.net/tunisia-store
   ```

---

## Step 2: Backend (Render)

1. Go to https://render.com → Sign up with GitHub
2. Create New Web Service
3. Connect your GitHub repo (backend folder)
4. Settings:
   - Name: tunisia-store-api
   - Root Directory: backend
   - Build Command: (empty)
   - Start Command: node server.js
5. Environment Variables:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/tunisia-store
   JWT_SECRET=<generate-random-string>
   CLOUDINARY_CLOUD_NAME=<your-cloud-name>
   CLOUDINARY_API_KEY=<your-api-key>
   CLOUDINARY_API_SECRET=<your-api-secret>
   ```
6. Deploy

7. Copy your backend URL (e.g., https://tunisia-store-api.onrender.com)

---

## Step 3: Frontend (Vercel)

1. Go to https://vercel.com → Sign up with GitHub
2. Add New Project → Select your repo
3. Settings:
   - Framework Preset: Angular
   - Root Directory: frontend
   - Build Command: ng build
   - Output Directory: dist/tunisia-store
4. Environment Variables:
   ```
   API_URL=https://tunisia-store-api.onrender.com
   ```
5. Deploy

---

## Step 4: Update Backend CORS

In `backend/server.js`, update CORS to allow your Vercel frontend URL:

```javascript
app.use(cors({
  origin: ['http://localhost:4200', 'https://your-frontend.vercel.app'],
  credentials: true
}));
```

---

## Step 5: Update Frontend API URL

In `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tunisia-store-api.onrender.com'
};
```

Then rebuild and deploy again.

---

## Done!

Your app will be live at:
- Frontend: https://tunisia-store.vercel.app
- Backend: https://tunisia-store-api.onrender.com