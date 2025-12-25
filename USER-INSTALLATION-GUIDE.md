# 📖 คู่มือการติดตั้ง POS Monitor สำหรับพนักงาน

## 🎯 ภาพรวม

คู่มือนี้จะแนะนำวิธีติดตั้ง POS Monitor บนเครื่องคอมพิวเตอร์สาขา
**ใช้เวลาเพียง 5 นาที!**

---

## 📋 สิ่งที่ต้องเตรียม

- ✅ เครื่องคอมพิวเตอร์สาขา (Windows 7 ขึ้นไป)
- ✅ โฟลเดอร์ `POS-Monitor-Installer` (ได้รับจาก IT)
- ✅ ทราบชื่อสาขาของคุณ (เช่น "สาขาสีลม")

---

## 🚀 ขั้นตอนการติดตั้ง

### ขั้นที่ 1: เปิดโฟลเดอร์ที่ได้รับ

คุณจะเห็นไฟล์ 3 ไฟล์:

```
📁 POS-Monitor-Installer
   ├── 📄 POS-Monitor.exe
   ├── 📄 install-exe.bat          ← คลิกไฟล์นี้
   └── 📄 config-template.txt
```

---

### ขั้นที่ 2: คลิกขวาที่ install-exe.bat

1. **คลิกขวา** ที่ไฟล์ `install-exe.bat`
2. เลือก **"Run as administrator"** (รันในฐานะผู้ดูแลระบบ)

```
┌─────────────────────────────┐
│  Open                       │
│  Edit                       │
│  Print                      │
│  ► Run as administrator  ← เลือกนี่!
│  Properties                 │
└─────────────────────────────┘
```

---

### ขั้นที่ 3: ใส่ชื่อสาขา

หน้าต่างจะแสดง:

```
========================================
  POS Monitor - Installation
========================================

This installer will set up POS Monitor
to run automatically on this computer.

Examples of branch names:
  - สาขาสีลม
  - สาขาสยาม
  - สาขาเซ็นทรัลพระราม9
  - สาขาเมกาบางนา

Enter your branch name: _
```

**พิมพ์ชื่อสาขาของคุณ** แล้วกด **Enter**

**ตัวอย่าง:**
```
Enter your branch name: สาขาสีลม
```

---

### ขั้นที่ 4: ยืนยันชื่อสาขา

```
You entered: สาขาสีลม
Is this correct? (Y/N): _
```

- ถ้าถูกต้อง พิมพ์ **Y** แล้วกด Enter
- ถ้าผิด พิมพ์ **N** แล้วกด Enter (จะให้ใส่ใหม่)

---

### ขั้นที่ 5: รอให้ติดตั้งเสร็จ

ระบบจะติดตั้งอัตโนมัติ:

```
Installing for: สาขาสีลม

[1/4] Creating directory...
   Created: C:\POS-Monitor

[2/4] Copying files...
   Copied: POS-Monitor.exe

[3/4] Creating configuration...
   Created: config.txt
   Branch: สาขาสีลม

[4/4] Setting up auto-start...
   Auto-start configured successfully
```

---

### ขั้นที่ 6: เสร็จสิ้น!

```
========================================
  Installation Complete!
========================================

Branch Name: สาขาสีลม
Install Location: C:\POS-Monitor

What happens next:
 1. The monitor will start now
 2. It will run automatically when Windows starts
 3. Check the dashboard to verify data is being sent

Dashboard URL:
https://siamtechie.github.io/POS-Monitor/dashboard-firebase.html

Press any key to start the monitor...
```

กด **Enter** หรือ **ปุ่มใดก็ได้**

---

## ✅ การตรวจสอบว่าติดตั้งสำเร็จ

### วิธีที่ 1: เปิด Dashboard

