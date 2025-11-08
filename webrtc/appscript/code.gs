/**
 * RESTful Shortener API
 * 
 * POST { "text": "your long string here" } → returns { "id": "abc123" }
 * GET ?id=abc123 → returns { "text": "original long string" }
 */

const SCRIPT_PROP = PropertiesService.getScriptProperties();

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const text = data.text;
    if (!text) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Missing text" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Load stored map
    const existing = JSON.parse(SCRIPT_PROP.getProperty("short_map") || "{}");

    // Generate unique ID
    const id = Math.random().toString(36).substring(2, 8);
    existing[id] = text;

    // Save updated map
    SCRIPT_PROP.setProperty("short_map", JSON.stringify(existing));

    return ContentService.createTextOutput(JSON.stringify({ id }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const id = e.parameter.id;
  if (!id) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Missing id" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const existing = JSON.parse(SCRIPT_PROP.getProperty("short_map") || "{}");
  const text = existing[id];

  if (!text) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ text }))
    .setMimeType(ContentService.MimeType.JSON);
}
