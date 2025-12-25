# 📊 POS Connection Monitoring System

ระบบติดตามคุณภาพการเชื่อมต่ออินเทอร์เน็ตของสาขาทั่วประเทศ โดยวัดผลจากการเชื่อมต่อไปยัง POS Server (res.drugnetcenter.com)

---

## 🎯 ระบบที่มีให้เลือก 2 แบบ

### 1. **WordPress + Google Sheets** (Basic)
- ✅ ติดตั้งง่าย
- ⚠️ ต้องเปิดหน้าเว็บค้างไว้
- 📊 วัดแค่ Latency

### 2. **Python + Firebase** (Enhanced) ⭐ แนะนำ
- ✅ ไม่ต้องเปิดหน้าเว็บ
- ✅ วินิจฉัยปัญหาได้แม่นยำ
- ✅ Multi-layer monitoring
- ✅ Real-time updates

---

## 📁 โครงสร้างโปรเจกต์

```
monitor-net/
│
├── 📖 README.md                      # ไฟล์นี้
├── 📖 SYSTEM-COMPARISON.md           # เปรียบเทียบระบบ
│
├── 🌐 WordPress + Google Sheets System
│   ├── Code.gs                       # Apps Script รับข้อมูล
│   ├── Code-Dashboard-API.gs         # Apps Script ส่งข้อมูล
│   ├── wordpress-footer.js           # Client Script
│   ├── dashboard.html                # Dashboard
│   ├── dashboard.css                 # Styling
│   ├── dashboard.js                  # Dashboard Logic
│   ├── DASHBOARD-GUIDE.md            # คู่มือ Dashboard
│   ├── setup-checklist.md            # Checklist
│   │
│   └── 🗄️ Auto Archive System
│       ├── Code-Complete.gs          # Apps Script แบบสมบูรณ์
│       ├── ARCHIVE-SETUP-GUIDE.md    # คู่มือติดตั้ง
│       └── ARCHIVE-SUMMARY.md        # สรุประบบ
│
└── 🚀 Python + Firebase System (Enhanced)
    ├── python-monitor/
    │   ├── monitor.py                # Python Monitor Script
    │   ├── requirements.txt          # Dependencies
    │   ├── start-monitor.bat         # Auto-start script
    │   └── config.json.example       # ตัวอย่างการตั้งค่า
    │
    ├── dashboard-firebase.html       # Dashboard (Firebase)
    ├── dashboard-firebase.js         # Dashboard Logic
    ├── dashboard-firebase.css        # Styling
    │
    └── ENHANCED-SETUP-GUIDE.md       # คู่มือติดตั้งแบบละเอียด
```

---

## 🚀 Quick Start

### สำหรับระบบ WordPress + Google Sheets

1. อ่าน `README.md` (ไฟล์นี้)
2. ติดตามขั้นตอนใน `setup-checklist.md`
3. ดู Dashboard ที่ `DASHBOARD-GUIDE.md`

### สำหรับระบบ Python + Firebase (แนะนำ)

1. อ่าน `ENHANCED-SETUP-GUIDE.md`
2. ตั้งค่า Firebase Project
3. ติดตั้ง Python Monitor บนเครื่องสาขา
4. Deploy Dashboard

---

## 📊 คุณสมบัติเด่น

### WordPress System
- ✅ Ping POS Server ทุก 1 นาที
- ✅ ส่งข้อมูลทุก 15 นาที
- ✅ Auto Archive (เก็บข้อมูล 30 วันใน Current, ย้ายเก่าไป Archive)
- ✅ Dashboard แสดงสถานะ Real-time
- ✅ Email รายงานทุกวัน

### Python+Firebase System (Enhanced)
- ✅ **Multi-target Ping**:
  - POS Server
  - Google DNS (8.8.8.8)
  - Cloudflare (1.1.1.1)
  - Gateway
- ✅ **HTTP Health Check**
- ✅ **Smart Diagnosis** - วิเคราะห์ว่าปัญหาอยู่ที่ไหน
- ✅ **Real-time Firebase** - อัพเดททันที
- ✅ **ไม่ต้องเปิดหน้าเว็บ** - รันเบื้องหลัง
- ✅ **Packet Loss Detection**
- ✅ **Jitter Measurement**

---

## 🎯 การเลือกใช้ระบบ

### ใช้ WordPress ถ้า:
- สาขาเปิดเว็บค้างไว้อยู่แล้ว
- ต้องการติดตั้งง่ายๆ
- ไม่ต้องการวินิจฉัยปัญหาลึก

### ใช้ Python+Firebase ถ้า:
- สาขาไม่เปิดเว็บค้างไว้ ← **แก้ปัญหานี้**
- ต้องการวินิจฉัยปัญหาแม่นยำ
- ต้องการระบบเสถียร 24/7
- ต้องการ Real-time monitoring

**อ่านเพิ่มเติม:** `SYSTEM-COMPARISON.md`

---

## 📖 เอกสารทั้งหมด

| ไฟล์ | คำอธิบาย | ระบบ |
|------|----------|------|
| `README.md` | ภาพรวมโปรเจกต์ | ทั้งหมด |
| `SYSTEM-COMPARISON.md` | เปรียบเทียบระบบ | ทั้งหมด |
| `setup-checklist.md` | Checklist การติดตั้ง | WordPress |
| `DASHBOARD-GUIDE.md` | คู่มือ Dashboard | WordPress |
| `ARCHIVE-SETUP-GUIDE.md` | คู่มือ Auto Archive | WordPress |
| `ARCHIVE-SUMMARY.md` | สรุประบบ Archive | WordPress |
| `ENHANCED-SETUP-GUIDE.md` | คู่มือติดตั้งแบบละเอียด | Python+Firebase |

