/**
 * Handles POST request from Dialogflow
 * @param {Object} e The event object containing the Dialogflow request
 * @return {Object} Response object to be sent back to Dialogflow
 */
function doPost(e) {
  var log = BetterLog.useSpreadsheet();
  log.info('Received POST request: ' + JSON.stringify(e));
  
  try {
    var request = JSON.parse(e.postData.contents);
    log.info('Parsed request: ' + JSON.stringify(request));
    
    // Check if this is the correct intent
    var intentDisplayName = request.queryResult.intent.displayName;
    log.info('Intent display name: ' + JSON.stringify(intentDisplayName));
    
    if (intentDisplayName !== 'get_drug_post_dosing - yes') {
      log.info('Wrong intent, skipping processing');
      return createResponse('This action is not supported.', false);
    }
    
    // Get parameters from output contexts
    var outputContexts = request.queryResult.outputContexts;
    var drug = '';
    var weight = 0;
    
    log.info('Searching for parameters in outputContexts: ' + JSON.stringify(outputContexts));
    
    for (var i = 0; i < outputContexts.length; i++) {
      var context = outputContexts[i];
      if (context.parameters && context.parameters.drug && context.parameters.weight) {
        drug = context.parameters.drug;
        weight = parseFloat(context.parameters.weight);
        log.info('Found parameters - drug: ' + JSON.stringify(drug) + ', weight: ' + JSON.stringify(weight));
        break;
      }
    }
    
    if (!drug || !weight) {
      log.info('Drug or weight parameters not found');
      return createResponse('ไม่พบข้อมูลยาหรือน้ำหนัก กรุณาตรวจสอบอีกครั้ง', false);
    }
    
    // Get data from Google Sheet
    var scriptProperties = PropertiesService.getScriptProperties();
    var sheetId = scriptProperties.getProperty('SHEET_ID');
    var sheetName = scriptProperties.getProperty('SHEET_NAME');
    
    log.info('Accessing Google Sheet - ID: ' + JSON.stringify(sheetId) + ', Name: ' + JSON.stringify(sheetName));
    
    var sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
    var data = sheet.getDataRange().getValues();
    
    // Search for drug in the sheet
    var drugData = null;
    for (var i = 1; i < data.length; i++) { // Skip header row
      if (data[i][1] === drug) { // drug_name is in column 2 (index 1)
        drugData = {
          drug_code: data[i][0],
          drug_name: data[i][1],
          min: parseFloat(data[i][2]),
          max: parseFloat(data[i][3]),
          drug_img: data[i][4],
          unit: data[i][5]
        };
        log.info('Found drug data: ' + JSON.stringify(drugData));
        break;
      }
    }
    
    if (!drugData) {
      log.info('Drug not found in sheet: ' + JSON.stringify(drug));
      return createResponse('ไม่พบยาที่ต้องการคำนวณในระบบ กรุณาสอบถาม Admin', false);
    }
    
    // Calculate dosage
    var minDose = (weight * drugData.min).toFixed(2);
    var maxDose = (weight * drugData.max).toFixed(2);
    
    log.info('Calculated doses - min: ' + JSON.stringify(minDose) + ', max: ' + JSON.stringify(maxDose));
    
    // Prepare response
    var responseText = `ข้อมูลขนาดยา\n` +
      `📝 ยาที่เลือก: ${drugData.drug_name}\n` +
      `⚖️ น้ำหนักเด็ก: ${weight} กิโลกรัม\n` +
      `💊 ขนาดยาที่ควรได้รับ: ${minDose} - ${maxDose} ${drugData.unit}`;
    
    var response = {
      fulfillmentMessages: [
        {
          text: {
            text: [responseText]
          }
        }
      ]
    };
    
    // Add image if available
    if (drugData.drug_img) {
      var imageUrl = 'https://drive.google.com/uc?export=view&id=' + drugData.drug_img;
      response.fulfillmentMessages.push({
        payload: {
          richContent: [
            [
              {
                type: "image",
                rawUrl: imageUrl,
                accessibilityText: "Drug image"
              }
            ]
          ]
        }
      });
      log.info('Added image to response: ' + JSON.stringify(imageUrl));
    }
    
    log.info('Sending response: ' + JSON.stringify(response));
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    log.info('Error processing request: ' + JSON.stringify(error.message));
    return createResponse('เกิดข้อผิดพลาดในการประมวลผล กรุณาลองอีกครั้ง', false);
  }
}

/**
 * Creates a simple text response for Dialogflow
 * @param {string} text The response text
 * @param {boolean} isSuccess Whether the response indicates success
 * @return {Object} The response object
 */
function createResponse(text, isSuccess) {
  return ContentService.createTextOutput(JSON.stringify({
    fulfillmentMessages: [
      {
        text: {
          text: [text]
        }
      }
    ]
  })).setMimeType(ContentService.MimeType.JSON);
}
