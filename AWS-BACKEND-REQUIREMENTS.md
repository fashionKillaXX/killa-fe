# AWS Backend Requirements for Fashion Killa

## 🎯 Backend Endpoints Required

Your frontend expects these backend endpoints to be available:

### Authentication Endpoints
```
GET  /fashion/auth/google/authorize/
POST /fashion/auth/google/callback/
```

### API Endpoints
```
GET  /fashion/api/products/batch/
POST /fashion/api/feedback/
POST /fashion/api/feedback/batch/
GET  /fashion/api/user/profile/
```

## 📡 Expected API Responses

### Google Authorization URL
```json
{
  "authorization_url": "https://accounts.google.com/oauth2/auth?..."
}
```

### Token Exchange Response
```json
{
  "access_token": "ya29.a0...",
  "refresh_token": "1//0G...",
  "user": {
    "id": "123456789",
    "name": "John Doe",
    "email": "john@example.com",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

### Products Response
```json
{
  "success": true,
  "products": [
    {
      "id": "product-123",
      "name": "Fashion Item",
      "url": "https://brand.com/product",
      "image_url": "https://images.example.com/image.jpg",
      "image_list": ["https://images.example.com/1.jpg"],
      "brand": {
        "id": "brand-1",
        "name": "Brand Name",
        "url": "https://brand.com"
      },
      "tags": {},
      "metadata": {
        "price": "2500",
        "sku_id": "SKU123",
        "collection": "Summer 2024",
        "availability": "in-stock",
        "extracted_at": "2024-01-01T00:00:00Z",
        "variant_title": "Size M"
      }
    }
  ]
}
```

### Feedback Request Format
```json
{
  "product_id": "product-123",
  "feedback_type": "high",
  "feedback_basis_price_type": "medium",
  "notes": ""
}
```

Valid feedback types: `"lowest" | "low" | "medium" | "high" | "highest" | "skip" | "save"`

### Batch Feedback Request
```json
{
  "feedback_list": [
    {
      "product_id": "product-123",
      "feedback_type": "high",
      "feedback_basis_price_type": "medium",
      "notes": ""
    }
  ]
}
```

## 🔐 Authentication Requirements

### Authorization Headers
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Google OAuth Setup
- **Authorized Origins**: Include your Hostinger domain
- **Redirect URIs**: `https://yourdomain.com/auth/google/callback/`

## 🌐 CORS Configuration

Your AWS backend must allow:

```javascript
{
  "origin": "https://yourdomain.com", // Your Hostinger domain
  "methods": ["GET", "POST", "OPTIONS"],
  "allowedHeaders": ["Content-Type", "Authorization"],
  "credentials": true
}
```

## 🚀 AWS Deployment Options

### Option 1: API Gateway + Lambda
- **API Gateway**: Handle HTTP requests
- **Lambda Functions**: Process business logic
- **DynamoDB**: Store user data and feedback
- **Cognito**: Handle user authentication (or custom OAuth)

### Option 2: ECS/EKS with Load Balancer
- **Application Load Balancer**: Route traffic
- **ECS/EKS**: Container orchestration
- **RDS**: Database for structured data
- **ElastiCache**: Session storage

### Option 3: Elastic Beanstalk
- **Simplified deployment**: Easy Django/Flask deployment
- **Auto-scaling**: Handle traffic spikes
- **RDS integration**: Database connectivity

## 📋 Deployment Checklist

When deploying your backend to AWS:

- [ ] Set up authentication endpoints
- [ ] Configure Google OAuth with production domain
- [ ] Implement CORS for your Hostinger domain
- [ ] Set up SSL/TLS certificate
- [ ] Configure environment variables
- [ ] Test all API endpoints
- [ ] Set up monitoring and logging
- [ ] Configure auto-scaling (if needed)

## 🔄 Frontend Update Process

After AWS deployment:

1. **Get your backend URL** (API Gateway URL or Load Balancer URL)
2. **Update frontend environment**:
   ```bash
   export NEXT_PUBLIC_BACKEND_URL="https://your-aws-url.com"
   ```
3. **Rebuild and redeploy frontend**:
   ```bash
   ./deploy-hostinger.sh
   ```

## 🧪 Testing Integration

### Test Endpoints Manually
```bash
# Test authentication URL
curl https://your-aws-url.com/fashion/auth/google/authorize/

# Test products (with auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-aws-url.com/fashion/api/products/batch/
```

### Frontend Testing
1. Deploy frontend with updated backend URL
2. Test Google authentication flow
3. Verify product loading
4. Test feedback submission
5. Check error handling and fallbacks

---

**Note**: This document outlines what your AWS backend needs to implement to work with your existing frontend code.

