/**
 * Google Apps Script - Dashboard Data API
 * Add this to your Google Apps Script to enable dashboard data fetching
 * 
 * Setup:
 * 1. In your Google Sheet, go to Extensions > Apps Script
 * 2. Create a new file or add this to existing Code.gs
 * 3. Deploy as Web App with "Anyone" access
 * 4. Use the deployment URL in dashboard.js CONFIG.APPS_SCRIPT_URL
 */

/**
 * Handle GET requests from dashboard
 * Returns latest data for each branch in JSON format
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    
    // Get all data (skip header row)
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
    
    // Group by branch and get latest entry
    var branchMap = {};
    
    data.forEach(function(row) {
      var timestamp = row[0];
      var branchName = row[1];
      var avgLatency = row[2];
      var maxLatency = row[3];
      var samples = row[4];
      
      // Skip empty rows
      if (!branchName) return;
      
      var branch = {
        name: branchName,
        avgLatency: Number(avgLatency),
        maxLatency: Number(maxLatency),
        samples: Number(samples),
        timestamp: formatTimestamp(timestamp),
        status: getStatus(Number(avgLatency))
      };
      
      // Keep only latest entry for each branch
      if (!branchMap[branchName] || 
          new Date(timestamp) > new Date(branchMap[branchName].rawTimestamp)) {
        branch.rawTimestamp = timestamp;
        branchMap[branchName] = branch;
      }
    });
    
    // Convert map to array
    var branches = [];
    for (var key in branchMap) {
      var branch = branchMap[key];
      delete branch.rawTimestamp; // Remove helper field
      branches.push(branch);
    }
    
    // Sort by status (critical first) then by name
    branches.sort(function(a, b) {
      var statusOrder = { critical: 0, warning: 1, good: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.name.localeCompare(b.name);
    });
    
    // Return JSON response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: branches,
        timestamp: new Date().toISOString(),
        count: branches.length
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Determine status based on average latency
 */
function getStatus(avgLatency) {
  if (avgLatency < 150) return 'good';
  if (avgLatency < 300) return 'warning';
  return 'critical';
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  // Format Date object to Thai locale
  var date = new Date(timestamp);
  return Utilities.formatDate(date, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss');
}

/**
 * Test function - run this to verify the API works
 */
function testDoGet() {
  var result = doGet({});
  var content = result.getContent();
  Logger.log(content);
  
  var json = JSON.parse(content);
  Logger.log('Success: ' + json.success);
  Logger.log('Branch count: ' + json.count);
  
  if (json.data && json.data.length > 0) {
    Logger.log('First branch: ' + JSON.stringify(json.data[0]));
  }
}
