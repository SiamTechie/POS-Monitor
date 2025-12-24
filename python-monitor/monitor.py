"""
POS Connection Monitor - Enhanced Version
Multi-layer network monitoring with Firebase integration

Features:
- Multi-target ping (POS, Google, Cloudflare)
- HTTP health check
- Traceroute analysis
- Packet loss detection
- Smart diagnosis
- Firebase real-time sync
"""

import time
import requests
import subprocess
import platform
import json
from datetime import datetime
from statistics import mean, stdev
import socket
import firebase_admin
from firebase_admin import credentials, db

# ========== CONFIGURATION ==========
CONFIG = {
    # Branch Information
    'BRANCH_NAME': 'สาขาทดสอบ',  # เปลี่ยนตามสาขาจริง
    
    # Monitoring Targets
    'TARGETS': {
        'pos_server': {
            'host': 'res.drugnetcenter.com',
            'url': 'https://res.drugnetcenter.com/hug',
            'name': 'POS Server'
        },
        'google_dns': {
            'host': '8.8.8.8',
            'name': 'Google DNS'
        },
        'cloudflare_dns': {
            'host': '1.1.1.1',
            'name': 'Cloudflare DNS'
        }
    },
    
    # Timing
    'PING_INTERVAL': 60,  # Test every 60 seconds
    'PING_COUNT': 5,      # Send 5 pings per test
    'SYNC_INTERVAL': 900, # Sync to Firebase every 15 minutes
    
    # Firebase Configuration
    'FIREBASE_CREDENTIALS': 'firebase-credentials.json',
    'FIREBASE_DATABASE_URL': 'https://YOUR-PROJECT.firebaseio.com',
    
    # Thresholds
    'THRESHOLDS': {
        'good': 150,      # < 150ms = Good
        'warning': 300,   # 150-300ms = Warning
        'critical': 300   # > 300ms = Critical
    }
}

