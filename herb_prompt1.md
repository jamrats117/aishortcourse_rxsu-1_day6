Prompt

from this code
**
const LINE_CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const SHEET_NAME = PropertiesService.getScriptProperties().getProperty('SHEET_NAME');

function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const events = json.events;
  
  events.forEach(event => {
    const replyToken = event.replyToken;
    const userMessage = event.message.text;
    
    let replyMessage;
    
    if (userMessage.toLowerCase() === 'วิธีใช้งาน') {
      replyMessage = "🌿 สอบถาม Herb interactions กับยาวาร์ฟาริน: สามารถสอบถามได้ตลอดโดย กรุณาระบุชื่อสมุนไพร ตามรายละเอียดในเมนู ตัวอย่าง: ขิง";
    } else {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      const herbInfo = findHerbInfo(data, userMessage);
      
      if (herbInfo) {
        replyMessage = สมุนไพร: ${herbInfo.herb}\n +
                       ผลต่อ INR: ${herbInfo.effect}\n +
                       รายละเอียด: ${herbInfo.description}\n +
                       ระดับคุณภาพหลักฐาน: ${herbInfo.loe}\n +
                       แหล่งอ้างอิง: ${herbInfo.ref};
      } else {
        replyMessage = "ไม่พบสมุนไพรในระบบ กรุณาสอบถาม Admin";
      }
    }
    
    sendReply(replyToken, replyMessage);
  });
}

function findHerbInfo(data, herbName) {
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toLowerCase() === herbName.toLowerCase()) {
      return {
        herb: data[i][1],
        effect: data[i][2],
        description: data[i][3],
        loe: data[i][4],
        ref: data[i][5]
      };
    }
  }
  return null;
}

function sendReply(replyToken, message) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const payload = JSON.stringify({
    replyToken: replyToken,
    messages: [{ type: 'text', text: message }]
  });
  
  UrlFetchApp.fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    payload: payload
  });
}
**
please revise for get request from dialogflow and return outtput
here it is Raw API response
**
{
  "responseId": "407c999d-645b-4891-9d62-1b7c33b62784-0fffcc35",
  "queryResult": {
    "queryText": "มะม่วง",
    "parameters": {
      "herb_entity": "มะม่วง"
    },
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
    "intent": {
      "name": "projects/herb-agent-iynm/agent/intents/6fc07883-a2e6-4219-921a-bf6c6ce9b0c1",
      "displayName": "getHerb"
    },
    "intentDetectionConfidence": 1,
    "languageCode": "th"
  }
}
**

Prompt
ฉันต้องการปรับโค้ดที่ใช้ใน Line chatbot ให้สามารถรับข้อมูลจาก Dialogflow แทนการรับข้อมูลจาก Line และให้แสดงผลลัพธ์ตามข้อมูลที่อยู่ใน Google Sheets โดยฉันจะส่ง API response แบบ Raw จาก Dialogflow ไปให้ โดยมีรายละเอียดดังนี้:
รายละเอียดของโค้ดเดิม:
ฉันใช้ Google Apps Script เพื่อสร้าง Line chatbot และเก็บค่า LINE_CHANNEL_ACCESS_TOKEN, SHEET_ID, และ SHEET_NAME ไว้ใน Script Properties
ผู้ใช้สามารถพิมพ์ชื่อสมุนไพรในแชทบอท แล้วโค้ดจะไปดึงข้อมูลจาก Google Sheet ที่ประกอบด้วย 6 คอลัมน์ ได้แก่:
คอลัมน์ 1: code
คอลัมน์ 2: herb
คอลัมน์ 3: effect
คอลัมน์ 4: description
คอลัมน์ 5: loe
คอลัมน์ 6: ref
เมื่อผู้ใช้พิมพ์ชื่อสมุนไพรในแชทบอท เช่น "ขิง" ระบบจะแสดงข้อมูลจากคอลัมน์ต่างๆ ของสมุนไพรนั้นกลับไปยังผู้ใช้
สิ่งที่ต้องการปรับปรุง:
เปลี่ยนจากการรับข้อความผ่าน Line chatbot เป็นรับผ่าน Dialogflow:
ฉันต้องการให้โค้ดนี้สามารถรับข้อมูลจาก API response ของ Dialogflow แทน ซึ่งจะส่งชื่อสมุนไพรผ่านพารามิเตอร์ herb_entity ตาม API response แบบ Raw ดังนี้:
{
  "responseId": "407c999d-645b-4891-9d62-1b7c33b62784-0fffcc35",
  "queryResult": {
    "queryText": "มะม่วง",
    "parameters": {
      "herb_entity": "มะม่วง"
    },
    "allRequiredParamsPresent": true,
    "intent": {
      "displayName": "getHerb"
    },
    "languageCode": "th"
  }
}

เปลี่ยนวิธีการส่งผลลัพธ์:
แทนที่จะส่งผลลัพธ์กลับไปยัง Line chatbot ให้ส่งผลลัพธ์กลับไปยัง Dialogflow ผ่าน webhook fulfillment
ตัวอย่างผลลัพธ์ที่ต้องการส่งกลับหากพบสมุนไพรในระบบ:
สมุนไพร: มะม่วง
ผลต่อ INR: ลด INR
รายละเอียด: มะม่วงมีสารที่ทำให้ INR ลดลง
ระดับคุณภาพหลักฐาน: ระดับ 3
แหล่งอ้างอิง: https://example.com

จัดการกรณีไม่พบสมุนไพร:
หากไม่พบชื่อสมุนไพร ให้ส่งข้อความกลับไปยัง Dialogflow ดังนี้
ไม่พบสมุนไพรในระบบ กรุณาสอบถาม Admin




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
ฉันต้องการให้โค้ดนี้รับข้อมูลจาก API response ของ Dialogflow โดยใช้พารามิเตอร์ herb_entity ซึ่งจะระบุชื่อสมุนไพรที่ผู้ใช้ค้นหา โดยข้อมูลพารามิเตอร์จะอยู่ใน outputContexts ตามโครงสร้าง API response ดังนี้:
{
  "responseId": "90db35a4-384c-4ba2-b290-06b3b155ac8d-0fffcc35",
  "queryResult": {
    "outputContexts": [
      {
        "parameters": {
          "herb_entity": "มะม่วง"
        }
      }
    ]
  }
}

ฟังก์ชันที่ต้องการ:
รับข้อมูลจาก Dialogflow: รับชื่อสมุนไพรจากพารามิเตอร์ herb_entity ใน outputContexts ของ API response
ค้นหาข้อมูลใน Google Sheets: ค้นหาข้อมูลจากคอลัมน์ herb และดึงข้อมูลจากคอลัมน์ effect หากพบสมุนไพรที่ตรงกัน
แสดงผลลัพธ์: ส่งผลลัพธ์กลับไปในรูปแบบ:
สมุนไพร: [ชื่อสมุนไพร]
ผลต่อ INR: [ข้อมูลจากคอลัมน์ 3]

การจัดการกรณีไม่พบสมุนไพร: หากไม่พบชื่อสมุนไพรใน Google Sheet ให้ส่งข้อความ:
ไม่พบสมุนไพรในระบบ กรุณาสอบถาม Admin



