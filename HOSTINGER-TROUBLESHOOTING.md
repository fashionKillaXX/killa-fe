# 🔧 Hostinger Deployment Troubleshooting

## ❌ IGNORE GitHub Deployment

The deployment log you saw is for PHP projects. For Next.js static files:
- ❌ **DON'T** use GitHub integration
- ✅ **DO** upload static files manually

## 🛠️ Troubleshooting Steps

### Step 1: Verify Upload Structure
Your `public_html` should look like this:
```
public_html/
├── index.html          ← Main page
├── _next/              ← Next.js assets
├── 404.html           ← Error page
├── auth/              ← Auth callback
├── favicon.ico        ← Icon
└── other files...     ← Static assets
```

**NOT like this:**
```
public_html/
└── out/               ← Wrong! Don't upload the folder
    ├── index.html
    └── _next/
```

### Step 2: Clear Cache Issues
1. **Hard refresh**: Ctrl+Shift+R (PC) / Cmd+Shift+R (Mac)
2. **Clear browser cache** completely
3. **Try incognito mode**
4. **Try different browser**
5. **Check on mobile** (different network)

### Step 3: Verify Domain Settings
In Hostinger control panel:
1. **Check domain pointing** to correct directory
2. **Verify SSL certificate** is active
3. **Check if domain is fully propagated**

### Step 4: Test Direct File Access
Try accessing files directly:
- `https://yourdomain.com/index.html`
- `https://yourdomain.com/404.html`
- `https://yourdomain.com/_next/static/...`

### Step 5: Check File Permissions
In File Manager, ensure:
- **Files**: 644 permissions
- **Directories**: 755 permissions

## 🔄 Quick Re-deployment

1. **Delete everything** in `public_html`
2. **Rebuild locally**:
   ```bash
   npm run build
   ```
3. **Zip CONTENTS** of `out` folder
4. **Upload and extract** to `public_html`
5. **Hard refresh** browser

## 🚨 Common Mistakes

| ❌ Wrong | ✅ Correct |
|----------|------------|
| Upload `out` folder | Upload contents of `out` |
| Extract to subfolder | Extract to `public_html` root |
| Use GitHub deployment | Use file upload |
| Regular refresh | Hard refresh (Ctrl+Shift+R) |

## ✅ Quick Verification

After upload, check these URLs work:
- `https://yourdomain.com` → Should load your app
- `https://yourdomain.com/404` → Should show 404 page
- `https://yourdomain.com/auth/google/callback` → Should load callback page

## 🆘 Still Not Working?

1. **Check browser console** for errors (F12)
2. **Verify in File Manager** that files are in `public_html` root
3. **Test from different device/network**
4. **Contact Hostinger support** if domain/DNS issues

---

**Remember**: You're doing static file hosting, not Git deployment!

