#!/bin/bash

# Manual Build Script for Maximise AE Tools Extension
# Run this to build and deploy the React components

echo "🔨 Starting manual build process..."

# Set working directory
cd "/Users/ishanramrakhiani/Library/Application Support/Adobe/CEP/extensions/Maximise AE Tools"

# Run the build
echo "📦 Running npm build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Copy built files
    echo "📁 Copying built files..."
    
    # Copy JavaScript files
    cp build/static/js/main.*.js js/ 2>/dev/null
    echo "  ✓ JavaScript files copied"
    
    # Copy CSS files  
    cp build/static/css/main.*.css css/ 2>/dev/null
    echo "  ✓ CSS files copied"
    
    echo "🎉 Manual build and deployment complete!"
    echo "🚀 Extension is ready with new features:"
    echo "   - Fixed autonomous agent (no more tool calls for scripts)"
    echo "   - Undo & Fix functionality"
    echo "   - Enhanced error handling"
    
else
    echo "❌ Build failed!"
    exit 1
fi