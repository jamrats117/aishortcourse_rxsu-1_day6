Prompt
ฉันต้องการสร้าง Google Apps Script สำหรับเชื่อมต่อกับ Dialogflow เพื่อรับข้อมูลจาก Google Sheet และส่งผลลัพธ์กลับไป โดยมีรายละเอียดดังนี้:
รายละเอียดโปรเจกต์:
ข้อมูลการเชื่อมต่อ: ฉันใช้ Google Apps Script เพื่อเก็บค่า SHEET_ID และ SHEET_NAME ไว้ใน Script Properties
ข้อมูลใน Google Sheet: Google Sheet ประกอบด้วย 6 คอลัมน์ดังนี้:
คอลัมน์ 1: code
คอลัมน์ 2: herb (ชื่อสมุนไพร)
คอลัมน์ 3: effect (ผลต่อ INR)
คอลัมน์ 4: description
คอลัมน์ 5: loe (ระดับคุณภาพหลักฐาน)
คอลัมน์ 6: ref (แหล่งอ้างอิง)
การทำงานของแชทบอท:
เมื่อผู้ใช้พิมพ์ชื่อสมุนไพรในแชทบอท เช่น "ขิง" ระบบจะไปค้นหาข้อมูลจาก Google Sheet โดยใช้ชื่อสมุนไพรที่ตรงกับคอลัมน์ herb แล้วแสดงข้อมูลจากคอลัมน์ herb และ effect กลับไปยังผู้ใช้
การเชื่อมต่อกับ Dialogflow:
ฉันต้องการให้โค้ดนี้รับข้อมูลจาก API response ของ Dialogflow โดยใช้พารามิเตอร์ herb ซึ่งจะระบุชื่อสมุนไพรที่ผู้ใช้ค้นหา โดยข้อมูลพารามิเตอร์จะอยู่ใน outputContexts ตามโครงสร้าง API response ดังนี้:

{
  "responseId": "86738d64-b174-454a-ab2e-bd056cd872ab-996f169b",
  "queryResult": {
    "queryText": "ใช่จ้า",
    "action": "get_herb_post_inr.get_herb_post_inr-yes",
    "parameters": {},
    "allRequiredParamsPresent": true,
    "fulfillmentMessages": [
      {
        "text": {
          "text": [
            ""
          ]
        }
      }
    ],
    "outputContexts": [
      {
        "name": "projects/herb-4-110625-btkk/agent/sessions/6f72a44f-d335-26dd-c8dd-b949fc0edbc4/contexts/get_herb_post_inr-followup",
        "lifespanCount": 1,
        "parameters": {
          "herb.original": "เทียม",
          "herb": "กระเทียม"
        }
      }
    ],
    "intent": {
      "name": "projects/herb-4-110625-btkk/agent/intents/ac8a8ed8-d61b-4134-9b4c-527dc7a6d9aa",
      "displayName": "get_herb_post_inr - yes"
    },
    "intentDetectionConfidence": 1,
    "languageCode": "th"
  }
}

ฟังก์ชันที่ต้องการ:
รับข้อมูลจาก Dialogflow: รับชื่อสมุนไพรจากพารามิเตอร์ herb ใน outputContexts ของ API response
ค้นหาข้อมูลใน Google Sheets: ค้นหาข้อมูลจากคอลัมน์ herb และดึงข้อมูลจากคอลัมน์ effect หากพบสมุนไพรที่ตรงกัน
แสดงผลลัพธ์: ส่งผลลัพธ์กลับไปในรูปแบบ:

ข้อมูลสมุนไพร
🌿 ชื่อ: กระเทียม (คอลัมน์ 1)
🔎 ผลต่อ INR: เพิ่ม INR (คอลัมน์ 3)
📖 คำอธิบาย: ยับยั้งเอนไซม์ CYP2C9 , CYP2C19 , CYP3A4 (คอลัมน์ 4)
⭐️ LOE: +++ (คอลัมน์ 5)
🔗 อ้างอิง: reference1 (คอลัมน์ 6)

การจัดการกรณีไม่พบสมุนไพร: หากไม่พบชื่อสมุนไพรใน Google Sheet ให้ส่งข้อความ:
ไม่พบสมุนไพรในระบบ กรุณาสอบถาม Admin

***ข้อมูลสำคัญสำหรับสร้าง code***
✅ ตรวจสอบว่า intent ที่รับเข้ามามี displayName ตรงกับ "get_herb_post_inr - yes" หรือไม่
✅ ถ้าใช่ ให้วนลูปค้นหาใน outputContexts ของ intent
✅ context ที่ต้องการคือ context ที่มี parameter "herb"
✅ ผมติตตั้ง better log เพื่อทำการ debugging แบบนี้ var log = BetterLog.useSpreadsheet(); โปรดแทรกโคด better log เพื่อ track แต่ละขั้นตอนด้วยครับ
✅ ใน better log ใช้ได้แค่ log.info(...) เท่านั้น ห้ามใช้แบบอื่นนอกเหนือจาก info เช่น warning, error เป็นต้น

ตัวอย่าง code ที่ต้องการ
  var outputContexts = request.queryResult.outputContexts;
  var contextParameters = {};
  
  // Find the relevant context (getdrugdosing-followup)
  for (var i = 0; i < outputContexts.length; i++) {
    if (outputContexts[i].name.endsWith('/contexts/getdrugdosing-followup')) {
      contextParameters = outputContexts[i].parameters;
      break;
    }
  }
