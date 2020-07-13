// This is the node backend, it does authorization to my google drive,
// then it will create a new google sheet and write data to it, store in my drive.
// Google sheet ID create inside a callback inner function.
// I am trying to store and re-access the sheet ID in the outer scope.

const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SCOPES = ["https://www.googleapis.com/auth/drive"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

// I want to bring the inner callback function out to the top scope,
// so I can send it back to frontend
let newGSID;

// Load client secrets from a local file.
fs.readFile("./credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), createAndUpdateSheet);
  console.log("ID after created sheet: ", newGSID);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

// create new sheet and write data to it
function createAndUpdateSheet(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  const resource = {
    properties: {
      title: "newGSheet" + new Date().getTime()
    }
  };
  GSID = sheets.spreadsheets.create(
    {
      resource
    },
    (err, spreadsheet) => {
      if (err) {
        console.log(err);
      } else {
        newGSID = spreadsheet.data.spreadsheetId;
        sheets.spreadsheets.values.update(
          {
            spreadsheetId: newGSID,
            range: "Sheet1!A1",
            valueInputOption: "USER_ENTERED",
            resource: {
              values: [
                ["URL", "Status"],
                ["google.com", "200"],
                ["yahoo.com", "200"],
                ["bing.com", "200"]
              ]
            }
          },
          (err, res) => {
            if (err) return console.log("The API returned an error: " + err);
          }
        );
        console.log("ID inside create() callback: ", newGSID);
      }
    }
  );
}