---

## 🛠️ การติดตั้ง

### WordPress + Google Sheets

#### 1. Google Sheets & Apps Script
```
1. สร้าง Google Sheets
2. เพิ่มหัวตาราง (Timestamp, Branch Name, Avg Latency, Max Latency, Samples)
3. Extensions > Apps Script
4. วางโค้ดจาก Code-Complete.gs
5. Deploy as Web App (Anyone can access)
6. คัดลอก URL
```

#### 2. WordPress
```
1. เปิดไฟล์ wordpress-footer.js
2. แก้ไข SYNC_URL ใส่ URL จากขั้นที่ 1
3. วางโค้ดใน footer.php (ก่อน </body>)
```

#### 3. Dashboard
```
1. แก้ไข dashboard.js ใส่ APPS_SCRIPT_URL
2. เปิด dashboard.html ใน Browser
```

**อ่านเพิ่มเติม:** `setup-checklist.md`

---

### Python + Firebase

#### 1. Firebase Setup
```
1. สร้าง Firebase Project
2. สร้าง Realtime Database
3. ดาวน์โหลด Service Account Key
4. คัดลอก Firebase Config
```

#### 2. Python Monitor (บนเครื่องสาขา)
```
1. ติดตั้ง Python 3.8+
2. คัดลอกไฟล์ไปยัง C:\POS-Monitor
3. แก้ไข monitor.py (Branch Name, Firebase URL)
4. รัน start-monitor.bat
5. สร้าง Windows Task (Auto-start)
```

#### 3. Dashboard
```
1. แก้ไข dashboard-firebase.js (Firebase Config)
2. Deploy ไปยัง Firebase Hosting หรือ GitHub Pages
```

**อ่านเพิ่มเติม:** `ENHANCED-SETUP-GUIDE.md`

---

## 📊 ตัวอย่างข้อมูล

### WordPress System
```
Timestamp: 24/12/2024 18:00:00
Branch: สาขาสีลม
Avg Latency: 85ms
Max Latency: 120ms
Samples: 15
```

### Python+Firebase System
```
Branch: สาขาสีลม
├─ POS Server:     85ms ✅
├─ Google DNS:     45ms ✅
├─ Cloudflare:     48ms ✅
├─ HTTP Response:  120ms ✅
├─ Packet Loss:    0%
├─ Jitter:         5ms
│
├─ Diagnosis: ทุกอย่างปกติ
└─ Recommendation: ไม่ต้องดำเนินการ
```

---

## 🎯 Performance Benchmarks

| Avg Latency | สถานะ | คำอธิบาย |
|-------------|-------|----------|
| < 100 ms | 🟢 Good | เน็ตดีมาก POS ลื่นไหล |
| 100-150 ms | 🟡 Fair | ใช้งานได้ แต่อาจรู้สึกช้าเล็กน้อย |
| 150-300 ms | 🟠 Warning | พนักงานจะรู้สึกว่าระบบตอบสนองช้า |
| 300-500 ms | 🔴 Poor | ช้ามาก ส่งผลต่อการทำงาน |
| > 500 ms | 🔴 Critical | เน็ตมีปัญหาหนัก หรือ Server โหลดเกิน |

---

## 🔍 การวินิจฉัยปัญหา (Python+Firebase)

### Scenario 1: อินเทอร์เน็ตสาขาช้า
```
POS Ping:     520ms ❌
Google Ping:  500ms ❌
→ Diagnosis: อินเทอร์เน็ตสาขามีปัญหา
→ Action: ตรวจสอบ Router และติดต่อ ISP
```

### Scenario 2: Server POS ช้า
```
POS Ping:     450ms ❌
Google Ping:  50ms ✅
→ Diagnosis: POS Server ตอบสนองช้า
→ Action: แจ้งทีม Server ตรวจสอบโหลด
```

### Scenario 3: Network ระหว่างทาง
```
POS Ping:     350ms ⚠️
Google Ping:  50ms ✅
→ Diagnosis: เส้นทาง Network มีปัญหา
→ Action: ตรวจสอบ Routing และ ISP
```

---

## 🐛 Troubleshooting

### WordPress System
- ไม่มีข้อมูล → ตรวจสอบ SYNC_URL
- Dashboard ช้า → ใช้ Auto Archive
- ข้อมูลซ้ำ → ตรวจสอบ Script ไม่รันซ้ำ

### Python+Firebase System
- Script ไม่รัน → ตรวจสอบ Python ติดตั้งแล้ว
- Dashboard ไม่แสดง → ตรวจสอบ Firebase Config
- ข้อมูลไม่อัพเดท → ตรวจสอบ Script รันอยู่

---

## 📞 Support

- **WordPress System**: อ่าน `DASHBOARD-GUIDE.md`
- **Python+Firebase System**: อ่าน `ENHANCED-SETUP-GUIDE.md`
- **เปรียบเทียบ**: อ่าน `SYSTEM-COMPARISON.md`

---

## 📄 License

Free to use for internal company purposes.

---

## 🎉 สรุป

โปรเจกต์นี้มี **2 ระบบ** ให้เลือกใช้:

1. **WordPress + Google Sheets** - ง่าย แต่ต้องเปิดเว็บ
2. **Python + Firebase** - ซับซ้อนกว่า แต่แก้ปัญหาได้หมด ⭐

**เริ่มต้นด้วย WordPress** ถ้าต้องการง่าย  
**อัพเกรดเป็น Python+Firebase** เมื่อพบปัญหาสาขาไม่เปิดเว็บ

**Happy Monitoring!** 🚀
