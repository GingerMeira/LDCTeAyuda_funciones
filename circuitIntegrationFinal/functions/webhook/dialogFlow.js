'use strict';

const projectId = 'ldcteayuda-mio-exefdp';
const sessionId = 'ldcteayuda-mio-exefdp-session-id';
const languageCode = 'en-US';

// Instantiate a DialogFlow client.
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();

// Define session path
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

exports.detectIntent = msg => {

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: msg,
        languageCode: languageCode,
      },
    },
  };

  // Send request and log result
  return sessionClient
    .detectIntent(request)
    .then(responses => {
      console.log('Detected intent');
      return responses[0].queryResult;
    });
};


