/**
 * Single webhook cloud function that is invoked by Circuit webhooks
 * CONVERSATION.ADD_ITEM
 * CONVERSATION.ADD_ITEM is invoked for any new Circuit message
 * USER.SUBMIT_FORM_DATA is triggered when a user sibmits an answer
 *
 * Done as a single cloud function to reduce the cold start time for
 * submitting an answer.
 */

'use strict';

const fetch = require('node-fetch');
const dialogFlow = require('./dialogFlow');
const utils = require('./utils');
const db = require('./db');

const ANSWER_TIME = 20; // in seconds

// Circuit domain
const { DOMAIN } = process.env;

// Circuit token and bot userId
let token, userId;

// Initialize the DB with the right domain
db.init(DOMAIN);

// Intents for DialogFlow
const Intents = {
  DEFAULT: 'Default Welcome Intent',
  RESP: 'respuesta',
  FB: 'usuarioFeedbackBot'
  
}

let listaIntentsUtilizados = [];

/**
 * Post a message
 * @param {String} convId Conversation ID
 * @param {String} parentItemId Parent Item ID. Posted as comment is parameter is present.
 * @param {String} content Message content
 */
async function postMessage(convId, parentItemId, content) {

  let url = `${DOMAIN}/rest/conversations/${convId}/messages`;
  parentItemId && (url += `/${parentItemId}`);

  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({content: content})
  });
}

/**
 * Post a default Welcome Message
 * @param {String} convId Conversation ID
 * @param {String} parentItemId Parent Item ID. Posted as comment is parameter is present.
 * @param {String} content Message content
 */
async function defaultWelcome(convId, parentItemId, content, id) {

  let name = await getUserData(id);  
  let url = `${DOMAIN}/rest/conversations/${convId}/messages`;
  parentItemId && (url += `/${parentItemId}`);

  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({content: content + ` ¿Qué puedo hacer por tí ${name}?`})
  });
}

async function handleUserSubmitFormData(req, res) {
    const { formId, itemId, submitterId, data } = req.body.submitFormData;
    console.log(`Form submission by ${submitterId} on item ${itemId}`);
    /*await Promise.all([        
        db.addSubmission(itemId, submitterId, data[0].value, isCorrect)
    ]);*/
    console.log('----------------------------------------------------');
    console.log('DATA ---> '+data[0].value);
    console.log('----------------------------------------------------');
    //res.sendStatus(200);
}

//VERSION SENCILLA
/*async function feedbackFormulario(convId, parentItemId, content, id) {

  let name = await getUserData(id);  
  let url = `${DOMAIN}/rest/conversations/${convId}/messages`;
  parentItemId && (url += `/${parentItemId}`);

    let form = {
    id: 'encuesta',
    controls: [{
      type: 'LABEL',
      text: `<b>Responde a esta pequeña encuesta </b>`
    }, {
      name: 'choices',
      type: 'RADIO',
      title: `Valora la respuesta del BOT sobre "${listaIntentsUtilizados[0]}". Siendo (1) el mas bajo y (5) lo mas alto.`,
      defaultValue: '0',
      options: [
        {text: '1', value: '1'},
        {text: '2', value: '2'},
        {text: '3', value: '3'},
        {text: '4', value: '4'},
        {text: '5', value: '5'}
        ]
    }, {
      type: 'BUTTON',
      options: [{
        text: 'Enviar',
        action: 'submit',
        notification: 'Gracias por evaluarnos!'
      }]
    }]
  }

  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({content: content, formMetaData: JSON.stringify(form)})
  });

    listaIntentsUtilizados = [];
}*/

 //VERSION COMPLEJA

