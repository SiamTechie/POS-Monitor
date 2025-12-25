# POS Monitor Installer v2.0 (Silent)

## วิธีติดตั้ง

### ขั้นตอนที่ 1: แก้ไขชื่อสาขา
เปิดไฟล์ `config.txt` แก้บรรทัด:
```
BRANCH_NAME=สาขาของคุณ
```

### ขั้นตอนที่ 2: รัน Installer
ดับเบิลคลิก `install.bat` (ต้อง Run as Administrator)

### ขั้นตอนที่ 3: ตรวจสอบ
- เปิด Dashboard: https://pos-monitor-7bcaf.web.app
- ควรเห็นสาขาใหม่ในรายการ

---

## ไฟล์ในโฟลเดอร์นี้
- `POS-Monitor-Silent.exe` - โปรแกรมหลัก (รันเงียบๆ ไม่มี CMD)
- `config.txt` - ไฟล์ตั้งค่าชื่อสาขา
- `install.bat` - ตัวติดตั้งอัตโนมัติ

---

## หลังติดตั้ง
- โปรแกรมจะถูกติดตั้งที่ `C:\POS-Monitor\`
- จะเริ่มทำงานอัตโนมัติเมื่อเปิดเครื่อง
- ดู Log ได้ที่ `C:\POS-Monitor\monitor.log`
