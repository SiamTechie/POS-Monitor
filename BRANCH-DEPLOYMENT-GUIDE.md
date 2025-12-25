# 🏢 คู่มือการตั้งค่าสาขาจริง

## 📋 ภาพรวม

คู่มือนี้จะแนะนำวิธีติดตั้ง POS Monitor บนเครื่องสาขาจริง

---

## 🎯 วิธีที่ 1: ติดตั้งด้วยตนเอง (แนะนำสำหรับทดสอบ)

### ขั้นตอนที่ 1: เตรียมเครื่องสาขา

**ความต้องการ:**
- ✅ Windows 7 ขึ้นไป
- ✅ Python 3.8+ ([ดาวน์โหลด](https://www.python.org/downloads/))
- ✅ เชื่อมต่ออินเทอร์เน็ต

---

### ขั้นตอนที่ 2: ดาวน์โหลดไฟล์

**วิธีที่ 1: ดาวน์โหลดจาก GitHub**

1. ไปที่: https://github.com/SiamTechie/POS-Monitor
2. คลิก **Code** > **Download ZIP**
3. แตกไฟล์ไปยัง `C:\POS-Monitor`

**วิธีที่ 2: ใช้ Git Clone**

```bash
cd C:\
git clone https://github.com/SiamTechie/POS-Monitor.git
cd POS-Monitor\python-monitor
```

---

### ขั้นตอนที่ 3: แก้ไขชื่อสาขา

1. เปิดไฟล์ `C:\POS-Monitor\python-monitor\monitor-rest-api.py`
2. แก้บรรทัดที่ 13:

```python
'BRANCH_NAME': 'สาขาสีลม',  # ← เปลี่ยนเป็นชื่อสาขาจริง
```

**ตัวอย่าง:**
```python
'BRANCH_NAME': 'สาขาสีลม',
'BRANCH_NAME': 'สาขาสยาม',
'BRANCH_NAME': 'สาขาเซ็นทรัล',
```

3. **Save** ไฟล์

---

### ขั้นตอนที่ 4: ติดตั้ง Dependencies

เปิด Command Prompt (CMD) แล้วรัน:

```bash
cd C:\POS-Monitor\python-monitor
pip install requests
```

---

### ขั้นตอนที่ 5: ทดสอบรัน

```bash
python monitor-rest-api.py
```

**ควรเห็น:**
```
====================================
🚀 POS Monitor - Firebase REST API Version
====================================
Branch: สาขาสีลม
Firebase: https://pos-monitor-7bcaf...
====================================

📊 Collecting data for สาขาสีลม...
  POS Server:    85ms
  Google DNS:    45ms
  HTTP Check:    120ms
  Diagnosis:     ทุกอย่างปกติ

✅ Data synced to Firebase
```

---

### ขั้นตอนที่ 6: ตั้งค่า Auto-Start

**วิธีที่ 1: ใช้ Task Scheduler (แนะนำ)**

1. เปิด **Task Scheduler**
2. คลิก **Create Basic Task**
3. ตั้งค่าดังนี้:
   - **Name:** POS Monitor - สาขาสีลม
   - **Trigger:** When the computer starts
   - **Action:** Start a program
   - **Program:** `C:\Python3X\python.exe`
   - **Arguments:** `C:\POS-Monitor\python-monitor\monitor-rest-api.py`
   - **Start in:** `C:\POS-Monitor\python-monitor`

4. คลิก **Finish**

**วิธีที่ 2: ใช้ Startup Folder**

1. กด `Win + R`
2. พิมพ์: `shell:startup`
3. สร้างไฟล์ `start-monitor.bat`:

```batch
@echo off
cd C:\POS-Monitor\python-monitor
python monitor-rest-api.py
```

4. วางไฟล์ในโฟลเดอร์ Startup

---

### ขั้นตอนที่ 7: ตรวจสอบใน Dashboard

1. เปิด: https://siamtechie.github.io/POS-Monitor/dashboard-firebase.html
2. ควรเห็นสาขาใหม่ในรายการ
3. ตรวจสอบข้อมูล Ping และ Status

---

## 🚀 วิธีที่ 2: ติดตั้งแบบ Remote (สำหรับหลายสาขา)

### สำหรับ IT Admin

**ใช้ PowerShell Remote:**

```powershell
# เชื่อมต่อไปยังเครื่องสาขา
Enter-PSSession -ComputerName BRANCH-PC-01

# ดาวน์โหลดและติดตั้ง
Invoke-WebRequest -Uri "https://github.com/SiamTechie/POS-Monitor/archive/refs/heads/main.zip" -OutFile "C:\pos-monitor.zip"
Expand-Archive -Path "C:\pos-monitor.zip" -DestinationPath "C:\POS-Monitor"

# แก้ไขชื่อสาขา (ใช้ Script)
$branchName = "สาขาสีลม"
(Get-Content "C:\POS-Monitor\python-monitor\monitor-rest-api.py") -replace "'BRANCH_NAME': 'สาขาทดสอบ'", "'BRANCH_NAME': '$branchName'" | Set-Content "C:\POS-Monitor\python-monitor\monitor-rest-api.py"

# ติดตั้ง Dependencies
pip install requests

# สร้าง Task Scheduler
$action = New-ScheduledTaskAction -Execute "python.exe" -Argument "C:\POS-Monitor\python-monitor\monitor-rest-api.py"
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "POS Monitor" -Action $action -Trigger $trigger
```

---

## 📊 การตรวจสอบว่าติดตั้งสำเร็จ

### 1. ตรวจสอบบนเครื่องสาขา

**วิธีที่ 1: ดู Task Manager**
1. เปิด Task Manager (Ctrl+Shift+Esc)
2. แท็บ **Details**
3. ค้นหา `python.exe`
4. ควรเห็น `python.exe` รัน `monitor-rest-api.py`

**วิธีที่ 2: ดู Task Scheduler**
1. เปิด Task Scheduler
2. ค้นหา Task "POS Monitor"
3. ตรวจสอบ Status: **Running**

**วิธีที่ 3: ดู Log File**
1. เปิด `C:\POS-Monitor\python-monitor\monitor_cache.json`
2. ควรเห็นข้อมูลใหม่เพิ่มเข้ามาทุก 60 วินาที

---

### 2. ตรวจสอบใน Firebase

1. เปิด [Firebase Console](https://console.firebase.google.com/)
2. เลือกโปรเจกต์ **pos-monitor-7bcaf**
3. ไปที่ **Realtime Database**
4. ควรเห็น:

```json
{
  "branches": {
    "สาขาสีลม": {
      "current": {
        "timestamp": "2024-12-24T20:xx:xx",
        "pos_ping": 85,
        "google_ping": 45,
        "status": "good"
      }
    }
  }
}
```

---

### 3. ตรวจสอบใน Dashboard

1. เปิด: https://siamtechie.github.io/POS-Monitor/dashboard-firebase.html
2. ควรเห็น:
   - ✅ **Total Branches** เพิ่มขึ้น
   - ✅ สาขาใหม่ในรายการ
   - ✅ ข้อมูล Ping แสดงผล
   - ✅ Status แสดงถูกต้อง

---

## 🔧 การตั้งค่าหลายสาขาพร้อมกัน

### สร้าง Script สำหรับแต่ละสาขา

**ไฟล์: `deploy-branches.ps1`**

```powershell
# รายชื่อสาขา
$branches = @(
    @{Name="สาขาสีลม"; PC="BRANCH-PC-01"},
    @{Name="สาขาสยาม"; PC="BRANCH-PC-02"},
    @{Name="สาขาอโศก"; PC="BRANCH-PC-03"}
)

foreach ($branch in $branches) {
    Write-Host "Installing on $($branch.Name)..."
    
    # เชื่อมต่อและติดตั้ง
    Invoke-Command -ComputerName $branch.PC -ScriptBlock {
        param($branchName)
        
        # ดาวน์โหลด
        Invoke-WebRequest -Uri "https://github.com/SiamTechie/POS-Monitor/raw/main/python-monitor/monitor-rest-api.py" -OutFile "C:\monitor-rest-api.py"
        
        # แก้ไขชื่อสาขา
        (Get-Content "C:\monitor-rest-api.py") -replace "'BRANCH_NAME': 'สาขาทดสอบ'", "'BRANCH_NAME': '$branchName'" | Set-Content "C:\monitor-rest-api.py"
        
        # ติดตั้ง
        pip install requests
        
        # สร้าง Task
        $action = New-ScheduledTaskAction -Execute "python.exe" -Argument "C:\monitor-rest-api.py"
        $trigger = New-ScheduledTaskTrigger -AtStartup
        Register-ScheduledTask -TaskName "POS Monitor" -Action $action -Trigger $trigger -Force
        
    } -ArgumentList $branch.Name
    
    Write-Host "✅ Installed on $($branch.Name)"
}

Write-Host "🎉 All branches installed!"
```

**รัน:**
```powershell
.\deploy-branches.ps1
```

---

## 🐛 Troubleshooting

### ปัญหา: ไม่เห็นข้อมูลใน Dashboard

**สาเหตุ:**
1. Script ไม่ได้รัน
2. ชื่อสาขาผิด
3. Firebase Rules ไม่ถูกต้อง

**แก้ไข:**
1. ตรวจสอบ Task Manager ว่า python.exe รันอยู่
2. ตรวจสอบชื่อสาขาใน `monitor-rest-api.py`
3. ตรวจสอบ Firebase Rules อนุญาต write

---

### ปัญหา: Script หยุดทำงานเอง

**สาเหตุ:**
- เครื่องรีสตาร์ท แต่ Task ไม่รัน

**แก้ไข:**
1. เปิด Task Scheduler
2. คลิกขวาที่ Task > Properties
3. แท็บ **General**:
   - เลือก "Run whether user is logged on or not"
   - เลือก "Run with highest privileges"
4. แท็บ **Conditions**:
   - ยกเลิก "Start the task only if the computer is on AC power"

---

### ปัญหา: ข้อมูลไม่อัพเดท

**สาเหตุ:**
- ไม่มีอินเทอร์เน็ต
- Firebase ล่ม

**แก้ไข:**
1. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
2. ดู `monitor_cache.json` ว่ามีข้อมูลหรือไม่
3. ตรวจสอบ Firebase Console

---

## 📋 Checklist การติดตั้งสาขาใหม่

```
สาขา: _________________

□ ติดตั้ง Python แล้ว
□ ดาวน์โหลดไฟล์แล้ว
□ แก้ไขชื่อสาขาแล้ว
□ ติดตั้ง Dependencies แล้ว
□ ทดสอบรันสำเร็จ
□ ตั้งค่า Auto-start แล้ว
□ เห็นข้อมูลใน Firebase
□ เห็นข้อมูลใน Dashboard
□ รีสตาร์ทเครื่องทดสอบ
□ ตรวจสอบหลังรีสตาร์ทสำเร็จ

ผู้ติดตั้ง: _________________
วันที่: _________________
```

---

## 🎯 Best Practices

### 1. ตั้งชื่อสาขาให้ชัดเจน
```python
✅ ดี: 'สาขาสีลม', 'สาขาเซ็นทรัลพระราม9'
❌ ไม่ดี: 'สาขา1', 'test', 'branch'
```

### 2. ทดสอบก่อน Deploy
- ทดสอบบนเครื่องทดสอบก่อน
- ตรวจสอบข้อมูลใน Dashboard
- รีสตาร์ทเครื่องทดสอบ

### 3. เก็บ Log
- สำรองไฟล์ `monitor_cache.json` เป็นประจำ
- ตรวจสอบ Log ทุกสัปดาห์

### 4. Update เป็นประจำ
- ตรวจสอบ GitHub มี Version ใหม่หรือไม่
- อัพเดทสาขาทีละน้อย

---

## 🎉 สรุป

การตั้งค่าสาขาจริงมี 3 ขั้นตอนหลัก:

1. **ติดตั้ง Python + ดาวน์โหลดไฟล์**
2. **แก้ไขชื่อสาขา + ทดสอบ**
3. **ตั้งค่า Auto-start + ตรวจสอบ**

**เวลาที่ใช้:** ~15-20 นาที/สาขา

**URL สำคัญ:**
- Dashboard: https://siamtechie.github.io/POS-Monitor/dashboard-firebase.html
- GitHub: https://github.com/SiamTechie/POS-Monitor
- Firebase: https://console.firebase.google.com/

**Happy Monitoring!** 🚀