1. เปิด Browser (Chrome, Edge, Firefox)
2. ไปที่: https://siamtechie.github.io/POS-Monitor/dashboard-firebase.html
3. ค้นหาชื่อสาขาของคุณ
4. ควรเห็นข้อมูล Ping แสดงผล

**ตัวอย่าง:**
```
┌─────────────────────────────────┐
│ สาขาสีลม              ✓ Good   │
├─────────────────────────────────┤
│ POS Server:     85ms            │
│ Internet:       45ms            │
│ HTTP Response:  120ms           │
│                                 │
│ 📋 Diagnosis: ทุกอย่างปกติ      │
│ 💡 ไม่ต้องดำเนินการ             │
└─────────────────────────────────┘
```

---

### วิธีที่ 2: ตรวจสอบโฟลเดอร์

1. เปิด **File Explorer**
2. ไปที่ `C:\POS-Monitor`
3. ควรเห็นไฟล์:
   - `POS-Monitor.exe`
   - `config.txt`

---

### วิธีที่ 3: ตรวจสอบ Task Manager

1. กด `Ctrl + Shift + Esc`
2. แท็บ **Details**
3. ค้นหา `POS-Monitor.exe`
4. ถ้าเห็น = ทำงานอยู่ ✅

---

## ❓ คำถามที่พบบ่อย

### Q1: ต้องเปิดโปรแกรมอะไรหรือไม่?

**A:** ไม่ต้อง! ระบบจะทำงานเบื้องหลังอัตโนมัติ

---

### Q2: ต้องเปิดหน้าเว็บค้างไว้หรือไม่?

**A:** ไม่ต้อง! ไม่ต้องเปิดอะไรเลย

---

### Q3: ถ้ารีสตาร์ทเครื่องล่ะ?

**A:** ระบบจะเริ่มทำงานอัตโนมัติทุกครั้งที่เปิดเครื่อง

---

### Q4: ถ้าใส่ชื่อสาขาผิดจะทำอย่างไร?

**A:** รัน `install-exe.bat` ใหม่อีกครั้ง ใส่ชื่อที่ถูกต้อง

---

### Q5: ต้องทำอะไรเพิ่มหรือไม่?

**A:** ไม่ต้อง! ติดตั้งครั้งเดียวจบ

---

## 🐛 แก้ปัญหา

### ปัญหา: "You need administrator privileges"

**วิธีแก้:**
1. คลิกขวาที่ `install-exe.bat`
2. เลือก **"Run as administrator"**
3. รันใหม่

---

### ปัญหา: "Windows protected your PC"

**วิธีแก้:**
1. คลิก **"More info"**
2. คลิก **"Run anyway"**

---

### ปัญหา: ไม่เห็นชื่อสาขาใน Dashboard

**วิธีแก้:**
1. รอ 1-2 นาที
2. Refresh หน้า Dashboard (กด F5)
3. ถ้ายังไม่เห็น ติดต่อ IT

---

## 📞 ติดต่อ IT Support

ถ้ามีปัญหาหรือข้อสงสัย:

- **โทร:** 02-XXX-XXXX
- **Email:** it-support@company.com
- **Line:** @itsupport

---

## ✨ สรุป

การติดตั้ง POS Monitor มี **6 ขั้นตอนง่ายๆ:**

1. ✅ เปิดโฟลเดอร์ที่ได้รับ
2. ✅ คลิกขวา > Run as administrator
3. ✅ ใส่ชื่อสาขา
4. ✅ ยืนยันชื่อ (Y)
5. ✅ รอให้ติดตั้งเสร็จ
6. ✅ กด Enter เพื่อเริ่มใช้งาน

**ใช้เวลาเพียง 5 นาที!**

**หลังติดตั้งแล้ว:**
- ✅ ไม่ต้องทำอะไรเพิ่ม
- ✅ ระบบทำงานอัตโนมัติ
- ✅ ตรวจสอบได้ที่ Dashboard

---

**ขอบคุณที่ใช้ POS Monitor!** 🎉
