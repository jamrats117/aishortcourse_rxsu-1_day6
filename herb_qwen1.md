// นำเข้า BetterLog Library (https://script.google.com/d/1aFgQlv6eD-Rx_0GYS3Jsh4FcjmbSnhifv7lKqZdTsYppWcjcjVCBixhM/edit?usp=sharing)
var log = BetterLog.useSpreadsheet(); 

// เส้นทางหลักสำหรับรับ request จาก Dialogflow
function doPost(e) {
  try {
    // แปลง JSON string เป็น object
    var request = JSON.parse(e.postData.contents);
    log.info("Dialogflow Request", request);

    // ตรวจสอบว่า Intent มี displayName ตรงกับ "get_herb_post_inr - yes"
    if (request.queryResult.intent.displayName !== "get_herb_post_inr - yes") {
      log.warn("Intent ไม่ตรงกัน");
      return ContentService.createTextOutput(JSON.stringify({ fulfillmentText: "ไม่สามารถดำเนินการได้" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // หา context ที่มี parameter herb
    var outputContexts = request.queryResult.outputContexts;
    var herbName = null;

    for (var i = 0; i < outputContexts.length; i++) {
      if (outputContexts[i].name.endsWith('/contexts/get_herb_post_inr-followup')) {
        herbName = outputContexts[i].parameters.herbs; // ชื่อพารามิเตอร์ใน Dialogflow อาจเป็น herbs
        break;
      }
    }

    if (!herbName) {
      log.error("ไม่พบชื่อสมุนไพรใน Context");
      return ContentService.createTextOutput(JSON.stringify({ fulfillmentText: "ไม่พบชื่อสมุนไพรในระบบ กรุณาสอบถาม Admin" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    log.info("กำลังค้นหาสมุนไพร: ", herbName);

    // อ่านข้อมูลจาก Google Sheet
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var sheetName = PropertiesService.getScriptProperties().getProperty('SHEET_NAME');

    var sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
    var data = sheet.getDataRange().getValues();

    // คอลัมน์: code, herb, effect, description, loe, ref
    var foundRow = data.find(row => row[1] === herbName); // คอลัมน์ 2 คือ herb

    if (!foundRow) {
      log.warn("ไม่พบข้อมูลสมุนไพรใน Sheet:", herbName);
      return ContentService.createTextOutput(JSON.stringify({ fulfillmentText: "ไม่พบสมุนไพรในระบบ กรุณาสอบถาม Admin" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    log.info("พบข้อมูลสมุนไพร", foundRow);

    // สร้างข้อความตอบกลับ
    var responseText = 
`ข้อมูลสมุนไพร
🌿 ชื่อ: ${foundRow[1]}
🔎 ผลต่อ INR: ${foundRow[2]}
📖 คำอธิบาย: ${foundRow[3]}
⭐️ LOE: ${foundRow[4]}
🔗 อ้างอิง: ${foundRow[5]}`;

    return ContentService.createTextOutput(JSON.stringify({ fulfillmentText: responseText }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    log.error("เกิดข้อผิดพลาด", error);
    return ContentService.createTextOutput(JSON.stringify({ fulfillmentText: "เกิดข้อผิดพลาดกรุณาลองใหม่ภายหลัง" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
