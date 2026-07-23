/**
 * MOOVED E-Bike Survey - Google Apps Script Backend
 * 
 * Setup Instructions:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Replace YOUR_SHEET_ID below with your actual sheet ID
 * 5. Deploy as Web App: Publish > Deploy as web app
 * 6. Set access to "Anyone" (important!)
 * 7. Copy the Web App URL and paste it into index.html
 */

// ==================== CONFIGURATION ====================
// TODO: Replace with your actual Google Sheet ID
var SHEET_ID = 'YOUR_SHEET_ID_HERE';

// Sheet names
var SUBMISSIONS_SHEET = 'Submissions';
var VEHICLES_SHEET = 'Vehicles';

// ==================== INITIALIZATION ====================
function doGet(e) {
  var action = e.parameter.action;
  
  if (action === 'stats') {
    return getStats();
  } else if (action === 'submissions') {
    return getSubmissions(e.parameter);
  } else if (action === 'submission') {
    return getSubmissionById(e.parameter.id);
  } else if (action === 'settings') {
    return getSettings();
  } else if (action === 'export_json') {
    return exportJSON();
  } else if (action === 'export_csv') {
    return exportCSV();
  } else {
    return jsonResponse({error: 'Unknown action', action: action});
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    if (action === 'submit') {
      return submitSurvey(data);
    } else if (action === 'update') {
      return updateSubmission(data);
    } else if (action === 'delete') {
      return deleteSubmission(data);
    } else {
      return jsonResponse({error: 'Unknown action', action: action}, 400);
    }
  } catch(err) {
    return jsonResponse({error: err.toString()}, 400);
  }
}

// ==================== SUBMIT SURVEY ====================
function submitSurvey(data) {
  var ss = getSpreadsheet();
  var subSheet = getOrCreateSheet(ss, SUBMISSIONS_SHEET);
  var vehSheet = getOrCreateSheet(ss, VEHICLES_SHEET);
  
  var now = new Date();
  var timestamp = now.toISOString();
  
  // Insert submission
  subSheet.appendRow([
    data.salesperson,
    data.region,
    data.district || '',
    timestamp,
    timestamp
  ]);
  
  var submissionId = subSheet.getLastRow();
  
  // Insert vehicles
  if (data.vehicles && data.vehicles.length > 0) {
    for (var i = 0; i < data.vehicles.length; i++) {
      var v = data.vehicles[i];
      vehSheet.appendRow([
        submissionId,
        v.photo || '',
        v.range_km || '',
        v.charging_time_h || '',
        v.weight_kg || '',
        v.price_ghs || '',
        v.notes || '',
        timestamp
      ]);
    }
  }
  
  return jsonResponse({ok: true, id: submissionId, vehicle_count: data.vehicles ? data.vehicles.length : 0}, 201);
}

