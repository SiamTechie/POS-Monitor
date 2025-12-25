import os
import time
import requests
import subprocess
import platform
from datetime import datetime
from statistics import mean, stdev
import json

# ========== LOGGING ==========
def log_message(message):
    """Write log message to file instead of console"""
    try:
        log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'monitor.log')
        with open(log_file, 'a', encoding='utf-8') as f:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            f.write(f"[{timestamp}] {message}\n")
    except:
        pass  # Silently fail if can't write log

# ========== READ CONFIG FROM FILE (for EXE version) ==========
def read_config():
    """Read configuration from config.txt file"""
    config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.txt')
    config = {}
    
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
    
    return config

# Read config from file (if exists)
file_config = read_config()

# ========== CONFIGURATION ==========
CONFIG = {
    'BRANCH_NAME': file_config.get('BRANCH_NAME', 'สาขาทดสอบ'),
    
    # Firebase Web Config (ไม่ต้องใช้ Service Account!)
    'FIREBASE_CONFIG': {
        'apiKey': 'AIzaSyARQrby2xDPI0NU7PVF-13ZZzF9N-DYTwo',
        'authDomain': 'pos-monitor-7bcaf.firebaseapp.com',
        'databaseURL': file_config.get('FIREBASE_URL', 'https://pos-monitor-7bcaf-default-rtdb.asia-southeast1.firebasedatabase.app'),
        'projectId': 'pos-monitor-7bcaf',
        'storageBucket': 'pos-monitor-7bcaf.firebasestorage.app',
        'messagingSenderId': '558212427792',
        'appId': '1:558212427792:web:3b123886c9d1e052af5a95'
    },
    
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
    
    'PING_INTERVAL': 60,
    'SYNC_INTERVAL': 60,  # Sync every 60 seconds (same as ping)
    
    'THRESHOLDS': {
        'good': 150,
        'warning': 300,
        'critical': 300
    }
}

# ========== FIREBASE REST API ==========

def sync_to_firebase_rest(data):
    """
    Sync data to Firebase using REST API (no Service Account needed)
    """
    try:
        database_url = CONFIG['FIREBASE_CONFIG']['databaseURL']
        branch_name = CONFIG['BRANCH_NAME']
        
        # Update current status
        current_url = f"{database_url}/branches/{branch_name}/current.json"
        current_data = {
            'timestamp': data['timestamp'],
            'timestamp_thai': data['timestamp_thai'],
            'pos_ping': data['ping']['pos_server']['avg'],
            'google_ping': data['ping']['google_dns']['avg'],
            'http_response': data['http']['response_time'],
            'status': data['status'],
            'diagnosis': data['diagnosis']['message'],
            'recommendation': data['diagnosis']['recommendation']
        }
        
        response = requests.put(current_url, json=current_data)
        
        if response.status_code == 200:
            print("✅ Data synced to Firebase")
            return True
        else:
            print(f"❌ Firebase sync failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Firebase sync error: {e}")
        return False

# ========== MONITORING FUNCTIONS (เหมือนเดิม) ==========

def ping_host(host, count=5):
    """Ping a host and return latency statistics"""
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    
    try:
        command = ['ping', param, str(count), host]
        
        # Hide console window on Windows
        startupinfo = None
        if platform.system().lower() == 'windows':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = subprocess.SW_HIDE
        
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            timeout=30,
            startupinfo=startupinfo
        )
        output = result.stdout
        
        if platform.system().lower() == 'windows':
            latencies = []
            for line in output.split('\n'):
                if 'time=' in line or 'time<' in line:
                    try:
                        time_str = line.split('time=')[1].split('ms')[0] if 'time=' in line else '1'
                        latencies.append(float(time_str))
                    except:
                        pass
            
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
    """Perform HTTP health check"""
    try:
        start_time = time.time()
        response = requests.get(url, timeout=timeout)
        response_time = round((time.time() - start_time) * 1000, 2)
        
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

