/*
  Google Sheet columns:
  1: Timestamp
  2: Key
  3: JSON String (intact)
*/
/*
Test cases
<DEPLOYMENT URL> = script.google.com/macros/s/AKXXXXXXXXXXXXXXXXXX

https://<DEPLOYMENT URL>/exec?action=set&json={"name":"Alice","age":25}

https://<DEPLOYMENT URL>/exec?action=set&json={"user":{"id":1,"role":"admin"}}
https://script.google.com/macros/s/AKfycbwV7UQPANkrhRThtqhc7QS9-ev0DGJEgfbyphs42SThyPqQ5riTGtzYRO4pH6xD-OuWNQ/exec?action=get&keys=583cca51
https://<DEPLOYMENT URL>/exec?action=delete&key=0a6289bb

$ wget -qO- "https://script.google.com/macros/s/AKfycbwV7UQPANkrhRThtqhc7QS9-ev0DGJEgfbyphs42SThyPqQ5riTGtzYRO4pH6xD-OuWNQ/exec?action=get&keys=583cca51"
*/

const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1kVrHBDvvrML1WAMPQL6CiuefUKALzBonv-AAfbal2Gg/";
const sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheets()[0];

/* ========= HELPERS ========= */

function makeKeyFromJson(jsonStr) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    jsonStr,
    Utilities.Charset.UTF_8
  );
  return digest.map(b => (b + 256).toString(16).slice(-2))
               .join('')
               .substring(0, 8);
}

function getSheetAsDict() {
  const data = sheet.getDataRange().getValues();
  const dict = {};
  for (let i = 1; i < data.length; i++) {
    const key = data[i][1];
    const value = data[i][2];
    if (key) dict[key] = value;
  }
  return dict;
}

function findRowByKey(key) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === key) return i + 1; // convert index → row number
  }
  return -1;
}

/* ========= MAIN API ============ */

function doGet(e) {
  const params = e?.parameter || {};
  const action = params.action;
  let result = {};

  /* ---------- ADD / SET ---------- */
  if (action === "set") {
    try {
      const jsonStr = params.json;
      if (!jsonStr) throw "Missing ?json=";

      const key = makeKeyFromJson(jsonStr);
      sheet.appendRow([new Date(), key, jsonStr]);

      result = { status: "ok", key };
    } catch (err) {
      result = { status: "error", error: err.toString() };
    }
  }

  /* ---------- GET SPECIFIC KEYS ---------- */
  else if (action === "get") {
    const mapdict = getSheetAsDict();
    const keys = params.keys ? params.keys.split(",") : [];
    const out = {};

    keys.forEach(k => out[k] = mapdict[k] || null);

    result = out;
  }

  /* ---------- GET ALL ---------- */
  else if (action === "getall") {
    result = getSheetAsDict();
  }

  /* ---------- DELETE ---------- */
  else if (action === "delete") {
    try {
      const key = params.key;
      if (!key) throw "Missing ?key=";

      const row = findRowByKey(key);
      if (row === -1) throw "Key not found";

      if (row === 1) throw "Cannot delete header row";

      sheet.deleteRow(row);

      result = { status: "ok", deleted: key };
    } catch (err) {
      result = { status: "error", error: err.toString() };
    }
  }

  /* ---------- DEFAULT: RETURN ALL ---------- */
  else {
    result = getSheetAsDict();
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