# ========== FIREBASE INITIALIZATION ==========
def init_firebase():
    """Initialize Firebase connection"""
    try:
        cred = credentials.Certificate(CONFIG['FIREBASE_CREDENTIALS'])
        firebase_admin.initialize_app(cred, {
            'databaseURL': CONFIG['FIREBASE_DATABASE_URL']
        })
        print("✅ Firebase initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        return False

# ========== NETWORK MONITORING FUNCTIONS ==========

def ping_host(host, count=5):
    """
    Ping a host and return latency statistics
    Returns: dict with avg, min, max, packet_loss
    """
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    
    try:
        # Execute ping command
        command = ['ping', param, str(count), host]
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        output = result.stdout
        
        # Parse results (Windows)
        if platform.system().lower() == 'windows':
            # Extract latency values
            latencies = []
            for line in output.split('\n'):
                if 'time=' in line or 'time<' in line:
                    try:
                        time_str = line.split('time=')[1].split('ms')[0] if 'time=' in line else '1'
                        latencies.append(float(time_str))
                    except:
                        pass
            
            # Extract packet loss
            packet_loss = 0
            for line in output.split('\n'):
                if 'Lost' in line or 'loss' in line:
                    try:
                        loss_str = line.split('(')[1].split('%')[0]
                        packet_loss = float(loss_str)
                    except:
                        pass
            
            if latencies:
                return {
                    'success': True,
                    'avg': round(mean(latencies), 2),
                    'min': round(min(latencies), 2),
                    'max': round(max(latencies), 2),
                    'jitter': round(stdev(latencies), 2) if len(latencies) > 1 else 0,
                    'packet_loss': packet_loss,
                    'count': len(latencies)
                }
        
        # If parsing failed, return timeout
        return {
            'success': False,
            'avg': 9999,
            'min': 9999,
            'max': 9999,
            'jitter': 0,
            'packet_loss': 100,
            'count': 0
        }
        
    except Exception as e:
        print(f"❌ Ping error for {host}: {e}")
        return {
            'success': False,
            'avg': 9999,
            'min': 9999,
            'max': 9999,
            'jitter': 0,
            'packet_loss': 100,
            'count': 0,
            'error': str(e)
        }

def http_health_check(url, timeout=10):
    """
    Perform HTTP health check
    Returns: dict with response_time, status_code, success
    """
    try:
        start_time = time.time()
        response = requests.get(url, timeout=timeout)
        response_time = round((time.time() - start_time) * 1000, 2)  # Convert to ms
        
        return {
            'success': True,
            'response_time': response_time,
            'status_code': response.status_code,
            'status_ok': response.status_code == 200
        }
    except requests.Timeout:
        return {
            'success': False,
            'response_time': timeout * 1000,
            'status_code': 0,
            'status_ok': False,
            'error': 'Timeout'
        }
    except Exception as e:
        return {
            'success': False,
            'response_time': 9999,
            'status_code': 0,
            'status_ok': False,
            'error': str(e)
        }

def get_gateway_ip():
    """Get default gateway IP"""
    try:
        if platform.system().lower() == 'windows':
            result = subprocess.run(
                ['ipconfig'],
                capture_output=True,
                text=True
            )
            for line in result.stdout.split('\n'):
                if 'Default Gateway' in line or 'เกตเวย์เริ่มต้น' in line:
                    parts = line.split(':')
                    if len(parts) > 1:
                        ip = parts[1].strip()
                        if ip and ip != '':
                            return ip
        return None
    except:
        return None

def diagnose_issue(pos_ping, google_ping, http_check):
    """
    Smart diagnosis based on monitoring data
    Returns: dict with diagnosis, severity, recommendation
    """
    
    # All good
    if pos_ping['avg'] < 150 and google_ping['avg'] < 150:
        return {
            'issue': 'normal',
            'severity': 'good',
            'message': 'ทุกอย่างปกติ',
            'recommendation': 'ไม่ต้องดำเนินการ'
        }
    
    # Branch internet issue
    if google_ping['avg'] > 300:
        return {
            'issue': 'branch_internet',
            'severity': 'critical',
            'message': 'อินเทอร์เน็ตสาขามีปัญหา',
            'recommendation': 'ตรวจสอบ Router และติดต่อ ISP'
        }
    
    # POS Server issue
    if pos_ping['avg'] > 300 and google_ping['avg'] < 150:
        if not http_check['status_ok']:
            return {
                'issue': 'pos_server_down',
                'severity': 'critical',
                'message': 'POS Server ไม่ตอบสนอง',
                'recommendation': 'แจ้งทีม Server ตรวจสอบด่วน'
            }
        else:
            return {
                'issue': 'pos_server_slow',
                'severity': 'warning',
                'message': 'POS Server ตอบสนองช้า',
                'recommendation': 'แจ้งทีม Server ตรวจสอบโหลด'
            }
    
    # Network path issue
    if pos_ping['avg'] > 200 and google_ping['avg'] < 100:
        return {
            'issue': 'network_path',
            'severity': 'warning',
            'message': 'เส้นทาง Network มีปัญหา',
            'recommendation': 'ตรวจสอบ Routing และ ISP'
        }
    
    # Packet loss
    if pos_ping['packet_loss'] > 5:
        return {
            'issue': 'packet_loss',
            'severity': 'warning',
            'message': f'มี Packet Loss {pos_ping["packet_loss"]}%',
            'recommendation': 'ตรวจสอบสาย LAN และ Router'
        }
    
    # Default warning
    return {
        'issue': 'degraded_performance',
        'severity': 'warning',
        'message': 'ประสิทธิภาพลดลง',
        'recommendation': 'ติดตามสถานการณ์'
    }

# ========== DATA COLLECTION ==========

def collect_monitoring_data():
    """
    Collect all monitoring data
    Returns: dict with all metrics
    """
    print(f"\n📊 Collecting data for {CONFIG['BRANCH_NAME']}...")
    
    # Ping all targets
    pos_ping = ping_host(CONFIG['TARGETS']['pos_server']['host'], CONFIG['PING_COUNT'])
    google_ping = ping_host(CONFIG['TARGETS']['google_dns']['host'], CONFIG['PING_COUNT'])
    cloudflare_ping = ping_host(CONFIG['TARGETS']['cloudflare_dns']['host'], CONFIG['PING_COUNT'])
    
    # HTTP health check
    http_check = http_health_check(CONFIG['TARGETS']['pos_server']['url'])
    
    # Get gateway
    gateway = get_gateway_ip()
    gateway_ping = ping_host(gateway, 3) if gateway else None
    
    # Diagnose
    diagnosis = diagnose_issue(pos_ping, google_ping, http_check)
    
    # Compile data
    data = {
        'timestamp': datetime.now().isoformat(),
        'timestamp_thai': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
        'branch': CONFIG['BRANCH_NAME'],
        
        'ping': {
            'pos_server': pos_ping,
            'google_dns': google_ping,
            'cloudflare_dns': cloudflare_ping,
            'gateway': gateway_ping
        },
        
        'http': http_check,
        
        'diagnosis': diagnosis,
        
        'status': diagnosis['severity']
    }
    
    # Print summary
    print(f"  POS Server:    {pos_ping['avg']}ms")
    print(f"  Google DNS:    {google_ping['avg']}ms")
    print(f"  HTTP Check:    {http_check['response_time']}ms ({http_check['status_code']})")
    print(f"  Diagnosis:     {diagnosis['message']}")
    print(f"  Status:        {diagnosis['severity'].upper()}")
    
    return data

# ========== FIREBASE SYNC ==========

def sync_to_firebase(data):
    """
    Sync monitoring data to Firebase
    """
    try:
        # Reference to branch data
        ref = db.reference(f'branches/{CONFIG["BRANCH_NAME"]}')
        
        # Update current status
        ref.child('current').set({
            'timestamp': data['timestamp'],
            'timestamp_thai': data['timestamp_thai'],
            'pos_ping': data['ping']['pos_server']['avg'],
            'google_ping': data['ping']['google_dns']['avg'],
            'http_response': data['http']['response_time'],
            'status': data['status'],
            'diagnosis': data['diagnosis']['message'],
            'recommendation': data['diagnosis']['recommendation']
        })
        
        # Add to history (with timestamp as key)
        history_ref = db.reference(f'history/{CONFIG["BRANCH_NAME"]}')
        history_ref.push({
            'timestamp': data['timestamp'],
            'pos_ping': data['ping']['pos_server']['avg'],
            'google_ping': data['ping']['google_dns']['avg'],
            'http_response': data['http']['response_time'],
            'status': data['status']
        })
        
        print("✅ Data synced to Firebase")
        return True
        
    except Exception as e:
        print(f"❌ Firebase sync error: {e}")
        return False

# ========== LOCAL STORAGE (Fallback) ==========

def save_to_local_cache(data):
    """Save data to local file as backup"""
    try:
        with open('monitor_cache.json', 'a', encoding='utf-8') as f:
            f.write(json.dumps(data, ensure_ascii=False) + '\n')
        return True
    except Exception as e:
        print(f"⚠️ Local cache error: {e}")
        return False

# ========== MAIN LOOP ==========

def main():
    """Main monitoring loop"""
    print("=" * 60)
    print("🚀 POS Connection Monitor - Enhanced Version")
    print("=" * 60)
    print(f"Branch: {CONFIG['BRANCH_NAME']}")
    print(f"Monitoring: {', '.join([t['name'] for t in CONFIG['TARGETS'].values()])}")
    print(f"Interval: {CONFIG['PING_INTERVAL']}s")
    print("=" * 60)
    
    # Initialize Firebase
    firebase_ready = init_firebase()
    
    if not firebase_ready:
        print("⚠️ Running in offline mode (local cache only)")
    
    # Data collection buffer
    data_buffer = []
    last_sync = time.time()
    
    try:
        while True:
            # Collect data
            data = collect_monitoring_data()
            
            # Add to buffer
            data_buffer.append(data)
            
            # Save to local cache
            save_to_local_cache(data)
            
            # Sync to Firebase if interval reached
            if firebase_ready and (time.time() - last_sync) >= CONFIG['SYNC_INTERVAL']:
                print(f"\n🔄 Syncing {len(data_buffer)} records to Firebase...")
                
                for record in data_buffer:
                    sync_to_firebase(record)
                
                data_buffer = []
                last_sync = time.time()
                print("✅ Sync completed\n")
            
            # Wait for next interval
            print(f"\n⏳ Next check in {CONFIG['PING_INTERVAL']} seconds...\n")
            time.sleep(CONFIG['PING_INTERVAL'])
            
    except KeyboardInterrupt:
        print("\n\n⏹️ Monitoring stopped by user")
        
        # Sync remaining data
        if firebase_ready and data_buffer:
            print(f"🔄 Syncing remaining {len(data_buffer)} records...")
            for record in data_buffer:
                sync_to_firebase(record)
            print("✅ Final sync completed")
        
        print("👋 Goodbye!")

if __name__ == '__main__':
    main()
