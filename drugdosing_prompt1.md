Prompt
ฉันต้องการสร้าง Google Apps Script สำหรับเชื่อมต่อกับ Dialogflow เพื่อรับข้อมูลจาก Google Sheet และนำไป โดยมีรายละเอียดดังนี้:
รายละเอียดโปรเจกต์:
ข้อมูลการเชื่อมต่อ: ฉันใช้ Google Apps Script เพื่อเก็บค่า SHEET_ID และ SHEET_NAME ไว้ใน Script Properties
ข้อมูลใน Google Sheet: Google Sheet ประกอบด้วย 6 คอลัมน์ดังนี้:
คอลัมน์ 1: drug_code
คอลัมน์ 2: drug_name (ชื่อยา)
คอลัมน์ 3: min (ตัวคูณขนาดยาต่ำสุด)
คอลัมน์ 4: max (ตัวคูณขนาดยาสูงสุด)
คอลัมน์ 5: drug_img (ไอดีของรูปที่เก็บใน google drive)
คอลัมน์ 6: unit (หน่วยของยา)

การทำงานของแชทบอท:
เมื่อผู้ใช้พิมพ์ชื่อยาในแชทบอท เช่น "Dicloxacillin" ระบบจะไปค้นหาข้อมูลจาก Google Sheet โดยใช้ชื่ยาที่ตรงกับคอลัมน์ drug_name แล้วดึงข้อมูลจากคอลัมน์ min, max, drug_img, and unit มาคำนวณขนาดยา

***
ขนาดยาที่ควรได้รับ = น้ำหนักเด็ก * ขนาดยาต่ำสุด (min) และ น้ำหนักเด็ก * ขนาดยาสูงสุด (max)
***

การเชื่อมต่อกับ Dialogflow:
ฉันต้องการให้โค้ดนี้รับข้อมูลจาก API response ของ Dialogflow โดยใช้พารามิเตอร์ drug ซึ่งจะระบุชื่อยาที่ผู้ใช้ค้นหา และ weight ซึ่งระบุน้ำหนักในหน่วยกิโลกรัม โดยข้อมูลพารามิเตอร์จะอยู่ใน outputContexts ตามโครงสร้าง API response ดังนี้:

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
รับข้อมูลจาก Dialogflow: รับชื่อสมุนไพรจากพารามิเตอร์ drug, และ weight ใน outputContexts ของ API response
ค้นหาข้อมูลใน Google Sheets: ค้นหาข้อมูลจากคอลัมน์ drug และดึงข้อมูลจากคอลัมน์ min, max, drug_img, and unit หากพบชื่อยาที่ตรงกัน
แสดงผลลัพธ์: ส่งผลลัพธ์กลับไปในรูปแบบ:

ข้อมูลขนาดยา
📝 ยาที่เลือก: Paracetamol (drug)
⚖️ น้ำหนักเด็ก: 10 (weight) กิโลกรัม  
💊 ขนาดยาที่ควรได้รับ: 100 - 150 mg/dose (unit)
และแสดงรูปภาพที่เป็น ID จากการ share google link ใน drive โดยส่งกลับ รูปภาพ type เป็น image  image uri



การจัดการกรณีไม่พบชื่อยา: หากไม่พบชื่อสมุนไพรใน Google Sheet ให้ส่งข้อความ:
ไม่พบยาที่ต้องการคำนวณในระบบ กรุณาสอบถาม Admin

***ข้อมูลสำคัญสำหรับสร้าง code***
✅ ตรวจสอบว่า intent ที่รับเข้ามามี displayName ตรงกับ "get_herb_post_inr - yes" หรือไม่
✅ ถ้าใช่ ให้วนลูปค้นหาใน outputContexts ของ intent
✅ context ที่ต้องการคือ context ที่มี parameter "herb"
✅ ผมติตตั้ง better log เพื่อทำการ debugging แบบนี้ var log = BetterLog.useSpreadsheet(); โปรดแทรกโคด better log เพื่อ track แต่ละขั้นตอนด้วยครับ
✅ ใน better log ใช้ได้แค่ log.info(...) เท่านั้น ห้ามใช้แบบอื่นนอกเหนือจาก info เช่น warning, error เป็นต้น
✅ การคำนวณแสดงเป็นตัวเลขทศนิยม 2 ตำแหน่ง

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
