/**
 * ========================================
 * POS Connection Monitoring System
 * Complete Apps Script with Auto Archive
 * ========================================
 * 
 * Features:
 * 1. doPost() - Receive data from WordPress clients
 * 2. doGet() - Send current data to Dashboard (30 days)
 * 3. autoArchive() - Move old data to Archive sheet
 * 4. Time-based trigger for daily archiving
 * 
 * Sheet Structure:
 * - Sheet1 (Current): Last 30 days of data
 * - Archive: All historical data
 */

// ========== CONFIGURATION ==========
const CONFIG = {
  CURRENT_SHEET_NAME: 'Current',
  ARCHIVE_SHEET_NAME: 'Archive',
  ARCHIVE_AFTER_DAYS: 30,  // Move data older than 30 days
  HEADER_ROW: ['Timestamp', 'Branch Name', 'Avg Latency (ms)', 'Max Latency (ms)', 'Samples']
};

// ========== INITIALIZATION ==========

/**
 * Initialize sheets on first run
 * Run this manually once after pasting the code
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Rename first sheet to "Current" if needed
  var firstSheet = ss.getSheets()[0];
  if (firstSheet.getName() !== CONFIG.CURRENT_SHEET_NAME) {
    firstSheet.setName(CONFIG.CURRENT_SHEET_NAME);
  }
  
  // Create Archive sheet if it doesn't exist
  var archiveSheet = ss.getSheetByName(CONFIG.ARCHIVE_SHEET_NAME);
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet(CONFIG.ARCHIVE_SHEET_NAME);
    // Add header row
    archiveSheet.getRange(1, 1, 1, CONFIG.HEADER_ROW.length).setValues([CONFIG.HEADER_ROW]);
    archiveSheet.getRange(1, 1, 1, CONFIG.HEADER_ROW.length).setFontWeight('bold');
    Logger.log('✅ Archive sheet created');
  }
  
  // Ensure Current sheet has header
  var currentSheet = ss.getSheetByName(CONFIG.CURRENT_SHEET_NAME);
  if (currentSheet.getLastRow() === 0) {
    currentSheet.getRange(1, 1, 1, CONFIG.HEADER_ROW.length).setValues([CONFIG.HEADER_ROW]);
    currentSheet.getRange(1, 1, 1, CONFIG.HEADER_ROW.length).setFontWeight('bold');
  }
  
  Logger.log('✅ Sheets setup complete!');
  Logger.log('📊 Current sheet: ' + CONFIG.CURRENT_SHEET_NAME);
  Logger.log('🗄️ Archive sheet: ' + CONFIG.ARCHIVE_SHEET_NAME);
}

// ========== DATA RECEIVING (WordPress → Sheets) ==========

/**
 * Handle POST requests from WordPress clients
 * Receives ping data and stores in Current sheet
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.CURRENT_SHEET_NAME);
    
    // Create Current sheet if it doesn't exist
    if (!sheet) {
      setupSheets();
      sheet = ss.getSheetByName(CONFIG.CURRENT_SHEET_NAME);
    }
    
    // Parse incoming JSON data
    var data = JSON.parse(e.postData.contents);
    
    // Append new row with data
    sheet.appendRow([
      data.timestamp,
      data.branch,
      data.avg,
      data.max,
      data.count
    ]);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data recorded successfully",
      sheet: CONFIG.CURRENT_SHEET_NAME
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== DATA SENDING (Sheets → Dashboard) ==========

/**
 * Handle GET requests from Dashboard
 * Returns latest data for each branch (from Current sheet only)
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.CURRENT_SHEET_NAME);
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: [],
        message: "No data available",
        timestamp: new Date().toISOString(),
        count: 0
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data (skip header row)
    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
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
        count: branches.length,
        dataRange: 'Last 30 days'
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

// ========== AUTO ARCHIVE FUNCTION ==========

/**
 * Archive old data automatically
 * Moves data older than 30 days from Current to Archive sheet
 * Run this daily via Time Trigger
 */
