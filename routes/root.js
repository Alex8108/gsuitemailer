const express = require('express');
const bodyParserJSON = express.json({limit: "1000kb"});
const urlencodedParser = express.urlencoded({extended: false, limit: "10kb"});
const path = require('path');
const {google} = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');
const crypto = require('crypto');
const schemaValidator = require('jsonschema').Validator;
const {successApiRequest, errorApiRequest, validationErrorApiRequest} = require("../lib/responseApi");
const {mailParametersSchema, tokenGSuiteSchema, credentialsGSuiteSchema} = require("../schemes/schemes");
const router = express.Router();

router.get("/", function(req, res) {

  res.render("homePage");

});

router.post("/getHashForTokens", urlencodedParser, function(req, res) {

  let tokenJSON, credentialsJSON;

  if (!req.body) return res.sendStatus(400);
  
  try {
 
    tokenJSON = JSON.parse(req.body.token);
 
  } catch (error) {

    res.status(400).send("Incorrect syntax of token.json. " + error);
    return;

  }
  
  try {
 
    credentialsJSON = JSON.parse(req.body.credentials);

  } catch (error) {

    res.status(400).send("Incorrect syntax of credentials.json. " + error);
    return;

  }

  try {
      
      let validator = new schemaValidator();
      tokenJSON = JSON.parse(req.body.token);
      credentialsJSON = JSON.parse(req.body.credentials);

      let resultValidation = validator.validate(tokenJSON, tokenGSuiteSchema);
      if (resultValidation.errors.length > 0) {
      
        res.status(422).send("Validation error of token.json: " + resultValidation.errors.toString());
        return;

      }
      
      resultValidation = validator.validate(credentialsJSON, credentialsGSuiteSchema);
      if (resultValidation.errors.length > 0) {
      
        res.status(422).send("Validation error of credentials.json: " + resultValidation.errors.toString());
        return;

      }

  } catch (error) {
      
      res.status(422).send(error);
      return;

  }
  
  const {client_secret, client_id, redirect_uris} = credentialsJSON.installed;
  const hash = getHash(client_id, client_secret, redirect_uris[0], tokenJSON.access_token);
  
  res.send(`Your hash is ${hash}. Please send it to administrator of this service.`);

});

router.post("/sendmail", bodyParserJSON, async function(req, res, next) {
    
    let mailParameters = req.body;

    try {
      
      let validator = new schemaValidator();
      validator.addSchema(tokenGSuiteSchema, '/tokenGSuite');
      validator.addSchema(credentialsGSuiteSchema, '/credentialsGSuiteSchema');

      let resultValidation = validator.validate(mailParameters, mailParametersSchema);
      if (resultValidation.errors.length > 0) {
      
        res.status(422).json(validationErrorApiRequest(resultValidation.errors.toString()));
        return;

      }
      
    } catch (error) {
      
      res.status(422).send(error);
      return;

    }
    

    const {client_secret, client_id, redirect_uris} = mailParameters.credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const hash = getHash(client_id, client_secret, redirect_uris[0], mailParameters.token.access_token);
    const allowedTokenHashes = process.env.ALLOWED_TOKEN_HASHES || "";

    if (allowedTokenHashes.indexOf(hash) < 0) {

      res.status(403).json(errorApiRequest("Token isn't allowed for using in BCS.", res.statusCode));
      return;

    }

    oAuth2Client.setCredentials(mailParameters.token);
    
    let mailComposerParameters = 
    {
        to: mailParameters.emailAddress,
        text: mailParameters.letterText,
        html: mailParameters.hasOwnProperty("letterTextHTML") ? mailParameters.letterTextHTML : "",
        subject: mailParameters.letterTopic,
        textEncoding: "base64",
        attachments: []
    };   
    
    for (i in mailParameters.letterAttachments) {
        let fullFileName = path.join(process.env.ROOT_ATTACHMENTS_CATALOG || "./attachments",
                                     mailParameters.letterAttachments[i]);
        
        mailComposerParameters.attachments.push({filename: path.basename(fullFileName),
            path: fullFileName});
    } 
    
    try {
    
        let encodedMessage = await buildLetter(mailComposerParameters);
        sendResult = await sendMail(encodedMessage, oAuth2Client);

        res.status(200).json(successApiRequest(sendResult, {}, res.statusCode));

    } catch (error) {
      
      res.status(500).json(errorApiRequest(error, res.statusCode));

    }
});

function getHash(client_id, client_secret, redirect_uris, access_token) {

  let hash = crypto.createHmac("sha256", "secret")
                   .update("" + client_id + client_secret + redirect_uris
                           + access_token)
                   .digest("hex");

  return hash;                     
}

async function buildLetter(mailComposerParameters) {
    return new Promise((resolve, reject)=>{
    
        let mail = new MailComposer(mailComposerParameters);
        mail.compile().build((error, msg) => {
            if (error){
                //console.log('Error compiling email ' + error);
                reject("Error compiling email: " + error);
            }
            else {
                const encodedMessage = Buffer.from(msg)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
                
                resolve(encodedMessage);
            }
        });
    });
}

async function sendMail(encodedMessage, auth) {
    return new Promise((resolve, reject)=>{
      const gmail = google.gmail({version: 'v1', auth});
      gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMessage,
        }
      }, (err, result) => {
        if (err) {
            reject("NODEMAILER - The Google API returned an error: " + err);
        }
        else {
           resolve("NODEMAILER - Sending email reply from server: " + JSON.stringify(result.data) + ".");
        }         
      });
    }); 
}

module.exports = router;
