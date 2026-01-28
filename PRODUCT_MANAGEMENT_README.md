# TOPOLINA Flipbook Website - Product Management System

## 🎉 New Features

Your flipbook website now includes a **comprehensive Product Management System** that allows you to:

✅ **Manage all products** (CHEMISE, PONTALON, JUPE, etc.)  
✅ **Add, edit, and delete patterns** for each product  
✅ **Change product names** (display names)  
✅ **Upload and change images** for patterns  
✅ **Real-time synchronization** - Changes in admin panel instantly reflect in the flipbook  

---

## 📁 Files Overview

### New Files:
- **`products-data.js`** - Centralized product catalog with default data

### Updated Files:
- **`admin.html`** - Added tabbed interface with Product Management section
- **`admin.css`** - Added styles for product management UI
- **`admin.js`** - Complete rewrite with product management functionality
- **`index.html`** - Added products-data.js script reference

---

## 🚀 How to Use the Product Management System

### 1. Access the Admin Panel

1. Open your website: `index.html`
2. Click on **"🔐 Admin Panel"** in the navigation sidebar
3. Login with password: **`topolina2024`**

### 2. Navigate to Product Management

- Click on the **"🎨 Product Management"** tab
- You'll see two tabs:
  - **📦 Order Management** (existing functionality)
  - **🎨 Product Management** (NEW!)

### 3. Select a Product to Edit

1. Use the dropdown menu to select a product (e.g., "CHEMISE", "PONTALON")
2. The product editor will load with all current patterns

### 4. Edit Product Information

**Change Product Display Name:**
- Edit the "Display Name" field
- This changes how the product appears in the flipbook

### 5. Manage Patterns

**Edit Existing Patterns:**
- Change the **Pattern ID** (e.g., "CH1", "P1")
- Change the **Pattern Name** (e.g., "CH 1", "JUPE 1")
- Click **"Change Image"** to upload a new image
- Click **"Delete"** to remove a pattern

**Add New Patterns:**
- Click the **"+ Add Pattern"** button
- A new pattern card will appear
- Fill in the ID and Name
- Upload an image

**Delete Patterns:**
- Click the **"Delete"** button on any pattern card
- Confirm the deletion

### 6. Save Changes

- Click the **"💾 Save Changes"** button at the bottom
- Your changes are saved to localStorage
- **The flipbook will automatically update!**

### 7. View Changes in Flipbook

1. Go back to the flipbook (`index.html`)
2. Navigate to the product you edited
3. **Your changes will be visible immediately!**

---

## 🔄 How Synchronization Works

The system uses **localStorage** to store product data:

1. **Admin Panel** saves changes to `localStorage` key: `topolina_products`
2. **Flipbook** reads from the same `localStorage` key
3. When you save in admin, the flipbook automatically updates
4. **No page refresh needed!** (though you may need to navigate to the page again)

---

## 📸 Image Upload

**Supported Formats:**
- JPG/JPEG
- PNG
- GIF
- WebP

**How Images are Stored:**
- Images are converted to **Base64** format
- Stored directly in localStorage
- No server upload required!

**Important Notes:**
- Large images may increase localStorage size
- Recommended image size: **500KB or less per image**
- localStorage has a limit of ~5-10MB depending on browser

---

## 🔧 Advanced Features

### Reset to Defaults

If you want to undo all changes and restore the original product catalog:

1. Go to **Product Management** tab
2. Click **"Reset to Defaults"** button
3. Confirm the action
4. All products will be restored to their original state

### Product Data Structure

Each product has:
```javascript
{
    displayName: "CHEMISE",           // Product name shown in flipbook
    coverImage: "images/...",          // Cover page image
    sketchImage: "images/...",         // Sketch page image
    patterns: [                        // Array of patterns
        {
            id: "CH1",                 // Pattern ID
            name: "CH 1",              // Pattern display name
            image: "images/..."        // Pattern image URL or Base64
        }
    ]
}
```

---

## 🌐 Launching Your Website

### What You Need:

1. **Domain** ✅ (You have this)
2. **Hosting** ✅ (You have this)
3. **All website files** ✅

### Upload Files:

Upload these files to your hosting:

```
📁 Website Root
├── index.html
├── admin.html
├── style.css
├── admin.css
├── script.js
├── admin.js
├── products-data.js          ← NEW!
├── translations.js
└── 📁 images/
    └── (all your product images)
```

### Important Configuration:

**Update Email Address:**

In `script.js` (line 304), change:
```javascript
window.location.href = `mailto:reda@example.com?subject=...
```

To your actual business email:
```javascript
window.location.href = `mailto:your-email@yourdomain.com?subject=...
```

---

## 🔐 Security Notes

**Admin Password:**
- Default password: `topolina2024`
- Change it in `admin.js` (line 2):
  ```javascript
  const ADMIN_PASSWORD = 'your-new-password';
  ```

**Important:**
- This is a **client-side** system
- Password is visible in the JavaScript code
- For production, consider adding server-side authentication

---

## 💡 Tips & Best Practices

1. **Backup Before Changes:**
   - Before making major edits, note down your current products
   - Use "Reset to Defaults" if something goes wrong

2. **Image Optimization:**
   - Compress images before uploading
   - Use tools like TinyPNG or ImageOptim
   - Smaller images = faster loading

3. **Consistent Naming:**
   - Keep pattern IDs consistent (e.g., CH1, CH2, CH3...)
   - Use clear, descriptive names

4. **Test Changes:**
   - After saving, always check the flipbook
   - Make sure images load correctly
   - Verify pattern names display properly

5. **Browser Compatibility:**
   - Works in all modern browsers
   - localStorage is supported everywhere
   - Test in Chrome, Firefox, Safari, Edge

---

## 🐛 Troubleshooting

**Changes not appearing in flipbook?**
- Make sure you clicked "Save Changes"
- Refresh the flipbook page
- Check browser console for errors

**Images not uploading?**
- Check file size (should be < 500KB)
- Verify file format (JPG, PNG, GIF, WebP)
- Try a different image

**Lost all data?**
- Click "Reset to Defaults" to restore original products
- All default products are stored in `products-data.js`

**Can't login to admin?**
- Check password in `admin.js`
- Clear browser cache
- Try incognito/private mode

---

## 📞 Support

For questions or issues:
1. Check this README first
2. Review the browser console for errors (F12)
3. Contact your developer

---

## 🎨 Customization

Want to add more features?

- **Add new product categories:** Edit `DEFAULT_PRODUCTS` in `products-data.js`
- **Change admin styling:** Edit `admin.css`
- **Modify flipbook behavior:** Edit `script.js`

---

**Enjoy your new Product Management System! 🎉**
