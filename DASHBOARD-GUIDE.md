# 📊 Dashboard Setup Guide

## ภาพรวม

Dashboard นี้แสดงสถานะการเชื่อมต่อของทุกสาขาแบบ Real-time โดยดึงข้อมูลจาก Google Sheets

### ✨ Features

- 📈 **Summary Cards**: แสดงสรุปจำนวนสาขาแต่ละสถานะ
- 🔍 **Search & Filter**: ค้นหาและกรองสาขาตามสถานะ
- 📱 **Responsive Design**: ใช้งานได้ทั้ง Desktop และ Mobile
- 🎨 **Modern UI**: Dark theme พร้อม Glassmorphism effects
- 🔄 **Auto Refresh**: อัพเดทข้อมูลอัตโนมัติทุก 1 นาที
- 👁️ **Dual View**: สลับระหว่าง Grid และ Table view

---

## 🚀 การติดตั้ง

### ขั้นตอนที่ 1: เตรียม Apps Script API

1. เปิด Google Sheets ที่เก็บข้อมูล POS Monitor
2. ไปที่ **Extensions > Apps Script**
3. คลิก **+** ข้าง Files เพื่อสร้างไฟล์ใหม่
4. ตั้งชื่อว่า `DashboardAPI`
5. คัดลอกโค้ดจากไฟล์ `Code-Dashboard-API.gs` วางลงไป
6. กด **Save** (💾)

### ขั้นตอนที่ 2: Deploy API

1. กด **Deploy > New deployment**
2. คลิกไอคอนเฟือง ⚙️ เลือก **Web app**
3. ตั้งค่า:
   - **Description**: Dashboard API
   - **Execute as**: **Me**
   - **Who has access**: **Anyone** ⚠️
4. กด **Deploy**
5. **คัดลอก Web App URL** (ลงท้ายด้วย `/exec`)

### ขั้นตอนที่ 3: ทดสอบ API (Optional)

1. ในตัวแก้ไข Apps Script เลือกฟังก์ชัน `testDoGet`
2. กด **Run**
3. ตรวจสอบ Logs ว่ามีข้อมูลถูกต้อง

### ขั้นตอนที่ 4: ตั้งค่า Dashboard

1. เปิดไฟล์ `dashboard.js`
2. หาบรรทัดที่ 16 ในส่วน CONFIG:
   ```javascript
   APPS_SCRIPT_URL: 'YOUR_APPS_SCRIPT_WEB_APP_URL',
   ```
3. แก้เป็น URL ที่คัดลอกมา:
   ```javascript
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_ID/exec',
   ```

### ขั้นตอนที่ 5: ปิดโหมด Demo

1. ในไฟล์ `dashboard.js` หาฟังก์ชัน `fetchBranchData()` (บรรทัดที่ 80)
2. แก้จาก:
   ```javascript
   async function fetchBranchData() {
       try {
           return generateDemoData(); // ← ลบบรรทัดนี้
   ```
3. เป็น:
   ```javascript
   async function fetchBranchData() {
       try {
           // Method 2: Apps Script Web App
           const response = await fetch(CONFIG.APPS_SCRIPT_URL);
           const result = await response.json();
           return result.data;
   ```

### ขั้นตอนที่ 6: เปิดใช้งาน Dashboard

**วิธีที่ 1: เปิดไฟล์ HTML โดยตรง**
- Double-click ที่ไฟล์ `dashboard.html`
- เปิดด้วย Browser

**วิธีที่ 2: ใช้ Local Server (แนะนำ)**
```bash
# ถ้ามี Python
python -m http.server 8000

# ถ้ามี Node.js
npx serve

# ถ้ามี VS Code
# ติดตั้ง Extension "Live Server" แล้วคลิกขวาที่ไฟล์ > Open with Live Server
```

**วิธีที่ 3: Deploy บน Web Hosting**
- Upload ไฟล์ทั้ง 3 (HTML, CSS, JS) ไปยัง Web Server
- เข้าถึงผ่าน URL

---

## 🎨 การใช้งาน Dashboard