async function feedbackFormulario(convId, parentItemId, content, id) {

  let name = await getUserData(id);  
  let url = `${DOMAIN}/rest/conversations/${convId}/messages`;
  parentItemId && (url += `/${parentItemId}`);

    let form = {
    id: 'encuesta',
        controls: [{
            type: 'LABEL',
            text: `<b>Responde a esta pequeña encuesta </b>`
        }]
    }


    listaIntentsUtilizados.forEach(intents => {
        form.controls.push({            
            type: 'LABEL',
            text: '<b>' + intents + '</b>'
          },{            
            name: intents,
            type: 'RADIO',
            options: [
                {text:'1', value:'1'},
                {text:'2', value:'2'},
                {text:'3', value:'3'},
                {text:'4', value:'4'},
                {text:'5', value:'5'}
              ]
          })
     })

     form.controls.push(
        {
            type: 'BUTTON',
            options: [{
                text: 'Enviar',
                action: 'submit',
                notification: 'Gracias, tu respuesta ha sido enviada.'
            }]
        }
    ); 

  await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({content: content, formMetaData: JSON.stringify(form)})
  });
}


async function getUserData(id) {

    // Having the bot use GET to send a message to the conversation
    let url = `${DOMAIN}/rest/v2/users/${id}`;

    const res = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token,
        'content-type': 'application/json' }
    });
    
    let x = await res.json();
    console.log(id)
    console.log(x.firstName);
    return x.firstName;
}

async function hello(convId, id, parentItemId) {
    let name = await getUserData(id);
    //console.log(name);
    //console.log(id);
   //Having the bot use POST to send a message to the conversation
   let url = `${DOMAIN}/rest/conversations/${convId}/messages`;
   parentItemId && (url += `/${parentItemId}`);
   console.log(url);

    await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({content: `Te escucho, ${name}`})
});
}

async function handleConversationAddItem(req, res) {
  const item = req.body && req.body.item;
  console.log('addTextItem called for item: ', item.itemId);

  // Get token and bot userId from Datastore
  ({token, userId} = await db.getToken());

  console.log(`token data fetched: ${token}, ${userId}`);

  if (item.creatorId === userId) {
    // Message sent by bot. Skip it.
    console.log('Message sent by bot. Skip it.');
    res.sendStatus(200);
    return;
  }

  if (!item.text) {
    // Not a text item. Skip it.
    console.log('Not a text item. Skip it.');
    res.sendStatus(200);
    return;
  }

  const msg = utils.getMentionedContent(item.text.content, userId);
  if (!msg) {
    // User is not mentioned, skip it. Once the new API is available to
    // only get the event when being mentioned, this will not be needed
    res.sendStatus(200);
    return;
  }

  // Send request and log result
  try {    
    const result = await dialogFlow.detectIntent(msg);
    console.log(`Query: ${result.queryText}`);
    if (result.intent) {
      console.log(`Intent: ${result.intent.displayName}`);


      // item.text.parentId is for backwards compatibility
      const parentId = item.parentId || item.text.parentId || item.itemId;

      listaIntentsUtilizados.push(result.intent.displayName);
      console.log(listaIntentsUtilizados);
      //listaIntentsUtilizados.forEach(pepito => console.log('array  ' + pepito));

      switch (result.intent.displayName) {
        case Intents.RESP:
        await hello(item.convId, item.creatorId, parentId);
        break;
        case Intents.DEFAULT:
        await defaultWelcome(item.convId, parentId, result.fulfillmentText, item.creatorId);
        break;
        case Intents.FB:
        await feedbackFormulario(item.convId, parentId, result.fulfillmentText, item.creatorId)
        break;
        default:;
        await postMessage(item.convId, parentId, result.fulfillmentText);
        break;
      }
    } else {
      console.log('No intent matched.');
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('ERROR:', err);
    await postMessage(item.convId, item.itemId, `Error: ${err && err.message}`);
    res.status(500).send(err && err.message);
  }
}

exports.webhook = async (req, res) => {
  switch (req.body.type) {
    case 'CONVERSATION.ADD_ITEM':
    await handleConversationAddItem(req, res);
    break;
    case 'USER.SUBMIT_FORM_DATA':
    await handleUserSubmitFormData(req, res);
    break;
    default:
    const msg = `Unknown type ${req.body.type}`;
    console.log(msg);
    res.status(200).send(msg);
  }
}