function autoArchive() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var currentSheet = ss.getSheetByName(CONFIG.CURRENT_SHEET_NAME);
    var archiveSheet = ss.getSheetByName(CONFIG.ARCHIVE_SHEET_NAME);
    
    // Create Archive sheet if it doesn't exist
    if (!archiveSheet) {
      setupSheets();
      archiveSheet = ss.getSheetByName(CONFIG.ARCHIVE_SHEET_NAME);
    }
    
    if (!currentSheet || currentSheet.getLastRow() <= 1) {
      Logger.log('⚠️ No data to archive');
      return;
    }
    
    // Calculate cutoff date (30 days ago)
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CONFIG.ARCHIVE_AFTER_DAYS);
    
    Logger.log('📅 Archiving data older than: ' + cutoffDate.toLocaleString('th-TH'));
    
    // Get all data from Current sheet
    var lastRow = currentSheet.getLastRow();
    var data = currentSheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
    var rowsToArchive = [];
    var rowsToKeep = [];
    var archivedCount = 0;
    
    // Separate old and recent data
    data.forEach(function(row) {
      var timestamp = row[0];
      var rowDate = new Date(timestamp);
      
      if (rowDate < cutoffDate) {
        rowsToArchive.push(row);
      } else {
        rowsToKeep.push(row);
      }
    });
    
    // Move old data to Archive sheet
    if (rowsToArchive.length > 0) {
      var archiveLastRow = archiveSheet.getLastRow();
      archiveSheet.getRange(archiveLastRow + 1, 1, rowsToArchive.length, 5)
        .setValues(rowsToArchive);
      archivedCount = rowsToArchive.length;
      
      Logger.log('✅ Archived ' + archivedCount + ' rows to Archive sheet');
    }
    
    // Clear Current sheet and keep only recent data
    if (rowsToKeep.length > 0) {
      currentSheet.getRange(2, 1, lastRow - 1, 5).clearContent();
      currentSheet.getRange(2, 1, rowsToKeep.length, 5).setValues(rowsToKeep);
      Logger.log('✅ Kept ' + rowsToKeep.length + ' recent rows in Current sheet');
    } else {
      currentSheet.getRange(2, 1, lastRow - 1, 5).clearContent();
      Logger.log('⚠️ No recent data to keep');
    }
    
    // Send summary email (optional)
    sendArchiveSummary(archivedCount, rowsToKeep.length, cutoffDate);
    
    Logger.log('🎉 Archive completed successfully!');
    
  } catch (error) {
    Logger.log('❌ Archive error: ' + error.toString());
    // Send error notification
    MailApp.sendEmail({
      to: Session.getActiveUser().getEmail(),
      subject: '❌ POS Monitor: Archive Failed',
      body: 'Error during auto-archive:\n\n' + error.toString()
    });
  }
}

/**
 * Send archive summary email
 */
function sendArchiveSummary(archivedCount, keptCount, cutoffDate) {
  try {
    var email = Session.getActiveUser().getEmail();
    var subject = '📊 POS Monitor: Daily Archive Report';
    var body = 'Auto-archive completed successfully!\n\n' +
               '📅 Cutoff Date: ' + cutoffDate.toLocaleString('th-TH') + '\n' +
               '🗄️ Rows Archived: ' + archivedCount + '\n' +
               '📊 Rows Kept (Current): ' + keptCount + '\n' +
               '⏰ Time: ' + new Date().toLocaleString('th-TH') + '\n\n' +
               'All data older than ' + CONFIG.ARCHIVE_AFTER_DAYS + ' days has been moved to the Archive sheet.';
    
    MailApp.sendEmail(email, subject, body);
  } catch (error) {
    Logger.log('⚠️ Could not send summary email: ' + error.toString());
  }
}

// ========== HELPER FUNCTIONS ==========

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
  
  var date = new Date(timestamp);
  return Utilities.formatDate(date, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss');
}

// ========== TIME TRIGGER SETUP ==========

