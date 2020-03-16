const functions = require('firebase-functions');
const express = require('express');
const app = express();
// const path = require('path');

const admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");
const cors = require('cors')({ origin: true });

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://meditation-app-34538.firebaseio.com"
});
const auth = admin.auth();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

app.use(cors);
app.get('/getUserList', (req, res) => {
    const maxResults = 100; // optional arg.

    auth.listUsers(maxResults).then((userRecords) => {
        userRecords.users.forEach((user) => console.log(user.toJSON()));
        res.json(userRecords);
        res.end();
        // res.end('Retrieved users list successfully.');
    }).catch((error) => console.log(error));
    // res.send("Hello from Firebase!!!!");
});



// Serve the static files from the React app
// app.use(express.static(path.join(__dirname, 'build')));

// // **Not necessary** because of line 'app.use(express.static...)'
// // Handles any requests that don't match the ones above
// app.get('*', (req, res, next) => {
//     res.sendFile(path.join(__dirname, 'build/index.html'));
// });

exports.app = functions.https.onRequest(app);