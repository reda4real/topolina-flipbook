# 🖼️ IMAGE MANAGEMENT - NEW FEATURE!

## ✨ What's New

You now have a **third tab** in the admin panel: **🖼️ Image Management**!

This allows you to change:
- ✅ **Cover Images** - The first page for each product
- ✅ **Sketch Images** - The design/sketch page for each product  
- ✅ **Shop Images** - The lifestyle/shop photos (if applicable)

---

## 🎯 How to Use Image Management

### **Step 1: Access the Admin Panel**
1. Open `admin.html`
2. Login (password: `topolina2024`)
3. Click the **"🖼️ Image Management"** tab

### **Step 2: Select a Product**
1. Use the dropdown to select a product (e.g., "CHEMISE", "VEST")
2. The image editor will load showing current images

### **Step 3: Upload New Images**

You'll see three sections (depending on the product):

#### **📸 Cover Image**
- Shows current cover image
- Click "📤 Upload New Cover Image"
- Select your image file
- Preview appears immediately

#### **✏️ Sketch Image**
- Shows current sketch/design image
- Click "📤 Upload New Sketch Image"
- Select your image file
- Preview appears immediately

#### **🛍️ Shop Image** (if applicable)
- Shows current shop/lifestyle image
- Click "📤 Upload New Shop Image"
- Select your image file
- Preview appears immediately

### **Step 4: Save Changes**
1. After uploading images, click **"💾 Save Image Changes"**
2. Confirmation message appears
3. Images are saved to localStorage

### **Step 5: View in Flipbook**
1. Open `index.html` (or refresh if already open)
2. Press **F5** to reload
3. Navigate to the product you edited
4. ✅ **New images appear!**

---

## 📁 Files Created/Modified

### **New Files:**
- **`image-management.js`** - Image upload and management logic

### **Modified Files:**
- **`admin.html`** - Added Image Management tab
- **`admin.css`** - Added image management styles
- **`admin.js`** - Added image management event listeners
- **`dynamic-pages.js`** - Updated to use custom shop images

---

## 🎨 Supported Image Formats

- **JPG/JPEG** - Best for photos
- **PNG** - Best for graphics with transparency
- **GIF** - Animated images supported
- **WebP** - Modern format, smaller file sizes

### **Recommended Sizes:**
- **Cover Images:** 600×900px or similar aspect ratio
- **Sketch Images:** 600×900px or similar aspect ratio
- **Shop Images:** 1200×800px or similar landscape
- **File Size:** Keep under 500KB for best performance

---

## 💡 How It Works

### **Image Storage:**
1. You upload an image
2. Image is converted to **Base64** format
3. Stored in localStorage with product data
4. Flipbook reads from localStorage on load
5. Your custom images appear!

### **Data Structure:**
```javascript
{
    "CHEMISE": {
        displayName: "CHEMISE",
        coverImage: "data:image/jpeg;base64,/9j/4AAQ...",  // Your custom image
        sketchImage: "data:image/png;base64,iVBORw0...", // Your custom image
        shopImage: "data:image/jpeg;base64,/9j/4AAQ...",  // Your custom image (optional)
        patterns: [...]
    }
}
```

---

## 🔄 Complete Workflow Example

### **Changing VEST Cover Image:**

1. **Admin Panel:**
   - Open `admin.html` → Login
   - Click "🖼️ Image Management"
   - Select "VEST" from dropdown
   - Click "Upload New Cover Image"
   - Choose your new image
   - See preview update
   - Click "💾 Save Image Changes"

2. **Flipbook:**
   - Open `index.html` → Press F5
   - Click "Vest" in navigation
   - ✅ **New cover image shows!**

---

## 📊 Admin Panel Structure

Your admin panel now has **3 tabs**:

| Tab | Purpose | What You Can Do |
|-----|---------|-----------------|
| 📦 **Order Management** | View customer orders | View, confirm, delete orders |
| 🎨 **Product Management** | Edit products & patterns | Change names, add/edit/delete patterns, upload pattern images |
| 🖼️ **Image Management** | Change main images | Upload cover, sketch, and shop images |

---

## ⚠️ Important Notes

### **Image Size Limits:**
- localStorage has a limit of ~5-10MB per domain
- Large images increase storage usage
- **Recommendation:** Compress images before uploading
- Use tools like TinyPNG, ImageOptim, or online compressors

### **Shop Images:**
Not all products have shop images. Shop images appear for:
- PONTALON
- SANT MANCH (Chemise Sans Manche)
- JUPE
- MANTEAU DROIT
- ROBE ESABEL
- TOP ESABEL
- MANTEAU 3/4
- MANTEAU LONG
- VEST
- ROBE LONG

**CHEMISE** does not have a shop image by default.

---

## 🧪 Testing Checklist

- [ ] Open `admin.html` and login
- [ ] Click "🖼️ Image Management" tab
- [ ] Select a product (e.g., "VEST")
- [ ] Upload a new cover image
- [ ] See preview update
- [ ] Upload a new sketch image
- [ ] See preview update
- [ ] Click "💾 Save Image Changes"
- [ ] Open `index.html` and refresh (F5)
- [ ] Navigate to VEST
- [ ] Verify new cover image shows
- [ ] Flip to sketch page
- [ ] Verify new sketch image shows
- [ ] ✅ Success!

---

## 🔧 Troubleshooting

### **Images not uploading?**
- Check file size (< 500KB recommended)
- Verify file format (JPG, PNG, GIF, WebP)
- Try a different image
- Check browser console (F12) for errors

### **Changes not appearing in flipbook?**
- Did you click "Save Image Changes"?
- Did you refresh the flipbook (F5)?
- Check localStorage has data:
  - Console → `localStorage.getItem('topolina_products')`
  - Should show JSON with your images

### **Preview not showing?**
- Image might be too large
- Try compressing the image
- Check file format is supported

### **localStorage full?**
- Too many large images
- Clear some data or compress images
- Consider using smaller file sizes

---

## 🎯 Best Practices

### **1. Optimize Images Before Upload:**
- Resize to appropriate dimensions
- Compress to reduce file size
- Use JPG for photos, PNG for graphics

### **2. Consistent Aspect Ratios:**
- Keep cover images same aspect ratio
- Keep sketch images same aspect ratio
- Maintains visual consistency

### **3. Test After Upload:**
- Always check flipbook after saving
- Verify images load correctly
- Check on different devices/browsers

### **4. Backup Important Images:**
- Save original images separately
- localStorage can be cleared
- Keep backups of custom images

---

## 📸 Image Compression Tools

**Online Tools:**
- [TinyPNG](https://tinypng.com/) - PNG & JPG compression
- [Squoosh](https://squoosh.app/) - Advanced image optimization
- [CompressJPEG](https://compressjpeg.com/) - Batch compression

**Desktop Tools:**
- **ImageOptim** (Mac)
- **FileOptimizer** (Windows)
- **GIMP** (Cross-platform)

---

## ✨ Summary

### **What You Can Do Now:**
1. ✅ Change cover images for any product
2. ✅ Change sketch images for any product
3. ✅ Change shop images for products that have them
4. ✅ See previews before saving
5. ✅ Changes appear in flipbook after refresh

### **Complete Admin Features:**
- ✅ Order Management
- ✅ Product Management (names, patterns)
- ✅ Image Management (covers, sketches, shop)

---

## 🚀 Quick Reference

**Access:** `admin.html` → Login → "🖼️ Image Management"  
**Upload:** Select product → Click upload button → Choose image  
**Save:** Click "💾 Save Image Changes"  
**View:** Open `index.html` → Refresh (F5)  

**Supported:** JPG, PNG, GIF, WebP  
**Recommended:** < 500KB per image  

---

**Your complete product management system is ready! 🎉**