/**
 * Create time-based trigger for daily archiving
 * Run this manually once to set up automatic archiving
 */
function createDailyTrigger() {
  // Delete existing triggers first
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'autoArchive') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger - runs daily at 2:00 AM
  ScriptApp.newTrigger('autoArchive')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
  
  Logger.log('✅ Daily trigger created! Archive will run every day at 2:00 AM');
}

/**
 * Delete all triggers (if needed)
 */
function deleteAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  Logger.log('✅ All triggers deleted');
}

// ========== MANUAL ARCHIVE FUNCTIONS ==========

/**
 * Manually archive specific date range
 * Example: archiveByDateRange('2024-01-01', '2024-01-31')
 */
function archiveByDateRange(startDate, endDate) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var currentSheet = ss.getSheetByName(CONFIG.CURRENT_SHEET_NAME);
  var archiveSheet = ss.getSheetByName(CONFIG.ARCHIVE_SHEET_NAME);
  
  var start = new Date(startDate);
  var end = new Date(endDate);
  
  Logger.log('📅 Archiving data from ' + start.toLocaleDateString() + ' to ' + end.toLocaleDateString());
  
  var lastRow = currentSheet.getLastRow();
  var data = currentSheet.getRange(2, 1, lastRow - 1, 5).getValues();
  
  var rowsToArchive = [];
  var rowsToKeep = [];
  
  data.forEach(function(row) {
    var rowDate = new Date(row[0]);
    if (rowDate >= start && rowDate <= end) {
      rowsToArchive.push(row);
    } else {
      rowsToKeep.push(row);
    }
  });
  
  if (rowsToArchive.length > 0) {
    var archiveLastRow = archiveSheet.getLastRow();
    archiveSheet.getRange(archiveLastRow + 1, 1, rowsToArchive.length, 5)
      .setValues(rowsToArchive);
    
    currentSheet.getRange(2, 1, lastRow - 1, 5).clearContent();
    if (rowsToKeep.length > 0) {
      currentSheet.getRange(2, 1, rowsToKeep.length, 5).setValues(rowsToKeep);
    }
    
    Logger.log('✅ Archived ' + rowsToArchive.length + ' rows');
  } else {
    Logger.log('⚠️ No data found in specified date range');
  }
}

/**
 * View archive statistics
 */
function getArchiveStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var currentSheet = ss.getSheetByName(CONFIG.CURRENT_SHEET_NAME);
  var archiveSheet = ss.getSheetByName(CONFIG.ARCHIVE_SHEET_NAME);
  
  var currentRows = currentSheet.getLastRow() - 1;
  var archiveRows = archiveSheet.getLastRow() - 1;
  var totalRows = currentRows + archiveRows;
  
  Logger.log('📊 Archive Statistics:');
  Logger.log('Current sheet: ' + currentRows + ' rows');
  Logger.log('Archive sheet: ' + archiveRows + ' rows');
  Logger.log('Total data: ' + totalRows + ' rows');
  Logger.log('Storage used: ' + ((totalRows / 10000000) * 100).toFixed(2) + '%');
  
  return {
    current: currentRows,
    archive: archiveRows,
    total: totalRows,
    storagePercent: ((totalRows / 10000000) * 100).toFixed(2)
  };
}

// ========== TEST FUNCTIONS ==========

/**
 * Test doPost with sample data
 */
function testDoPost() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toLocaleString('th-TH'),
        branch: "สาขาทดสอบ",
        avg: 125,
        max: 200,
        count: 15
      })
    }
  };
  
  var result = doPost(testData);
  Logger.log(result.getContent());
}

/**
 * Test doGet
 */
function testDoGet() {
  var result = doGet({});
  var content = result.getContent();
  Logger.log(content);
  
  var json = JSON.parse(content);
  Logger.log('Success: ' + json.success);
  Logger.log('Branch count: ' + json.count);
}

/**
 * Test archive function
 */
function testArchive() {
  Logger.log('🧪 Testing archive function...');
  autoArchive();
}
