#!/bin/bash

# Deployment script for Hostinger
# Fashion Killa Frontend Deployment

echo "🚀 Starting Fashion Killa Frontend deployment for Hostinger..."

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Set production environment variable if not already set
# Update this URL when your AWS backend is deployed
export NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL:-"http://api.fitcurry.shop"}

echo "🌐 Using backend URL: $NEXT_PUBLIC_BACKEND_URL"

# Build the application for production
echo "🏗️  Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Static files generated in 'out' directory"
    echo ""
    echo "📋 Next steps for Hostinger deployment:"
    echo "1. Compress the 'out' directory into a ZIP file"
    echo "2. Upload the ZIP file to your Hostinger hosting account"
    echo "3. Extract the ZIP file in your public_html directory"
    echo "4. Update NEXT_PUBLIC_BACKEND_URL when AWS backend is ready"
    echo ""
    echo "🔗 Your app will be available at: https://yourdomain.com"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

