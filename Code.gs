/**
 * POS Connection Monitoring System - Google Apps Script
 * This script receives data from WordPress clients and stores it in Google Sheets
 * 
 * Setup Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Deploy as Web App (Anyone can access)
 * 5. Copy the deployment URL to use in WordPress
 */

function doPost(e) {
  try {
    // Get the active spreadsheet and first sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    
    // Parse incoming JSON data
    var data = JSON.parse(e.postData.contents);
    
    // Append new row with data
    // Columns: Timestamp | Branch Name | Avg Latency (ms) | Max Latency (ms) | Samples
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
      message: "Data recorded successfully"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function to verify the script works
 * Run this from the Apps Script editor to test
 */
function testDoPost() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toLocaleString('th-TH'),
        branch: "TestBranch",
        avg: 150,
        max: 250,
        count: 15
      })
    }
  };
  
  var result = doPost(testData);
  Logger.log(result.getContent());
}