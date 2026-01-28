# 🚀 QUICK START GUIDE - Product Management

## 📋 What You Need to Launch

### ✅ You Already Have:
- Domain ✓
- Hosting ✓
- Website files ✓

### 📦 Files to Upload:

```
Upload to your hosting root directory:

├── index.html
├── admin.html
├── style.css
├── admin.css
├── script.js
├── admin.js
├── products-data.js          ← NEW FILE!
├── translations.js
└── images/
    └── (all your product images)
```

---

## ⚙️ Configuration (IMPORTANT!)

### 1. Change Email Address
**File:** `script.js` (line 304)

**Change from:**
```javascript
window.location.href = `mailto:reda@example.com?subject=...
```

**Change to:**
```javascript
window.location.href = `mailto:YOUR-EMAIL@yourdomain.com?subject=...
```

### 2. Change Admin Password (Optional)
**File:** `admin.js` (line 2)

**Change from:**
```javascript
const ADMIN_PASSWORD = 'topolina2024';
```

**Change to:**
```javascript
const ADMIN_PASSWORD = 'your-secure-password';
```

---

## 🎨 How to Use Product Management

### Step 1: Login
1. Open `admin.html` in browser
2. Enter password: `topolina2024`
3. Click "Login"

### Step 2: Go to Product Management
1. Click **"🎨 Product Management"** tab
2. Select a product from dropdown

### Step 3: Edit Product
**Change Product Name:**
- Edit "Display Name" field

**Edit Patterns:**
- Change Pattern ID
- Change Pattern Name
- Click "Change Image" to upload new image
- Click "Delete" to remove pattern

**Add New Pattern:**
- Click "+ Add Pattern"
- Fill in ID and Name
- Upload image

### Step 4: Save
- Click **"💾 Save Changes"**
- Done! Changes appear in flipbook instantly

---

## 🔄 Sync with Flipbook

Changes you make in the admin panel **automatically sync** to the flipbook!

**To see changes:**
1. Save in admin panel
2. Open/refresh `index.html`
3. Navigate to the product you edited
4. Your changes are live! ✨

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login | Check password in `admin.js` line 2 |
| Changes not showing | Click "Save Changes" button |
| Image won't upload | File must be < 500KB, JPG/PNG/GIF/WebP |
| Lost all data | Click "Reset to Defaults" |

---

## 📞 Need More Help?

Read the full documentation:
- **`PRODUCT_MANAGEMENT_README.md`** - Complete user guide
- **`walkthrough.md`** - Technical implementation details

---

## ✅ Launch Checklist

- [ ] Update email in `script.js`
- [ ] Change admin password in `admin.js` (optional)
- [ ] Upload all files to hosting
- [ ] Point domain to hosting
- [ ] Test admin login
- [ ] Test product editing
- [ ] Test flipbook display
- [ ] Test order submission
- [ ] Go live! 🎉

---

**You're ready to launch! 🚀**