### Summary Cards (บนสุด)
- **Total Branches**: จำนวนสาขาทั้งหมด
- **Good Connection**: สาขาที่เน็ตดี (< 150ms)
- **Need Attention**: สาขาที่ควรติดตาม (150-300ms)
- **Critical Issues**: สาขาที่มีปัญหา (> 300ms)

### การค้นหา
- พิมพ์ชื่อสาขาในช่อง Search
- ผลลัพธ์จะกรองแบบ Real-time

### การกรอง
- **All**: แสดงทุกสาขา
- **Good**: แสดงเฉพาะสาขาที่เน็ตดี
- **Warning**: แสดงเฉพาะสาขาที่ควรติดตาม
- **Critical**: แสดงเฉพาะสาขาที่มีปัญหา

### การสลับมุมมอง
- **📱 Grid**: แสดงเป็น Card (เหมาะกับ Overview)
- **📋 Table**: แสดงเป็นตาราง (เหมาะกับการวิเคราะห์)

### การ Refresh
- กดปุ่ม **🔄 Refresh** เพื่ออัพเดทข้อมูลทันที
- ระบบจะ Auto-refresh ทุก 1 นาทีอัตโนมัติ

---

## 🎯 การอ่านสถานะ

### สีและความหมาย

| สี | สถานะ | Avg Latency | ความหมาย |
|---|--------|-------------|----------|
| 🟢 **เขียว** | Good | < 150ms | เน็ตดีมาก ใช้งาน POS ได้ลื่นไหล |
| 🟡 **เหลือง** | Warning | 150-300ms | เน็ตช้าเล็กน้อย ควรติดตาม |
| 🔴 **แดง** | Critical | > 300ms | เน็ตมีปัญหา ต้องแก้ไขด่วน |

### ข้อมูลในแต่ละ Card

```
┌─────────────────────────────┐
│ สาขาสีลม            [Good] │ ← ชื่อสาขา + สถานะ
│                             │
│ Avg Latency    Max Latency │
│    85 ms         120 ms    │ ← ค่า Ping เฉลี่ย และสูงสุด
│                             │
│ 📊 15 samples  🕐 14:30:25 │ ← จำนวนตัวอย่าง + เวลาล่าสุด
└─────────────────────────────┘
```

---

## ⚙️ การปรับแต่ง

### เปลี่ยนเกณฑ์การประเมิน

แก้ไขในไฟล์ `dashboard.js`:

```javascript
THRESHOLDS: {
    GOOD: 150,      // เปลี่ยนเป็น 100 ถ้าต้องการเข้มงวดขึ้น
    WARNING: 300,   // เปลี่ยนเป็น 200 ถ้าต้องการเข้มงวดขึ้น
    CRITICAL: 300
}
```

### เปลี่ยนความถี่ Auto-refresh

```javascript
REFRESH_INTERVAL: 60000, // 60000 = 1 นาที, 30000 = 30 วินาที
```

### เปลี่ยนสีธีม

แก้ไขในไฟล์ `dashboard.css` ส่วน `:root`:

```css
:root {
    --color-primary: #6366f1;  /* สีหลัก */
    --color-success: #10b981;  /* สีเขียว (Good) */
    --color-warning: #f59e0b;  /* สีเหลือง (Warning) */
    --color-danger: #ef4444;   /* สีแดง (Critical) */
}
```

---

## 🐛 Troubleshooting

### ไม่มีข้อมูลแสดง

1. **ตรวจสอบ Console**
   - กด F12 เปิด Developer Tools
   - ดูแท็บ Console มี Error หรือไม่

2. **ตรวจสอบ API URL**
   - ใน `dashboard.js` ตรวจสอบว่า `APPS_SCRIPT_URL` ถูกต้อง
   - ลองเปิด URL นั้นใน Browser ดูว่าได้ JSON หรือไม่

3. **ตรวจสอบ Apps Script Deployment**
   - ต้อง Deploy แบบ "Anyone can access"
   - ลอง Deploy ใหม่

### ข้อมูลไม่อัพเดท

