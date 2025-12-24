/**
 * POS Connection Monitoring System - Client Script
 * This script runs in the WordPress footer to monitor connection quality
 * 
 * Installation:
 * Add this to your WordPress theme's footer.php before </body> tag
 * wrapped in <script> tags
 */

(function() {
    'use strict';
    
    // ========== CONFIGURATION ==========
    // ดึงชื่อ User จาก WordPress อัตโนมัติ
    // Note: This PHP code will be executed server-side
    const BRANCH_NAME = "<?php $current_user = wp_get_current_user(); echo (!empty($current_user->user_login) ? $current_user->user_login : 'Guest'); ?>";
    
    // Target POS Server
    const TARGET_HOST = "https://res.drugnetcenter.com/hug";
    
    // Google Apps Script Web App URL (Replace with your deployment URL)
    const SYNC_URL = "PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE";
    
    // Timing Configuration
    const PING_INTERVAL = 60000;   // Test every 1 minute (60,000 ms)
    const SYNC_INTERVAL = 900000;  // Send data every 15 minutes (900,000 ms)
    
    // LocalStorage key for storing ping data
    const STORAGE_KEY = 'pos_diag_data';
    
    // ========== CORE FUNCTIONS ==========
    
    /**
     * Measure latency to POS server
     * Uses fetch with no-cors mode to avoid CORS issues
     */
    async function measureLatency() {
        const start = performance.now();
        
        try {
            // Attempt to fetch from target host
            // no-cors mode prevents CORS errors but limits response access
            await fetch(TARGET_HOST, { 
                mode: 'no-cors', 
                cache: 'no-cache',
                method: 'GET'
            });
            
            // Calculate latency in milliseconds
            const latency = Math.round(performance.now() - start);
            
            // Retrieve existing data from localStorage
            let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            
            // Add new measurement
            data.push({ 
                t: new Date().toISOString(),  // timestamp
                l: latency                     // latency
            });
            
            // Save back to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            
            // Log for debugging (can be removed in production)
            console.log(`[POS Monitor] Ping: ${latency}ms | Total samples: ${data.length}`);
            
        } catch (error) {
            console.error("[POS Monitor] Ping Error:", error);
        }
    }
    
    /**
     * Send accumulated data to Google Sheets
     * Calculates statistics and clears local storage after successful send
     */
    async function sendToGoogleSheets() {
        // Retrieve stored ping data
        let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        // Skip if no data collected
        if (data.length === 0) {
            console.log("[POS Monitor] No data to send");
            return;
        }
        
        // Calculate statistics
        const latencies = data.map(d => d.l);
        const avgPing = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
        const maxPing = Math.max(...latencies);
        
        // Prepare payload
        const payload = {
            timestamp: new Date().toLocaleString('th-TH', {
                timeZone: 'Asia/Bangkok',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            branch: BRANCH_NAME,
            avg: avgPing,
            max: maxPing,
            count: data.length
        };
        
        console.log("[POS Monitor] Sending data:", payload);
        
        try {
            // Send to Google Apps Script
            await fetch(SYNC_URL, { 
                method: 'POST', 
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            // Clear local storage after successful send
            localStorage.removeItem(STORAGE_KEY);
            console.log("[POS Monitor] Data sent successfully and cleared");
            
        } catch (error) {
            console.error("[POS Monitor] Send Error:", error);
            // Keep data in localStorage for retry on next interval
        }
    }
    
    /**
     * Initialize monitoring system
     */
    function initialize() {
        console.log(`[POS Monitor] Initialized for branch: ${BRANCH_NAME}`);
        console.log(`[POS Monitor] Target: ${TARGET_HOST}`);
        console.log(`[POS Monitor] Ping interval: ${PING_INTERVAL/1000}s | Sync interval: ${SYNC_INTERVAL/1000}s`);
        
        // Check if SYNC_URL is configured
        if (SYNC_URL === "PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE") {
            console.warn("[POS Monitor] WARNING: SYNC_URL not configured! Please update the script.");
        }
        
        // Start ping measurements
        setInterval(measureLatency, PING_INTERVAL);
        
        // Start sync to Google Sheets
        setInterval(sendToGoogleSheets, SYNC_INTERVAL);
        
        // Run first measurement immediately
        measureLatency();
    }
    
    // ========== AUTO-START ==========
    // Wait for page to fully load before starting
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();
