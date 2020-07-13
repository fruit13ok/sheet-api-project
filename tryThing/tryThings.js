// 2 ways to read file credentials.json

// const fs = require('fs');
// fs.readFile('./credentials.json', (err, content) => {
//     if (err) return console.log('Error loading client secret file:', err);
//     // console.log(content.toString());
//     console.log(JSON.parse(content));
// });

// const content = require('./credentials.json');
// console.log(content);

//////////////////////////////////////////////////////////////////////

// This is the node backend, it does authorization to my google drive,
// then it will create a new google sheet and write data to it, store in my drive.
// Google sheet ID create inside a callback inner function.
// I am trying to store and re-access the sheet ID in the outer scope.

//////////////////////////////////////////////////////////////////////////////////
//              a version youtube example use API key                           //
//          https://www.youtube.com/watch?v=MiPpQzW_ya0&t=405s                  //
//////////////////////////////////////////////////////////////////////////////////

// // Destructuring assignment, might not need it
// const {google} = require('googleapis');
// // require credential "keys.json" into the code
// const keys = require('./keys.json');

// // Create an authorization client with the given credentials with JWT
// const client = new google.auth.JWT(
//     keys.client_email,
//     null,
//     keys.private_key,
//     ['https://www.googleapis.com/auth/spreadsheets']
//     // ['https://www.googleapis.com/auth/spreadsheets.readonly']   //readonly
// );

// // connect to client, token not use
// client.authorize(function(err, tokens){
//     if(err){
//         console.log(err);
//         return;
//     }else{
//         console.log("connected");
//         // after client has been authorize, then connect to google sheet api
//         googlesheetrun(client)
//     }
// });

// // after client has been authorize, then connect to google sheet api
// // connect to google sheet api
// // connect to a sheet
// // set options
// // GET request spreadsheets, wait til its done
// async function googlesheetrun(client){
//     const googlesheetapi = google.sheets({version: 'v4', auth: client});
//     const options = {
//         spreadsheetId: '1AfZZhdp7n4uaI-GdLxnC49o2DPYRyD6Mi5xEMg2ly2g',
//         // range: 'Sheet1!A1:B5'
//         range: 'Sheet1!A1:B5'
//     };
//     let data = await googlesheetapi.spreadsheets.values.get(options);
//     // console.log(data);
//     // array of array
//     let dataArray = data.data.values;
//     // console.log(dataArray);

//     ///////////////////////////////////////////////////////////////////////////////
//     // now try to UPDATE spreadsheet, insert this array of arrays start ad cell E2
//     dataArray = dataArray.map(function(arr){
//         // take care of blank in row, fill with empty string
//         while(arr.length < 2){
//             arr.push("");
//         }
//         return arr;
//     });
//     console.log('dataArray: ',dataArray);
//     let newDataArray = dataArray.map(function(arr){
//         arr.push(arr[0] + "-" + arr[1]);
//         return arr;
//     });
//     console.log('dataArray: ',dataArray);
//     console.log('newDataArray: ',newDataArray);
//     const updateOptions = {
//         spreadsheetId: '1AfZZhdp7n4uaI-GdLxnC49o2DPYRyD6Mi5xEMg2ly2g',
//         range: 'Sheet1!E2',
//         valueInputOption: 'USER_ENTERED',
//         resource: {values: newDataArray}
//     };
//     let response = await googlesheetapi.spreadsheets.values.update(updateOptions);
//     console.log(response);
// }

//////////////////////////////////////////////////////////////////////////////////
//                      a version of Credentials use OAuth                      //
//////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////
//                      this is google documentation example                    //
//          https://developers.google.com/sheets/api/quickstart/nodejs          //
//////////////////////////////////////////////////////////////////////////////////
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
let googleSheetID;

// Load client secrets from a local file.
fs.readFile("./credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Sheets API.
  //   authorize(JSON.parse(content), listMajors);
  //   authorize(JSON.parse(content), listMySheet);
  //   authorize(JSON.parse(content), appendMySheet);
  //   authorize(JSON.parse(content), createMySheet);
  authorize(JSON.parse(content), createAndUpdateSheet);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  let agsid;
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
    agsid = callback(oAuth2Client);
    console.log("in authorize(): ", agsid);
    return agsid;
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

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      range: "Class Data!A2:E"
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      if (rows.length) {
        console.log("Name, Major:");
        // Print columns A and E, which correspond to indices 0 and 4.
        rows.map(row => {
          console.log(`${row[0]}, ${row[4]}`);
        });
      } else {
        console.log("No data found.");
      }
    }
  );
}
// I did another GET to another sheet by adding one more authorize call
// authorize(JSON.parse(content), listMySheet);
function listMySheet(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "1AfZZhdp7n4uaI-GdLxnC49o2DPYRyD6Mi5xEMg2ly2g",
      range: "Sheet1!A1:B5"
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      //   console.log(rows);
      if (rows.length) {
        // Print columns A and E, which correspond to indices 0 and 4.
        rows.map(row => {
          console.log(`${row[0]}, ${row[1]}`);
        });
      } else {
        console.log("No data found.");
      }
    }
  );
}
// append to sheet
function appendMySheet(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.append(
    {
      spreadsheetId: "1AfZZhdp7n4uaI-GdLxnC49o2DPYRyD6Mi5xEMg2ly2g",
      range: "Sheet1!A6",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [
          ["Void", "Canvas", "Website"],
          ["Paul", "Shan", "Human"]
        ]
      }
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      console.log("res: ", res);
    }
  );
}
// create new sheet
function createMySheet(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  const resource = {
    properties: {
      title: "newGSheet" + new Date().getTime()
    }
  };
  sheets.spreadsheets.create(
    {
      resource
    },
    (err, spreadsheet) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Spreadsheet ID:", spreadsheet.data.spreadsheetId);
      }
    }
  );
}
//
function createAndUpdateSheet(auth) {
  let GSID;
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
      let newGSID;
      if (err) {
        console.log(err);
      } else {
        newGSID = spreadsheet.data.spreadsheetId;
        // console.log('Spreadsheet ID:', newGSID);
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
            // console.log('res: ',res);
          }
        );
        console.log("in create(callback())): ", newGSID);
        return newGSID;
      }
    }
  );
  console.log("in createAndUpdateSheet(): ", GSID);
  return GSID;
}