// ==================== GET STATS ====================
function getStats() {
  var ss = getSpreadsheet();
  var subSheet = ss.getSheetByName(SUBMISSIONS_SHEET);
  var vehSheet = ss.getSheetByName(VEHICLES_SHEET);
  
  if (!subSheet || !vehSheet) {
    return jsonResponse({total: 0, total_vehicles: 0, avg_price_ghs: 0, min_price_ghs: 0, max_price_ghs: 0, regions: [], salespersons: [], by_region: [], by_salesperson: [], recent_7: 0, recent_30: 0});
  }
  
  var subData = subSheet.getDataRange().getValues();
  var vehData = vehSheet.getDataRange().getValues();
  
  var total = Math.max(0, subData.length - 1);
  var totalVehicles = Math.max(0, vehData.length - 1);
  
  var prices = [];
  var regions = {};
  var salespersons = {};
  var now = new Date();
  var recent7 = 0;
  var recent30 = 0;
  
  for (var i = 1; i < subData.length; i++) {
    var row = subData[i];
    var submittedAt = new Date(row[3]);
    var daysDiff = (now - submittedAt) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 7) recent7++;
    if (daysDiff <= 30) recent30++;
    
    var region = row[1];
    var sp = row[0];
    
    if (!regions[region]) regions[region] = {cnt: 0, prices: []};
    regions[region].cnt++;
    
    if (!salespersons[sp]) salespersons[sp] = {cnt: 0, prices: []};
    salespersons[sp].cnt++;
  }
  
  for (var j = 1; j < vehData.length; j++) {
    var vrow = vehData[j];
    var price = parseFloat(vrow[5]);
    if (!isNaN(price)) {
      prices.push(price);
      var sid = vrow[0];
      for (var i = 1; i < subData.length; i++) {
        if (subData[i][0] !== undefined && subData[i].length > 3 && String(subData[i][0]) === String(sid)) {
          var r = subData[i][1];
          if (regions[r]) regions[r].prices.push(price);
          break;
        }
      }
    }
  }
  
  var avgPrice = prices.length > 0 ? prices.reduce(function(a,b){return a+b;},0)/prices.length : 0;
  var minPrice = prices.length > 0 ? Math.min.apply(null, prices) : 0;
  var maxPrice = prices.length > 0 ? Math.max.apply(null, prices) : 0;
  
  var byRegion = [];
  for (var key in regions) {
    var rp = regions[key].prices;
    var avg = rp.length > 0 ? rp.reduce(function(a,b){return a+b;},0)/rp.length : 0;
    var min = rp.length > 0 ? Math.min.apply(null, rp) : 0;
    var max = rp.length > 0 ? Math.max.apply(null, rp) : 0;
    byRegion.push({region: key, cnt: regions[key].cnt, avg_ghs: Math.round(avg*100)/100, min_ghs: Math.round(min*100)/100, max_ghs: Math.round(max*100)/100});
  }
  
  var bySalesperson = [];
  for (var key2 in salespersons) {
    var sp2 = salespersons[key2];
    var pr2 = [];
    for (var j = 1; j < vehData.length; j++) {
      var vrow2 = vehData[j];
      if (vrow2[0] == key2) {
        var p2 = parseFloat(vrow2[5]);
        if (!isNaN(p2)) pr2.push(p2);
      }
    }
    var avg2 = pr2.length > 0 ? pr2.reduce(function(a,b){return a+b;},0)/pr2.length : 0;
    bySalesperson.push({salesperson: key2, cnt: sp2.cnt, avg_ghs: Math.round(avg2*100)/100});
  }
  
  return jsonResponse({
    total: total,
    total_vehicles: totalVehicles,
    avg_price_ghs: Math.round(avgPrice*100)/100,
    min_price_ghs: Math.round(minPrice*100)/100,
    max_price_ghs: Math.round(maxPrice*100)/100,
    regions: Object.keys(regions).sort(),
    salespersons: Object.keys(salespersons).sort(),
    by_region: byRegion,
    by_salesperson: bySalesperson,
    recent_7: recent7,
    recent_30: recent30
  });
}

// ==================== GET SUBMISSIONS ====================
function getSubmissions(params) {
  var ss = getSpreadsheet();
  var subSheet = ss.getSheetByName(SUBMISSIONS_SHEET);
  var vehSheet = ss.getSheetByName(VEHICLES_SHEET);
  
  if (!subSheet || !vehSheet) {
    return jsonResponse({data: [], total: 0, page: 1, pages: 1});
  }
  
  var subData = subSheet.getDataRange().getValues();
  var vehData = vehSheet.getDataRange().getValues();
  
  var result = [];
  
  for (var i = 1; i < subData.length; i++) {
    var row = subData[i];
    var submissionId = i + 1;
    
    var region = row[1];
    var search = params.search || '';
    
    if (params.region && region !== params.region) continue;
    if (search && !String(row[0]).toLowerCase().indexOf(search.toLowerCase()) > -1 && 
        !String(row[2]).toLowerCase().indexOf(search.toLowerCase()) > -1) continue;
    
    var vehicles = [];
    for (var j = 1; j < vehData.length; j++) {
      if (vehData[j][0] == submissionId) {
        vehicles.push({
          id: j,
          photo: vehData[j][1],
          range_km: vehData[j][2],
          charging_time_h: vehData[j][3],
          weight_kg: vehData[j][4],
          price_ghs: vehData[j][5],
          notes: vehData[j][6],
          created_at: vehData[j][7]
        });
      }
    }
    
    result.push({
      id: submissionId,
      salesperson: row[0],
      region: region,
      district: row[2],
      submitted_at: row[3],
      updated_at: row[4],
      vehicles: vehicles
    });
  }
  
  return jsonResponse({data: result, total: result.length, page: 1, pages: 1});
}