def diagnose_issue(pos_ping, google_ping, http_check):
    """Smart diagnosis"""
    if pos_ping['avg'] < 150 and google_ping['avg'] < 150:
        return {
            'issue': 'normal',
            'severity': 'good',
            'message': 'ทุกอย่างปกติ',
            'recommendation': 'ไม่ต้องดำเนินการ'
        }
    
    if google_ping['avg'] > 300:
        return {
            'issue': 'branch_internet',
            'severity': 'critical',
            'message': 'อินเทอร์เน็ตสาขามีปัญหา',
            'recommendation': 'ตรวจสอบ Router และติดต่อ ISP'
        }
    
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
    
    if pos_ping['avg'] > 200 and google_ping['avg'] < 100:
        return {
            'issue': 'network_path',
            'severity': 'warning',
            'message': 'เส้นทาง Network มีปัญหา',
            'recommendation': 'ตรวจสอบ Routing และ ISP'
        }
    
    if pos_ping['packet_loss'] > 5:
        return {
            'issue': 'packet_loss',
            'severity': 'warning',
            'message': f'มี Packet Loss {pos_ping["packet_loss"]}%',
            'recommendation': 'ตรวจสอบสาย LAN และ Router'
        }
    
    return {
        'issue': 'degraded_performance',
        'severity': 'warning',
        'message': 'ประสิทธิภาพลดลง',
        'recommendation': 'ติดตามสถานการณ์'
    }

def collect_monitoring_data():
    """Collect all monitoring data"""
    print(f"\n📊 Collecting data for {CONFIG['BRANCH_NAME']}...")
    
    pos_ping = ping_host(CONFIG['TARGETS']['pos_server']['host'], 5)
    google_ping = ping_host(CONFIG['TARGETS']['google_dns']['host'], 5)
    cloudflare_ping = ping_host(CONFIG['TARGETS']['cloudflare_dns']['host'], 5)
    http_check = http_health_check(CONFIG['TARGETS']['pos_server']['url'])
    diagnosis = diagnose_issue(pos_ping, google_ping, http_check)
    
    data = {
        'timestamp': datetime.now().isoformat(),
        'timestamp_thai': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
        'branch': CONFIG['BRANCH_NAME'],
        'ping': {
            'pos_server': pos_ping,
            'google_dns': google_ping,
            'cloudflare_dns': cloudflare_ping
        },
        'http': http_check,
        'diagnosis': diagnosis,
        'status': diagnosis['severity']
    }
    
    print(f"  POS Server:    {pos_ping['avg']}ms")
    print(f"  Google DNS:    {google_ping['avg']}ms")
    print(f"  HTTP Check:    {http_check['response_time']}ms")
    print(f"  Diagnosis:     {diagnosis['message']}")
    
    return data

def save_to_local_cache(data):
    """Save data to local file as backup"""
    try:
        with open('monitor_cache.json', 'a', encoding='utf-8') as f:
            f.write(json.dumps(data, ensure_ascii=False) + '\n')
        return True
    except Exception as e:
        print(f"⚠️ Local cache error: {e}")
        return False

def main():
    """Main monitoring loop"""
    print("=" * 60)
    print("🚀 POS Monitor - Firebase REST API Version")
    print("=" * 60)
    print(f"Branch: {CONFIG['BRANCH_NAME']}")
    print(f"Firebase: {CONFIG['FIREBASE_CONFIG']['databaseURL']}")
    print("=" * 60)
    
    data_buffer = []
    last_sync = time.time()
    
    try:
        while True:
            data = collect_monitoring_data()
            data_buffer.append(data)
            save_to_local_cache(data)
            
            if (time.time() - last_sync) >= CONFIG['SYNC_INTERVAL']:
                print(f"\n🔄 Syncing {len(data_buffer)} records to Firebase...")
                
                for record in data_buffer:
                    sync_to_firebase_rest(record)
                
                data_buffer = []
                last_sync = time.time()
                print("✅ Sync completed\n")
            
            print(f"\n⏳ Next check in {CONFIG['PING_INTERVAL']} seconds...\n")
            time.sleep(CONFIG['PING_INTERVAL'])
            
    except KeyboardInterrupt:
        print("\n\n⏹️ Monitoring stopped")
        
        if data_buffer:
            print(f"🔄 Syncing remaining {len(data_buffer)} records...")
            for record in data_buffer:
                sync_to_firebase_rest(record)
            print("✅ Final sync completed")
        
        print("👋 Goodbye!")

if __name__ == '__main__':
    main()
