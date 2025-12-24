# 🌐 GitHub Pages Setup Guide

## ขั้นตอนการเปิดใช้งาน GitHub Pages

### 1. ไปที่ Repository Settings

1. เปิด https://github.com/SiamTechie/POS-Monitor
2. คลิกแท็บ **Settings** (⚙️) ด้านบน
3. ในเมนูซ้ายมือ เลื่อนลงหา **Pages**
4. คลิก **Pages**

---

### 2. ตั้งค่า Source

ในหน้า GitHub Pages:

1. **Source**: เลือก `Deploy from a branch`
2. **Branch**: 
   - เลือก `main`
   - เลือก `/ (root)`
3. คลิกปุ่ม **Save**

---

### 3. รอ Deployment

- GitHub จะใช้เวลาประมาณ 1-2 นาทีในการ Deploy
- รีเฟรชหน้าเว็บ (F5)
- เมื่อเสร็จจะเห็นข้อความ:
  ```
  Your site is live at https://siamtechie.github.io/POS-Monitor/
  ```

---

### 4. เข้าถึง Dashboard

เมื่อ Deploy สำเร็จ คุณสามารถเข้าถึงได้ที่:

#### 🏠 **Landing Page**
```
https://siamtechie.github.io/POS-Monitor/
```

#### 🌐 **WordPress Dashboard**
```
https://siamtechie.github.io/POS-Monitor/dashboard.html
```

#### 🚀 **Firebase Dashboard**
```
https://siamtechie.github.io/POS-Monitor/dashboard-firebase.html
```

---

## 📝 หมายเหตุสำคัญ

### ⚠️ Dashboard จะทำงานได้เมื่อ:

#### WordPress Dashboard
- ✅ ตั้งค่า Google Apps Script แล้ว
- ✅ แก้ไข `dashboard.js` ใส่ `APPS_SCRIPT_URL`
- ✅ มีข้อมูลใน Google Sheets

#### Firebase Dashboard
- ✅ ตั้งค่า Firebase Project แล้ว
- ✅ แก้ไข `dashboard-firebase.js` ใส่ Firebase Config
- ✅ มี Python Monitor รันอยู่ที่สาขา

---

## 🔧 การแก้ไข Config สำหรับ GitHub Pages

### แก้ไข dashboard.js

ถ้ายังไม่ได้แก้ไข ให้เปิดไฟล์ `dashboard.js` และแก้บรรทัดที่ 16:

```javascript
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
```

### แก้ไข dashboard-firebase.js

เปิดไฟล์ `dashboard-firebase.js` และแก้บรรทัดที่ 7-14:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Push การเปลี่ยนแปลง

```bash
git add .
git commit -m "Update config for production"
git push origin main
```

GitHub Pages จะอัพเดทอัตโนมัติภายใน 1-2 นาที

---

## 🎯 การทดสอบ

### 1. ทดสอบ Landing Page

เปิด: https://siamtechie.github.io/POS-Monitor/

ควรเห็น:
- ✅ หน้าสวยงามพร้อมการ์ด 2 ระบบ
- ✅ ปุ่มเปิด Dashboard ทั้ง 2 แบบ
- ✅ ลิงก์ไปยังเอกสาร

### 2. ทดสอบ WordPress Dashboard

เปิด: https://siamtechie.github.io/POS-Monitor/dashboard.html

ถ้ายังไม่ได้ตั้งค่า:
- ⚠️ จะแสดง "No Data Available"
- ⚠️ ต้องตั้งค่า Google Apps Script ก่อน

ถ้าตั้งค่าแล้ว:
- ✅ จะแสดงข้อมูลสาขา
- ✅ สามารถค้นหาและกรองได้

### 3. ทดสอบ Firebase Dashboard

เปิด: https://siamtechie.github.io/POS-Monitor/dashboard-firebase.html

ถ้ายังไม่ได้ตั้งค่า:
- ⚠️ จะแสดง "Loading..." หรือ Error
- ⚠️ ต้องตั้งค่า Firebase ก่อน

ถ้าตั้งค่าแล้ว:
- ✅ จะแสดง "Connected"
- ✅ แสดงข้อมูล Real-time

---

## 🐛 Troubleshooting

### ปัญหา: หน้าเว็บไม่แสดง

**สาเหตุ:**
- GitHub Pages ยังไม่เสร็จ

**แก้ไข:**
1. รอ 1-2 นาที
2. รีเฟรชหน้า Settings > Pages
3. ตรวจสอบว่ามีข้อความ "Your site is live"

---

### ปัญหา: Dashboard แสดง "No Data"

**สาเหตุ:**
- ยังไม่ได้ตั้งค่า Backend (Google Sheets หรือ Firebase)

**แก้ไข:**
- WordPress: ตั้งค่า Google Apps Script ตาม `setup-checklist.md`
- Firebase: ตั้งค่า Firebase ตาม `ENHANCED-SETUP-GUIDE.md`

---

### ปัญหา: แก้ไขโค้ดแล้วไม่เปลี่ยน

**สาเหตุ:**
- Browser Cache

**แก้ไข:**
1. กด Ctrl+Shift+R (Windows) หรือ Cmd+Shift+R (Mac)
2. หรือเปิด Incognito Mode

---

## 📱 การแชร์ลิงก์

### ส่งให้ทีม

```
🏠 Landing Page (เลือกระบบ):
https://siamtechie.github.io/POS-Monitor/

🌐 WordPress Dashboard:
https://siamtechie.github.io/POS-Monitor/dashboard.html

🚀 Firebase Dashboard (แนะนำ):
https://siamtechie.github.io/POS-Monitor/dashboard-firebase.html
```

### Bookmark

แนะนำให้ Bookmark URL เหล่านี้:
- ✅ Landing Page - สำหรับเลือกระบบ
- ✅ Dashboard ที่ใช้งาน - สำหรับเปิดประจำ

---

## 🎉 เสร็จสิ้น!

ตอนนี้คุณมี:
- ✅ GitHub Pages ที่เข้าถึงได้จากทุกที่
- ✅ Landing Page สวยงาม
- ✅ Dashboard ทั้ง 2 แบบ
- ✅ เอกสารครบถ้วนบน GitHub

**URL หลัก:**
```
https://siamtechie.github.io/POS-Monitor/
```

**Happy Monitoring!** 🚀