// ==================== GET SUBMISSION BY ID ====================
function getSubmissionById(id) {
  var ss = getSpreadsheet();
  var subSheet = ss.getSheetByName(SUBMISSIONS_SHEET);
  var vehSheet = ss.getSheetByName(VEHICLES_SHEET);
  
  if (!subSheet || !vehSheet) {
    return jsonResponse({error: 'not found'}, 404);
  }
  
  var subData = subSheet.getDataRange().getValues();
  var vehData = vehSheet.getDataRange().getValues();
  
  for (var i = 1; i < subData.length; i++) {
    if (i + 1 == id) {
      var row = subData[i];
      var vehicles = [];
      for (var j = 1; j < vehData.length; j++) {
        if (vehData[j][0] == id) {
          vehicles.push({
            id: j,
            photo: vehData[j][1],
            range_km: vehData[j][2],
            charging_time_h: vehData[j][3],
            weight_kg: vehData[j][4],
            price_ghs: vehData[j][5],
            notes: vehData[j][6],
            created_at: vehData[j][7]
          });
        }
      }
      
      return jsonResponse({
        id: id,
        salesperson: row[0],
        region: row[1],
        district: row[2],
        submitted_at: row[3],
        updated_at: row[4],
        vehicles: vehicles
      });
    }
  }
  
  return jsonResponse({error: 'not found'}, 404);
}

// ==================== UPDATE SUBMISSION ====================
function updateSubmission(data) {
  var ss = getSpreadsheet();
  var subSheet = ss.getSheetByName(SUBMISSIONS_SHEET);
  var vehSheet = ss.getSheetByName(VEHICLES_SHEET);
  
  var now = new Date().toISOString();
  var sid = data.id;
  
  // Update submission row
  if (sid > 0 && sid <= subSheet.getLastRow()) {
    subSheet.getRange(sid + 1, 1, 1, 5).setValues([[
      data.salesperson,
      data.region,
      data.district || '',
      subSheet.getRange(sid + 1, 4).getValue(), // keep original submitted_at
      now
    ]]);
  }
  
  // Delete old vehicles and insert new
  vehSheet.getRange(2, 1, vehSheet.getLastRow() - 1, vehSheet.getLastColumn()).clearContent();
  
  if (data.vehicles) {
    for (var i = 0; i < data.vehicles.length; i++) {
      var v = data.vehicles[i];
      vehSheet.appendRow([
        sid,
        v.photo || '',
        v.range_km || '',
        v.charging_time_h || '',
        v.weight_kg || '',
        v.price_ghs || '',
        v.notes || '',
        now
      ]);
    }
  }
  
  return jsonResponse({ok: true, id: sid});
}

// ==================== DELETE SUBMISSION ====================
function deleteSubmission(data) {
  var ss = getSpreadsheet();
  var subSheet = ss.getSheetByName(SUBMISSIONS_SHEET);
  var vehSheet = ss.getSheetByName(VEHICLES_SHEET);
  
  var sid = data.id;
  
  // Delete vehicles first
  var vehData = vehSheet.getDataRange().getValues();
  var rowsToDelete = [];
  for (var i = vehData.length - 1; i >= 1; i--) {
    if (vehData[i][0] == sid) rowsToDelete.push(i + 1);
  }
  for (var j = 0; j < rowsToDelete.length; j++) {
    vehSheet.deleteRow(rowsToDelete[j]);
  }
  
  // Delete submission
  subSheet.deleteRow(sid + 1);
  
  return jsonResponse({ok: true});
}

// ==================== SETTINGS ====================
function getSettings() {
  return jsonResponse({admin_password: 'mooved2026'});
}

