/**
 * ======================================================================
 * Dharshithan Waterproofing - Google Sheets Live Sync Webhook Script
 * ======================================================================
 * 
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1WWhXiHHrlUohpJUWhpKXfvqVSR_JUJJDGHFvOFk_Ltc/edit
 * 2. In the top menu, click: Extensions > Apps Script
 * 3. Delete any code in the editor and paste this entire file content.
 * 4. Click the blue "Deploy" button at the top right -> Choose "New deployment".
 * 5. Click the gear icon next to "Select type" -> Choose "Web app".
 * 6. Set Description: "Dharshithan Finance Tracker API"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL for mobile & web app access!
 * 9. Click "Deploy". Authorize permissions when prompted by Google.
 * 10. Copy the Web App URL (looks like: https://script.google.com/macros/s/.../exec)
 * 11. Open your Finance Tracker app -> Click the "Google Sheets Sync" button in the top bar -> Paste the URL -> Click "Save & Connect"!
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

    var headers = data[0];
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

      transactions.push({
        id: "gsheet-" + slNo,
        slNo: Number(slNo),
        date: dateStr,
        type: String(row[2] || "Received / Income"),
        partyName: String(row[3] || ""),
        description: String(row[4] || ""),
        amount: Number(String(row[5] || "0").replace(/[₹,\s]/g, "")) || 0,
        mode: String(row[6] || "CASH").trim(),
        refNumber: String(row[7] || ""),
        quarter: String(row[8] || ""),
        profitValue: Number(String(row[9] || "0").replace(/[₹,\s]/g, "")) || 0
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
    "₹ " + formatNumberIndian(amount),
    (txn.mode || "CASH").toUpperCase(),
    txn.refNumber || "",
    txn.quarter || "Q3",
    (profitValue < 0 ? "-₹ " : "₹ ") + formatNumberIndian(Math.abs(profitValue))
  ]);

  updateDashboardSummary();

  return jsonResponse({ success: true, message: "Transaction added to Sheet1", slNo: nextSlNo });
}

function handleUpdate(sheet, txn) {
  var data = sheet.getDataRange().getValues();
  var targetRow = -1;

  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(txn.slNo)) {
      targetRow = i + 1; // 1-indexed for Sheets
      break;
    }
  }

  if (targetRow === -1) {
    // If not found, append
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
    "₹ " + formatNumberIndian(amount),
    (txn.mode || "CASH").toUpperCase(),
    txn.refNumber || "",
    txn.quarter || "Q3",
    (profitValue < 0 ? "-₹ " : "₹ ") + formatNumberIndian(Math.abs(profitValue))
  ]]);

  updateDashboardSummary();

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
  updateDashboardSummary();

  return jsonResponse({ success: true, message: "Transaction #" + slNo + " deleted from Sheet1" });
}

function handleSyncAll(sheet, transactions) {
  if (!transactions || !transactions.length) {
    return jsonResponse({ success: false, error: "No transactions supplied" });
  }

  // Preserve header
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
      "₹ " + formatNumberIndian(amount),
      (t.mode || "CASH").toUpperCase(),
      t.refNumber || "",
      t.quarter || "Q3",
      (profitValue < 0 ? "-₹ " : "₹ ") + formatNumberIndian(Math.abs(profitValue))
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 10).setValues(rows);
  }

  updateDashboardSummary();

  return jsonResponse({ success: true, message: "Synced " + rows.length + " transactions to Google Sheets" });
}

function updateDashboardSummary() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dash = ss.getSheetByName("Dashboard");
    var sheet1 = ss.getSheetByName("Sheet1");
    if (!dash || !sheet1) return;

    var data = sheet1.getDataRange().getValues();
    var totalIncome = 0;
    var totalExpenses = 0;
    var modeIncome = { "CASH": 0, "NETBANKING": 0, "UPI": 0, "DEBIT CARD / CREDIT CARD": 0, "CHEQUE": 0, "OTHERS": 0 };
    var modeExpense = { "CASH": 0, "NETBANKING": 0, "UPI": 0, "DEBIT CARD / CREDIT CARD": 0, "CHEQUE": 0, "OTHERS": 0 };
    var bankIncome = 0;
    var bankExpense = 0;

    for (var i = 1; i < data.length; i++) {
      var type = String(data[i][2]);
      var amt = Number(String(data[i][5]).replace(/[₹,\s]/g, "")) || 0;
      var mode = String(data[i][6]).trim().toUpperCase();
      if (!modeIncome[mode]) mode = "OTHERS";

      var isInc = type.indexOf("Received") !== -1 || type.indexOf("Income") !== -1;
      if (isInc) {
        totalIncome += amt;
        modeIncome[mode] = (modeIncome[mode] || 0) + amt;
        if (mode !== "CASH") bankIncome += amt;
      } else {
        totalExpenses += amt;
        modeExpense[mode] = (modeExpense[mode] || 0) + amt;
        if (mode !== "CASH") bankExpense += amt;
      }
    }

    dash.getRange("B1").setValue("₹ " + formatNumberIndian(totalIncome));
    dash.getRange("B2").setValue("₹ " + formatNumberIndian(totalExpenses));
    dash.getRange("B4").setValue("₹ " + formatNumberIndian(totalIncome - totalExpenses));

    dash.getRange("E2").setValue("₹ " + formatNumberIndian(modeIncome["UPI"] || 0));
    dash.getRange("E3").setValue("₹ " + formatNumberIndian(modeIncome["NETBANKING"] || 0));
    dash.getRange("E4").setValue("₹ " + formatNumberIndian(modeIncome["CASH"] || 0));
    dash.getRange("E5").setValue("₹ " + formatNumberIndian(modeIncome["DEBIT CARD / CREDIT CARD"] || 0));
    dash.getRange("E6").setValue("₹ " + formatNumberIndian(modeIncome["CHEQUE"] || 0));
    dash.getRange("E7").setValue("₹ " + formatNumberIndian(modeIncome["OTHERS"] || 0));

    dash.getRange("H2").setValue("₹ " + formatNumberIndian(modeExpense["UPI"] || 0));
    dash.getRange("H3").setValue("₹ " + formatNumberIndian(modeExpense["NETBANKING"] || 0));
    dash.getRange("H4").setValue("₹ " + formatNumberIndian(modeExpense["CASH"] || 0));
    dash.getRange("H5").setValue("₹ " + formatNumberIndian(modeExpense["DEBIT CARD / CREDIT CARD"] || 0));
    dash.getRange("H6").setValue("₹ " + formatNumberIndian(modeExpense["CHEQUE"] || 0));
    dash.getRange("H7").setValue("₹ " + formatNumberIndian(modeExpense["OTHERS"] || 0));

    dash.getRange("L2").setValue("₹ " + formatNumberIndian(bankIncome));
    dash.getRange("L3").setValue("₹ " + formatNumberIndian(bankExpense));
    dash.getRange("L4").setValue("₹ " + formatNumberIndian(bankIncome - bankExpense));
  } catch (e) {
    Logger.log("Dashboard update warning: " + e.toString());
  }
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

function formatNumberIndian(num) {
  var n = Number(num).toFixed(2);
  var parts = n.split(".");
  var intPart = parts[0];
  var decPart = parts[1];
  var lastThree = intPart.substring(intPart.length - 3);
  var otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== "") lastThree = "," + lastThree;
  var formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return formatted + "." + decPart;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
