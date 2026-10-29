/**
 * ======================================================================
 * Dharshithan Waterproofing - Google Sheets Live Sync Webhook Script
 * ======================================================================
 * 
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1WWhXiHHrlUohpJUWhpKXfvqVSR_JUJJDGHFvOFk_Ltc/edit
 * 2. In the top menu, click: Extensions > Apps Script
 * 3. Delete any existing code and paste this entire file content.
 * 4. Click the blue "Deploy" button at the top right -> Choose "New deployment".
 * 5. Click the gear icon next to "Select type" -> Choose "Web app".
 * 6. Set Description: "Dharshithan Finance Tracker API"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL for mobile & web app access!
 * 9. Click "Deploy". Authorize permissions when prompted by Google.
 * 10. Copy the Web App URL (looks like: https://script.google.com/macros/s/.../exec)
 * 11. Open your Finance Tracker app -> Click the "Sheets Sync" button in the top bar -> Paste the URL -> Click "Save Webhook URL"!
 * 
 * Every transaction added, edited, or deleted in the app will now be reflected in your Google Sheet immediately!
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Sheet1");
    if (!sheet) {
      return jsonResponse({ success: false, error: "Sheet1 not found" });
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse({ success: true, transactions: [] });
    }

    var transactions = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var slNo = row[0];
      if (!slNo && slNo !== 0) continue;

      var rawDate = row[1];
      var dateStr = "";
      if (rawDate instanceof Date) {
        dateStr = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else {
        dateStr = String(rawDate);
      }

      var rawAmt = String(row[5] || "0").replace(/[₹,\s]/g, "");
      var amount = Math.abs(Number(rawAmt) || 0);

      var rawProfit = String(row[9] || "0").replace(/[₹,\s]/g, "");
      var profit = Number(rawProfit) || (String(row[2]).indexOf("Received") !== -1 ? amount : -amount);

      transactions.push({
        id: "gsheet-" + slNo,
        slNo: Number(slNo),
        date: dateStr,
        type: String(row[2] || "Received / Income").trim(),
        partyName: String(row[3] || "").trim(),
        description: String(row[4] || "").trim(),
        amount: amount,
        mode: String(row[6] || "CASH").trim().toUpperCase(),
        refNumber: String(row[7] || "").trim(),
        quarter: String(row[8] || "Q3").trim(),
        profitValue: profit
      });
    }

    return jsonResponse({ success: true, count: transactions.length, transactions: transactions });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);
    var action = payload.action;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Sheet1");
    if (!sheet) {
      sheet = ss.insertSheet("Sheet1");
      sheet.appendRow([
        "Sl No.", "Date", "Paid / Received", "Party Name", "Description", 
        "Amount", "Mode ", "Ref Number / Remarks", "Quarter", "Profit Value"
      ]);
    }

    if (action === "add") {
      return handleAdd(sheet, payload.transaction);
    } else if (action === "update") {
      return handleUpdate(sheet, payload.transaction);
    } else if (action === "delete") {
      return handleDelete(sheet, payload.slNo || (payload.transaction && payload.transaction.slNo));
    } else if (action === "syncAll") {
      return handleSyncAll(sheet, payload.transactions);
    } else {
      return jsonResponse({ success: false, error: "Unknown action: " + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function handleAdd(sheet, txn) {
  var data = sheet.getDataRange().getValues();
  var nextSlNo = txn.slNo;
  if (!nextSlNo) {
    var maxSl = 0;
    for (var i = 1; i < data.length; i++) {
      var val = Number(data[i][0]);
      if (!isNaN(val) && val > maxSl) maxSl = val;
    }
    nextSlNo = maxSl + 1;
  }

  var formattedDate = formatDateDisplay(txn.date);
  var isIncome = String(txn.type).indexOf("Received") !== -1 || String(txn.type).indexOf("Income") !== -1;
  var amount = Math.abs(Number(txn.amount) || 0);
  var profitValue = isIncome ? amount : -amount;

  sheet.appendRow([
    nextSlNo,
    formattedDate,
    txn.type,
    txn.partyName,
    txn.description || "",
    amount, // Number for SUMIF
    (txn.mode || "CASH").toUpperCase(),
    txn.refNumber || "",
    txn.quarter || "Q3",
    profitValue // Number for SUM
  ]);

  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 6).setNumberFormat('"₹"#,##0.00');
  sheet.getRange(lastRow, 10).setNumberFormat('"₹"#,##0.00;[Red]-"₹"#,##0.00');

  SpreadsheetApp.flush();
  return jsonResponse({ success: true, message: "Transaction added to Sheet1", slNo: nextSlNo });
}

function handleUpdate(sheet, txn) {
  var data = sheet.getDataRange().getValues();
  var targetRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(txn.slNo)) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return handleAdd(sheet, txn);
  }

  var formattedDate = formatDateDisplay(txn.date);
  var isIncome = String(txn.type).indexOf("Received") !== -1 || String(txn.type).indexOf("Income") !== -1;
  var amount = Math.abs(Number(txn.amount) || 0);
  var profitValue = isIncome ? amount : -amount;

  sheet.getRange(targetRow, 1, 1, 10).setValues([[
    txn.slNo,
    formattedDate,
    txn.type,
    txn.partyName,
    txn.description || "",
    amount,
    (txn.mode || "CASH").toUpperCase(),
    txn.refNumber || "",
    txn.quarter || "Q3",
    profitValue
  ]]);

  sheet.getRange(targetRow, 6).setNumberFormat('"₹"#,##0.00');
  sheet.getRange(targetRow, 10).setNumberFormat('"₹"#,##0.00;[Red]-"₹"#,##0.00');

  SpreadsheetApp.flush();
  return jsonResponse({ success: true, message: "Transaction #" + txn.slNo + " updated in Sheet1" });
}

function handleDelete(sheet, slNo) {
  if (!slNo && slNo !== 0) {
    return jsonResponse({ success: false, error: "slNo is required for delete" });
  }

  var data = sheet.getDataRange().getValues();
  var targetRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(slNo)) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return jsonResponse({ success: false, error: "Transaction #" + slNo + " not found in Sheet1" });
  }

  sheet.deleteRow(targetRow);
  SpreadsheetApp.flush();

  return jsonResponse({ success: true, message: "Transaction #" + slNo + " deleted from Sheet1" });
}

function handleSyncAll(sheet, transactions) {
  if (!transactions || !transactions.length) {
    return jsonResponse({ success: false, error: "No transactions supplied" });
  }

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 10).clearContent();
  }

  var rows = transactions.map(function(t, idx) {
    var slNo = t.slNo || (idx + 1);
    var formattedDate = formatDateDisplay(t.date);
    var isIncome = String(t.type).indexOf("Received") !== -1 || String(t.type).indexOf("Income") !== -1;
    var amount = Math.abs(Number(t.amount) || 0);
    var profitValue = isIncome ? amount : -amount;

    return [
      slNo,
      formattedDate,
      t.type,
      t.partyName,
      t.description || "",
      amount,
      (t.mode || "CASH").toUpperCase(),
      t.refNumber || "",
      t.quarter || "Q3",
      profitValue
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 10).setValues(rows);
    sheet.getRange(2, 6, rows.length, 1).setNumberFormat('"₹"#,##0.00');
    sheet.getRange(2, 10, rows.length, 1).setNumberFormat('"₹"#,##0.00;[Red]-"₹"#,##0.00');
  }

  SpreadsheetApp.flush();
  return jsonResponse({ success: true, message: "Synced " + rows.length + " transactions to Google Sheets" });
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  try {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    var day = d.getDate();
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var month = monthNames[d.getMonth()];
    var year = d.getFullYear();
    return day + "-" + month + "-" + year;
  } catch (e) {
    return String(dateStr);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
