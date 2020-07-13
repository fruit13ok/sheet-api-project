# sheet-api-project
This is the node backend project try to use Google Sheet Api V4 to programmatically create a sheet, write data to it, and know which sheet is it by knowing it ID.  

It does authorization to my google drive, then it will create a new google sheet and write data to it, store in my drive.  

Google sheet ID create inside a callback inner function.  

I am trying to store and re-access the sheet ID in the outer scope.  

# Require files
index.js - the project file.  

credentials.json - need it to authorize use of google sheet api V4 with my google account.  

token.json - give permission to access.  

# To install package
npm i

# To run
node index.js

# If access token expire
delete token.json  

node index.js  

open the the given link  

    EX:  
    https://aspergernetwork.herokuapp.com  
    after page open, url looks like this  

    EX:  
    https://aspergernetwork.herokuapp.com/?code=4%2F1wHHiEPnW_X0Fo9lAyX2Ju-GMXWQL1VHyvptgLtd1LGGf2sZp_xl4uouOv_7w0VdoyG5XW0U4spqH6q8ZpI3Yus&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive#  
    verification code hide between the URL like this  

    EX:  
    4%2F1wHHiEPnW_X0Fo9lAyX2Ju-GMXWQL1VHyvptgLtd1LGGf2sZp_xl4uouOv_7w0VdoyG5XW0U4spqH6q8ZpI3Yus

paste it in, hit enter  

new token.json generated and project should run  
