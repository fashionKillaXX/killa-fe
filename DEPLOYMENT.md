# Fashion Killa Frontend - Hostinger Deployment Guide

## 🎯 Overview

This guide covers deploying your Fashion Killa frontend to Hostinger while preparing for a separate AWS backend deployment.

## 📋 Current Setup

- **Frontend**: Next.js 15 React application with static export
- **Authentication**: Google OAuth (requires backend)
- **API Endpoints**: `/fashion/api/` (requires backend)
- **Current Status**: Frontend ready for static hosting, backend pending AWS deployment

## 🚀 Hostinger Deployment Steps

### Step 1: Prepare for Deployment

1. **Update Backend URL** (when AWS backend is ready):
   ```bash
   # Set environment variable
   export NEXT_PUBLIC_BACKEND_URL="https://your-aws-backend-url.com"
   ```

2. **Run the deployment script**:
   ```bash
   ./deploy-hostinger.sh
   ```

### Step 2: Manual Deployment Process

If you prefer manual deployment:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# The static files will be in the 'out' directory
```

### Step 3: Upload to Hostinger

1. **Compress the output**:
   - Zip the entire `out` directory contents
   - **Important**: Compress the contents OF the `out` folder, not the folder itself

2. **Upload to Hostinger**:
   - Log into your Hostinger control panel
   - Go to File Manager
   - Navigate to `public_html` (or your domain's public directory)
   - Upload and extract the ZIP file
   - Ensure all files are in the root of `public_html`, not in a subfolder

3. **Set up redirects** (if needed):
   - Create `.htaccess` file in `public_html`:
   ```apache
   # Handle client-side routing
   RewriteEngine On
   RewriteBase /
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

## ⚠️ Important Considerations

### Authentication Flow
Your app uses Google OAuth that requires backend integration:

1. **Google OAuth callback**: `/auth/google/callback/`
2. **Authentication endpoints**: 
   - `/fashion/auth/google/authorize/`
   - `/fashion/auth/google/callback/`

**Action Required**: Update Google OAuth settings with your Hostinger domain when deployed.

### API Dependencies
Your frontend calls these backend endpoints:
- `GET /fashion/api/products/batch/` - Fetch products
- `POST /fashion/api/feedback/` - Submit feedback
- `POST /fashion/api/feedback/batch/` - Submit batch feedback
- `GET /fashion/api/user/profile/` - User profile

**Current Behavior**: Falls back to mock data when backend is unavailable.

## 🔧 Environment Configuration

### Development
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Production (Update when AWS backend is ready)
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-aws-api-gateway-url.amazonaws.com
# OR
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

## 🌐 AWS Backend Integration (Future)

When your backend is deployed to AWS, you'll need to:

1. **Update the backend URL**:
   - Set `NEXT_PUBLIC_BACKEND_URL` to your AWS API Gateway URL
   - Rebuild and redeploy the frontend

2. **Update Google OAuth settings**:
   - Add your Hostinger domain to authorized origins
   - Update redirect URIs to include your domain

3. **Configure CORS on AWS backend**:
   - Allow your Hostinger domain in CORS settings
   - Include necessary headers for authentication

## 🔍 Testing Your Deployment

### Pre-AWS Backend (Current State)
- ✅ Landing page should load
- ✅ UI components should work
- ⚠️ Authentication will not work (no backend)
- ⚠️ Data fetching will use mock data

### Post-AWS Backend Deployment
- ✅ Full authentication flow
- ✅ Real data from backend
- ✅ All API endpoints functional

## 🐛 Troubleshooting

### Common Issues

1. **404 on page refresh**:
   - Ensure `.htaccess` file is properly configured
   - Check if client-side routing is handled

2. **Authentication not working**:
   - Verify backend URL is correct
   - Check Google OAuth configuration
   - Ensure CORS is properly configured on backend

3. **API calls failing**:
   - Check browser console for network errors
   - Verify backend URL and endpoints
   - Confirm backend is deployed and accessible

### Debug Steps

1. **Check browser console** for JavaScript errors
2. **Verify network requests** in browser DevTools
3. **Test backend endpoints** directly (when available)
4. **Check environment variables** in the deployed app

## 📞 Next Steps

1. ✅ **Deploy frontend to Hostinger** (ready now)
2. 🕐 **Deploy backend to AWS** (pending)
3. 🕐 **Update frontend with production backend URL**
4. 🕐 **Configure Google OAuth for production domain**
5. 🕐 **Test full integration**

---

**Note**: Your frontend is ready for deployment and will work with mock data. Once your AWS backend is deployed, simply update the `NEXT_PUBLIC_BACKEND_URL` and redeploy for full functionality.

