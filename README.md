# 📊 POS Connection Monitoring System

ระบบติดตามคุณภาพอินเทอร์เน็ตของสาขาทั่วประเทศ โดยวัดผลจากการเชื่อมต่อไปยัง Server POS (res.drugnetcenter.com)

## 🏗️ Architecture (โครงสร้างระบบ)

```
┌─────────────────────┐
│  WordPress Client   │ ← รัน JavaScript ทดสอบ Ping ทุก 1 นาที
│   (สาขาต่างๆ)       │
└──────────┬──────────┘
           │ ส่งข้อมูลทุก 15 นาที
           ▼
┌─────────────────────┐
│ Google Apps Script  │ ← รับข้อมูลและบันทึก
│   (Web App API)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Google Sheets      │ ← เก็บสถิติและรายงาน
│   (Database)        │
└─────────────────────┘
```

## 🛠️ การติดตั้งระบบ

### ส่วนที่ 1: เตรียม Google Sheets และ Apps Script

#### 1.1 สร้าง Google Sheets

1. ไปที่ [Google Sheets](https://sheets.google.com)
2. สร้างไฟล์ใหม่
3. ตั้งชื่อเช่น "POS Connection Monitor"
4. พิมพ์หัวตารางในแถวที่ 1:

| A1 | B1 | C1 | D1 | E1 |
|---|---|---|---|---|
| Timestamp | Branch Name | Avg Latency (ms) | Max Latency (ms) | Samples |

#### 1.2 ติดตั้ง Apps Script

1. ในไฟล์ Sheets ไปที่เมนู **Extensions > Apps Script**
2. ลบโค้ดเดิมทั้งหมด
3. คัดลอกโค้ดจากไฟล์ `Code.gs` ในโปรเจกต์นี้
4. วางลงในตัวแก้ไข Apps Script
5. กด **Save** (💾)

#### 1.3 Deploy Web App

1. กดปุ่ม **Deploy > New deployment**
2. คลิกไอคอนเฟือง ⚙️ ข้าง "Select type"
3. เลือก **Web app**
4. ตั้งค่าดังนี้:
   - **Description**: POS Monitor API
   - **Execute as**: Me
   - **Who has access**: **Anyone** (สำคัญมาก!)
5. กด **Deploy**
6. **คัดลอก Web App URL** ที่ได้ (จะมีหน้าตาประมาณนี้):
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

#### 1.4 ทดสอบ Apps Script (Optional)

1. ในตัวแก้ไข Apps Script เลือกฟังก์ชัน `testDoPost`
2. กด **Run**
3. อนุญาตสิทธิ์ตามที่ขอ
4. ตรวจสอบใน Google Sheets ว่ามีข้อมูลทดสอบเข้ามาหรือไม่

---

### ส่วนที่ 2: ติดตั้งสคริปต์ใน WordPress

#### 2.1 เตรียมโค้ด JavaScript

1. เปิดไฟล์ `wordpress-footer.js`
2. แก้ไขบรรทัดที่ 18:
   ```javascript
   const SYNC_URL = "PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE";
   ```
   เป็น:
   ```javascript
   const SYNC_URL = "https://script.google.com/macros/s/YOUR_ACTUAL_URL/exec";
   ```
   (ใส่ URL ที่คัดลอกจากขั้นตอน 1.3)

#### 2.2 เพิ่มโค้ดใน WordPress Theme

**วิธีที่ 1: แก้ไข footer.php (แนะนำ)**

1. ไปที่ WordPress Admin Dashboard
2. เลือก **Appearance > Theme File Editor**
3. เลือกไฟล์ `footer.php`
4. หาแท็ก `</body>` (มักอยู่ท้ายไฟล์)
5. วางโค้ดนี้ **ก่อน** `</body>`:

```html
<script>
// วางโค้ดทั้งหมดจาก wordpress-footer.js ที่นี่
</script>
```

6. กด **Update File**

**วิธีที่ 2: ใช้ Plugin (ปลอดภัยกว่า)**

1. ติดตั้ง Plugin เช่น "Insert Headers and Footers" หรือ "Code Snippets"
2. วางโค้ดใน Footer Section
3. บันทึก

---

## 📈 การอ่านค่าและวิเคราะห์ผล

### เกณฑ์การประเมิน (Benchmark)

#### Avg Latency (ค่าเฉลี่ย Ping)

| ค่า | สถานะ | คำอธิบาย |
|-----|--------|----------|
| **< 100 ms** | 🟢 **Good** | เน็ตปกติ POS ลื่นไหล |
| **100-150 ms** | 🟡 **Fair** | ใช้งานได้ แต่อาจรู้สึกช้าเล็กน้อย |
| **150-300 ms** | 🟠 **Lag** | พนักงานจะรู้สึกว่าระบบตอบสนองช้า |
| **300-500 ms** | 🔴 **Poor** | ช้ามาก ส่งผลต่อการทำงาน |
| **> 500 ms** | 🔴 **Critical** | เน็ตมีปัญหาหนัก หรือ Server โหลดเกิน |

#### Max Latency (ค่า Ping สูงสุด)

- **< 500 ms**: ปกติ
- **500-1000 ms**: มี Spike บางครั้ง ควรติดตาม
- **> 1000 ms**: เน็ตกระตุกบ่อย แม้ค่าเฉลี่ยดูดี

### ตัวอย่างการวิเคราะห์

**กรณีที่ 1: สาขาปกติ**
```
Avg: 85ms | Max: 150ms | Samples: 15
→ เน็ตดีมาก ไม่มีปัญหา
```

**กรณีที่ 2: สาขามีปัญหา**
```
Avg: 450ms | Max: 1200ms | Samples: 15
→ เน็ตช้าและไม่เสถียร ควรตรวจสอบ Router/ISP
```

**กรณีที่ 3: Server มีปัญหา**
```
ทุกสาขามี Avg > 300ms พร้อมกัน
→ น่าจะเป็นปัญหาที่ Server POS
```

---

## 🔧 การปรับแต่ง

### เปลี่ยนความถี่ในการทดสอบ

แก้ไขในไฟล์ `wordpress-footer.js`:

```javascript
const PING_INTERVAL = 60000;   // 1 นาที (ค่าเริ่มต้น)
const SYNC_INTERVAL = 900000;  // 15 นาที (ค่าเริ่มต้น)
```

**ตัวอย่าง:**
- ทดสอบทุก 30 วินาที: `PING_INTERVAL = 30000`
- ส่งข้อมูลทุก 10 นาที: `SYNC_INTERVAL = 600000`

### เปลี่ยน Target Server

```javascript
const TARGET_HOST = "https://res.drugnetcenter.com/hug";
```

---

## 🐛 Troubleshooting

### ไม่มีข้อมูลเข้า Google Sheets

1. **ตรวจสอบ SYNC_URL**
   - ต้องเป็น URL ที่ลงท้ายด้วย `/exec`
   - ต้อง Deploy แบบ "Anyone can access"

2. **ตรวจสอบ Console Log**
   - เปิด Browser Developer Tools (F12)
   - ดู Console มี Error หรือไม่
   - ควรเห็นข้อความ `[POS Monitor] Initialized...`

3. **ตรวจสอบ LocalStorage**
   - ใน Developer Tools > Application > Local Storage
   - ดูว่ามี key `pos_diag_data` หรือไม่

### ข้อมูลซ้ำหรือผิดพลาด

- ตรวจสอบว่าโค้ดไม่ได้ถูกรันซ้ำหลายครั้ง
- ลอง Clear LocalStorage: `localStorage.removeItem('pos_diag_data')`

### CORS Error

- ใช้ `mode: 'no-cors'` อยู่แล้ว ไม่ควรมีปัญหา
- ถ้ายังมี ให้ตรวจสอบว่า TARGET_HOST ถูกต้อง

---

## 📁 ไฟล์ในโปรเจกต์

```
monitor-net/
├── Code.gs                  # Google Apps Script (วางใน Apps Script Editor)
├── wordpress-footer.js      # Client Script (วางใน WordPress footer.php)
├── README.md               # เอกสารนี้
└── setup-guide.md          # คู่มือติดตั้งแบบละเอียด (ถ้ามี)
```

---

## 📝 License

Free to use for internal company purposes.

---

## 👨‍💻 Support

หากมีปัญหาหรือข้อสงสัย ติดต่อทีม IT
