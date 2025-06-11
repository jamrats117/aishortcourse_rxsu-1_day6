    // Add image if available
    if (drugData.drug_img) {
      var imageUrl = 'https://drive.google.com/uc?export=view&id=' + drugData.drug_img;
      response.fulfillmentMessages.push({
        payload: {
          line: {
            type: "image",
            originalContentUrl: imageUrl,
            previewImageUrl: imageUrl
          }
        }
      });
    }
