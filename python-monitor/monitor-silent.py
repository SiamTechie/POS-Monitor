"""
POS Monitor - Silent Background Service
Version: 2.0 (Silent Mode)
ไม่มี Console Window, ทำงาน Background อย่างเดียว
"""
import os
import sys
import time
import json
import subprocess
import platform
from datetime import datetime
from statistics import mean, stdev

# ========== SILENT LOGGING ==========
LOG_FILE = None

def init_logging():
    """Initialize log file in same directory as executable"""
    global LOG_FILE
    try:
        if getattr(sys, 'frozen', False):
            base_dir = os.path.dirname(sys.executable)
        else:
            base_dir = os.path.dirname(os.path.abspath(__file__))
        LOG_FILE = os.path.join(base_dir, 'monitor.log')
    except:
        LOG_FILE = 'monitor.log'

def log(message):
    """Write log to file (no console output)"""
    if not LOG_FILE:
        init_logging()
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            f.write(f"[{timestamp}] {message}\n")
    except:
        pass

# ========== READ CONFIG ==========
def get_base_dir():
    """Get directory where EXE is located"""
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def read_config():
    """Read configuration from config.txt"""
    config_file = os.path.join(get_base_dir(), 'config.txt')
    config = {}
    
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if '=' in line and not line.startswith('#'):
                        key, value = line.split('=', 1)
                        config[key.strip()] = value.strip()
        except:
            pass
    
    return config

# Read config
file_config = read_config()

# ========== CONFIGURATION ==========
CONFIG = {
    'BRANCH_NAME': file_config.get('BRANCH_NAME', 'สาขาไม่ระบุ'),
    
    'FIREBASE_CONFIG': {
        'databaseURL': file_config.get('FIREBASE_URL', 
            'https://pos-monitor-7bcaf-default-rtdb.asia-southeast1.firebasedatabase.app'),
    },
    
    'TARGETS': {
        'pos_server': {
            'host': 'res.drugnetcenter.com',
            'url': 'https://res.drugnetcenter.com/hug',
        },
        'google_dns': {
            'host': '8.8.8.8',
        },
    },
    
    'PING_INTERVAL': 60,
    'SYNC_INTERVAL': 60,
}

# ========== HTTP FUNCTIONS ==========
def http_request(url, method='GET', data=None, timeout=10):
    """Simple HTTP request without requests library"""
    try:
        import urllib.request
        import urllib.error
        
        start_time = time.time()
        
        if data:
            data = json.dumps(data).encode('utf-8')
            req = urllib.request.Request(url, data=data, method=method)
            req.add_header('Content-Type', 'application/json')
        else:
            req = urllib.request.Request(url, method=method)
        
        with urllib.request.urlopen(req, timeout=timeout) as response:
            response_time = round((time.time() - start_time) * 1000, 2)
            return {
                'success': True,
                'status_code': response.status,
                'response_time': response_time,
                'data': response.read().decode('utf-8')
            }
    except urllib.error.HTTPError as e:
        return {
            'success': False,
            'status_code': e.code,
            'response_time': 9999,
            'error': str(e)
        }
    except Exception as e:
        return {
            'success': False,
            'status_code': 0,
            'response_time': 9999,
            'error': str(e)
        }

