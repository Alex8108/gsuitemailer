exports.mailParametersSchema = {
    "id": "/mailParameters",
    "type": "object",
    "properties": {
      "token": {"$ref": "/tokenGSuite"},
      "credentials": {"$ref": "/credentialsGSuite"},
      "emailAddress": {"type": "string"},
      "letterTopic": {"type": "string"},
      "letterText": {"type": "string"},
      "letterTextHTML": {"type": "string"},
      "letterAttachments": {
          "type": "array",
          "minItems": 0,
          "items": {
          "type": "string"
        }
      }
    },
    "required": ["emailAddress", "letterTopic", "letterText", "letterAttachments", "token", "credentials"]
};

exports.tokenGSuiteSchema = {
    "id": "/tokenGSuite",
    "type": "object",
    "properties": {
      "access_token": {"type": "string"}
    },
    "required": ["access_token"]
};
  
exports.credentialsGSuiteSchema = {
    "id": "/credentialsGSuite",
    "type": "object",
    "properties": {
      "installed": {
        "type": "object",
        "properties": {
          "client_id": {"type": "string"},
          "client_secret": {"type": "string"},
          "redirect_uris": {
            "type": "array",
            "minItems": 1,
            "items": {
            "type": "string"
            }
          }
        },
        "required": ["client_id", "client_secret", "redirect_uris"]  
      }  
    },
    "required": ["installed"]
};