// ==================== EXPORT FUNCTIONS ====================
function exportJSON() {
  var ss = getSpreadsheet();
  var subSheet = ss.getSheetByName(SUBMISSIONS_SHEET);
  var vehSheet = ss.getSheetByName(VEHICLES_SHEET);
  
  if (!subSheet || !vehSheet) {
    return jsonResponse({error: 'No data found'}, 404);
  }
  
  var subData = subSheet.getDataRange().getValues();
  var vehData = vehSheet.getDataRange().getValues();
  
  var records = [];
  for (var i = 1; i < vehData.length; i++) {
    var vrow = vehData[i];
    var sid = vrow[0];
    var subRow = null;
    
    // Find corresponding submission
    for (var j = 1; j < subData.length; j++) {
      if (j + 1 == sid) {
        subRow = subData[j];
        break;
      }
    }
    
    if (subRow) {
      records.push({
        id: i,
        submission_id: sid,
        salesperson: subRow[0],
        region: subRow[1],
        district: subRow[2],
        photo: vrow[1],
        range_km: vrow[2],
        charging_time_h: vrow[3],
        weight_kg: vrow[4],
        price_ghs: vrow[5],
        notes: vrow[6],
        submitted_at: subRow[3]
      });
    }
  }
  
  var exportData = {
    metadata: {
      title: "MOOVED Ghana E-Bike Market Survey (Multi-Model)",
      generated_at: new Date().toISOString(),
      record_count: records.length,
      schema_version: "2.0",
      description: "Each row is one vehicle model. Salesperson/region/district are repeated per model.",
      fields: {
        id: "vehicle record ID",
        submission_id: "parent submission ID",
        salesperson: "salesperson name",
        region: "Ghana region",
        district: "specific city/district",
        photo: "vehicle photo URL or base64",
        range_km: "range in km",
        charging_time_h: "charging time in hours",
        weight_kg: "bike weight in kg",
        price_ghs: "price in Ghana Cedis (GHS)",
        notes: "notes (brand/model/dealer etc)",
        submitted_at: "ISO timestamp"
      }
    },
    records: records
  };
  
  return jsonResponse(exportData);
}

function exportCSV() {
  var ss = getSpreadsheet();
  var subSheet = ss.getSheetByName(SUBMISSIONS_SHEET);
  var vehSheet = ss.getSheetByName(VEHICLES_SHEET);
  
  if (!subSheet || !vehSheet) {
    return jsonResponse({error: 'No data found'}, 404);
  }
  
  var subData = subSheet.getDataRange().getValues();
  var vehData = vehSheet.getDataRange().getValues();
  
  var headers = ['id', 'submission_id', 'salesperson', 'region', 'district', 'photo', 'range_km', 'charging_time_h', 'weight_kg', 'price_ghs', 'notes', 'submitted_at'];
  var csvLines = [headers.join(',')];
  
  for (var i = 1; i < vehData.length; i++) {
    var vrow = vehData[i];
    var sid = vrow[0];
    var subRow = null;
    
    // Find corresponding submission
    for (var j = 1; j < subData.length; j++) {
      if (j + 1 == sid) {
        subRow = subData[j];
        break;
      }
    }
    
    if (subRow) {
      var values = [
        i,
        sid,
        '"' + String(subRow[0]).replace(/"/g, '""') + '"',
        '"' + String(subRow[1]).replace(/"/g, '""') + '"',
        '"' + String(subRow[2]).replace(/"/g, '""') + '"',
        '"' + String(vrow[1]).replace(/"/g, '""') + '"',
        vrow[2] || '',
        vrow[3] || '',
        vrow[4] || '',
        vrow[5] || '',
        '"' + String(vrow[6]).replace(/"/g, '""') + '"',
        '"' + String(subRow[3]).replace(/"/g, '""') + '"'
      ];
      csvLines.push(values.join(','));
    }
  }
  
  var csvText = '\ufeff' + csvLines.join('\n');
  return ContentService.createTextOutput(csvText)
    .setMimeType(ContentService.MimeType.CSV)
    .setStatusCode(200);
}

// ==================== HELPERS ====================
function getSpreadsheet() {
  if (SHEET_ID && SHEET_ID !== 'YOUR_SHEET_ID_HERE') {
    return SpreadsheetApp.openById(SHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === SUBMISSIONS_SHEET) {
      sheet.appendRow(['Salesperson', 'Region', 'District', 'Submitted At', 'Updated At']);
    } else if (name === VEHICLES_SHEET) {
      sheet.appendRow(['Submission ID', 'Photo', 'Range km', 'Charging time h', 'Weight kg', 'Price GHS', 'Notes', 'Created At']);
    }
  }
  return sheet;
}

function jsonResponse(data, status) {
  var statusObj = status ? status : 200;
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setStatusCode(statusObj);
}