def sync_to_firebase(data):
    """Sync data to Firebase using REST API"""
    try:
        import urllib.parse
        
        database_url = CONFIG['FIREBASE_CONFIG']['databaseURL']
        branch_name = CONFIG['BRANCH_NAME']
        
        # URL encode the branch name to handle spaces and Thai characters
        encoded_branch = urllib.parse.quote(branch_name, safe='')
        
        url = f"{database_url}/branches/{encoded_branch}/current.json"
        
        current_data = {
            'timestamp': data['timestamp'],
            'timestamp_thai': data['timestamp_thai'],
            # Average values
            'pos_ping': data['ping']['pos_server']['avg'],
            'google_ping': data['ping']['google_dns']['avg'],
            'http_response': data['http']['response_time'],
            # NEW: Max values to detect spikes
            'pos_max': data['ping']['pos_server'].get('max', 0),
            'google_max': data['ping']['google_dns'].get('max', 0),
            # NEW: Jitter values to detect instability
            'pos_jitter': data['ping']['pos_server'].get('jitter', 0),
            'google_jitter': data['ping']['google_dns'].get('jitter', 0),
            # Status and diagnosis
            'status': data['status'],
            'diagnosis': data['diagnosis']['message'],
            'recommendation': data['diagnosis']['recommendation'],
            'name': branch_name  # Store original name for display
        }
        
        # Use PUT method
        import urllib.request
        req_data = json.dumps(current_data).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, method='PUT')
        req.add_header('Content-Type', 'application/json')
        
        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status == 200:
                log(f"✅ Synced to Firebase: {branch_name}")
                return True
        
        return False
        
    except Exception as e:
        log(f"❌ Firebase sync error: {e}")
        return False

# ========== PING FUNCTION (SILENT) ==========
def ping_host(host, count=5):
    """Ping host silently (no CMD window)"""
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    
    try:
        command = ['ping', param, str(count), host]
        
        # CRITICAL: Hide console window completely
        startupinfo = None
        creationflags = 0
        
        if platform.system().lower() == 'windows':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = 0  # SW_HIDE
            creationflags = subprocess.CREATE_NO_WINDOW
        
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=30,
            startupinfo=startupinfo,
            creationflags=creationflags
        )
        output = result.stdout
        
        # Parse Windows ping output
        if platform.system().lower() == 'windows':
            latencies = []
            for line in output.split('\n'):
                if 'time=' in line or 'time<' in line:
                    try:
                        if 'time=' in line:
                            time_str = line.split('time=')[1].split('ms')[0]
                            latencies.append(float(time_str))
                        elif 'time<' in line:
                            latencies.append(1.0)
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
                }
        
        return {
            'success': False,
            'avg': 9999,
            'min': 9999,
            'max': 9999,
            'jitter': 0,
            'packet_loss': 100,
        }
        
    except Exception as e:
        log(f"Ping error {host}: {e}")
        return {
            'success': False,
            'avg': 9999,
            'min': 9999,
            'max': 9999,
            'jitter': 0,
            'packet_loss': 100,
        }

def http_health_check(url, timeout=10):
    """HTTP health check"""
    result = http_request(url, timeout=timeout)
    return {
        'success': result['success'],
        'response_time': result.get('response_time', 9999),
        'status_code': result.get('status_code', 0),
        'status_ok': result.get('status_code', 0) == 200
    }