1. **ตรวจสอบ Google Sheets**
   - มีข้อมูลใหม่เข้ามาหรือไม่
   - ข้อมูลอยู่ใน Sheet แรกหรือไม่

2. **กด Refresh ด้วยตนเอง**
   - ลองกดปุ่ม Refresh บน Dashboard

3. **Clear Cache**
   - กด Ctrl+Shift+R (Windows) หรือ Cmd+Shift+R (Mac)

### CORS Error

- ถ้าเปิดไฟล์ HTML โดยตรง (file://) อาจมีปัญหา CORS
- แก้ไข: ใช้ Local Server แทน (ดูขั้นตอนที่ 6)

---

## 📱 Mobile Responsive

Dashboard ปรับตัวอัตโนมัติสำหรับหน้าจอขนาดต่างๆ:

- **Desktop** (> 768px): แสดง 4 Summary Cards, Grid 3-4 คอลัมน์
- **Tablet** (768px): แสดง 2 Summary Cards, Grid 2 คอลัมน์
- **Mobile** (< 768px): แสดง 1 คอลัมน์ทั้งหมด

---

## 🔐 Security Notes

⚠️ **สำคัญ**: Dashboard นี้ดึงข้อมูลจาก Google Sheets ที่ Deploy แบบ "Anyone can access"

**ข้อควรระวัง:**
- ใครก็ตามที่มี URL สามารถเข้าถึงข้อมูลได้
- ไม่ควรเก็บข้อมูลที่เป็นความลับใน Sheets นี้
- ถ้าต้องการความปลอดภัยสูง ให้ใช้ Google Sheets API พร้อม API Key

**แนะนำ:**
- Host Dashboard บน Internal Network เท่านั้น
- ใช้ VPN ถ้าต้องการเข้าถึงจากภายนอก
- เปลี่ยน Apps Script URL เป็นระยะ

---

## 📊 ตัวอย่างการใช้งาน

### Scenario 1: ตรวจสอบรายวัน
1. เปิด Dashboard ตอนเช้า
2. ดู Summary Cards ว่ามีสาขา Critical กี่แห่ง
3. กดกรอง "Critical" เพื่อดูรายละเอียด
4. แจ้งทีม IT ให้ตรวจสอบสาขาที่มีปัญหา

### Scenario 2: วิเคราะห์แนวโน้ม
1. สลับเป็น Table View
2. เรียงตามค่า Avg Latency
3. บันทึกสาขาที่มีค่าสูงบ่อยๆ
4. วางแผนอัพเกรดอินเทอร์เน็ต

### Scenario 3: Troubleshooting
1. พนักงานสาขาโทรมาแจ้งว่าระบบช้า
2. ค้นหาชื่อสาขาใน Dashboard
3. ดูค่า Latency ว่าสูงผิดปกติหรือไม่
4. ตัดสินใจว่าเป็นปัญหาที่สาขาหรือ Server

---

## 🎓 Tips & Best Practices

1. **ตั้งเป็น Homepage**: ตั้ง Dashboard เป็นหน้าแรกของ Browser เพื่อเช็คทุกวัน
2. **ใช้ Dual Monitor**: เปิด Dashboard ไว้หน้าจอที่ 2 เพื่อ Monitor ตลอดเวลา
3. **Screenshot สาขาปัญหา**: เก็บหลักฐานก่อนแจ้งทีมซ่อม
4. **ตั้ง Alert**: ใช้ Apps Script ส่ง Email/Line แจ้งเตือนเมื่อมีสาขา Critical
5. **Export ข้อมูล**: ใช้ Google Sheets ทำกราฟวิเคราะห์แนวโน้มระยะยาว

---

## 📞 Support

หากมีปัญหาหรือต้องการความช่วยเหลือ:
- ตรวจสอบ Console Log (F12)
- อ่าน Troubleshooting ด้านบน
- ติดต่อทีม IT

---

**สร้างโดย**: POS Monitor System  
**เวอร์ชัน**: 1.0  
**อัพเดทล่าสุด**: 24 ธันวาคม 2568