def diagnose_issue(pos_ping, google_ping, http_check):
    """
    Diagnose network issues - IMPROVED VERSION
    Now checks: Average, Max, and Jitter to detect unstable connections
    """
    pos_avg = pos_ping.get('avg', 9999)
    pos_max = pos_ping.get('max', 9999)
    pos_jitter = pos_ping.get('jitter', 0)
    
    google_avg = google_ping.get('avg', 9999)
    google_max = google_ping.get('max', 9999)
    google_jitter = google_ping.get('jitter', 0)
    
    # ========== CHECK FOR UNSTABLE CONNECTION (HIGH JITTER OR SPIKE) ==========
    # This catches the case where average looks OK but there are huge spikes
    
    # Critical: Max ping > 1000ms = severe spike, definitely unstable
    if google_max > 1000 or pos_max > 1000:
        return {
            'severity': 'critical',
            'message': f'เน็ตไม่เสถียร (Spike ถึง {max(google_max, pos_max):.0f}ms)',
            'recommendation': 'ตรวจสอบ Router/ISP - มี Latency Spike'
        }
    
    # Warning: Max ping > 500ms = moderate spike
    if google_max > 500 or pos_max > 500:
        return {
            'severity': 'warning',
            'message': f'มี Latency Spike (Max: {max(google_max, pos_max):.0f}ms)',
            'recommendation': 'ติดตามสถานการณ์ เน็ตอาจไม่เสถียร'
        }
    
    # Warning: High jitter = unstable even if average is OK
    if google_jitter > 100 or pos_jitter > 100:
        return {
            'severity': 'warning',
            'message': f'เน็ตผันผวน (Jitter: {max(google_jitter, pos_jitter):.0f}ms)',
            'recommendation': 'ตรวจสอบสาย LAN และ Router'
        }
    
    # ========== CHECK AVERAGES (ORIGINAL LOGIC) ==========
    
    # Good: Everything looks stable and fast
    if pos_avg < 150 and google_avg < 150 and pos_max < 300 and google_max < 300:
        return {
            'severity': 'good',
            'message': 'ทุกอย่างปกติ',
            'recommendation': 'ไม่ต้องดำเนินการ'
        }
    
    # Critical: High average on internet
    if google_avg > 300:
        return {
            'severity': 'critical',
            'message': 'อินเทอร์เน็ตสาขามีปัญหา',
            'recommendation': 'ตรวจสอบ Router และติดต่อ ISP'
        }
    
    # Check POS server issues
    if pos_avg > 300 and google_avg < 150:
        if not http_check['status_ok']:
            return {
                'severity': 'critical',
                'message': 'POS Server ไม่ตอบสนอง',
                'recommendation': 'แจ้งทีม Server ตรวจสอบ'
            }
        return {
            'severity': 'warning',
            'message': 'POS Server ตอบสนองช้า',
            'recommendation': 'แจ้งทีม Server'
        }
    
    # Default: Some degradation
    return {
        'severity': 'warning',
        'message': 'ประสิทธิภาพลดลง',
        'recommendation': 'ติดตามสถานการณ์'
    }

def collect_data():
    """Collect monitoring data"""
    log(f"Collecting data for {CONFIG['BRANCH_NAME']}...")
    
    pos_ping = ping_host(CONFIG['TARGETS']['pos_server']['host'], 5)
    google_ping = ping_host(CONFIG['TARGETS']['google_dns']['host'], 5)
    http_check = http_health_check(CONFIG['TARGETS']['pos_server']['url'])
    diagnosis = diagnose_issue(pos_ping, google_ping, http_check)
    
    data = {
        'timestamp': datetime.now().isoformat(),
        'timestamp_thai': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
        'branch': CONFIG['BRANCH_NAME'],
        'ping': {
            'pos_server': pos_ping,
            'google_dns': google_ping,
        },
        'http': http_check,
        'diagnosis': diagnosis,
        'status': diagnosis['severity']
    }
    
    log(f"  POS: {pos_ping['avg']}ms, Google: {google_ping['avg']}ms, Status: {diagnosis['severity']}")
    
    return data

def save_cache(data):
    """Save data to local cache file"""
    try:
        cache_file = os.path.join(get_base_dir(), 'monitor_cache.json')
        with open(cache_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(data, ensure_ascii=False) + '\n')
    except Exception as e:
        log(f"Cache error: {e}")

# ========== MAIN ==========
def main():
    """Main loop - runs silently in background"""
    init_logging()
    
    log("=" * 50)
    log(f"🚀 POS Monitor Silent v2.0 Started")
    log(f"Branch: {CONFIG['BRANCH_NAME']}")
    log(f"Firebase: {CONFIG['FIREBASE_CONFIG']['databaseURL']}")
    log("=" * 50)
    
    # Validate config
    if CONFIG['BRANCH_NAME'] == 'สาขาไม่ระบุ':
        log("⚠️ WARNING: BRANCH_NAME not configured in config.txt!")
    
    while True:
        try:
            data = collect_data()
            save_cache(data)
            sync_to_firebase(data)
            
            log(f"Next check in {CONFIG['PING_INTERVAL']} seconds...")
            time.sleep(CONFIG['PING_INTERVAL'])
            
        except Exception as e:
            log(f"Error in main loop: {e}")
            time.sleep(60)

if __name__ == '__main__':
    main()
