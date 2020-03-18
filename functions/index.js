const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const admin = require('firebase-admin');

const authService = require('./services/auth');

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://meditation-app-34538.firebaseio.com"
});
const auth = admin.auth();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: true }));

function mapUser(user) {
    const customClaims = user.customClaims || { role: '' };
    const role = customClaims.role ? customClaims.role : '';

    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        role,
        lastSignInTime: user.metadata.lastSignInTime,
        creationTime: user.metadata.creationTime
    }
}

function handleError(res, err) {
    return res.status(500).send({ message: `${err.code} - ${err.message}` });
}

// Users List
app.get('/users',
    authService.isAuthenticated,
    authService.isAuthorized({ hasRole: ['admin'] }),
    (req, res) => {
        const maxResults = 1000; // optional arg.

        auth.listUsers(maxResults).then((userRecords) => {
            res.json(userRecords);
            res.end();
        }).catch((error) => console.log(error));
    }
);

// Create a user
app.post('/users',
    authService.isAuthenticated,
    authService.isAuthorized({ hasRole: ['admin'] }),
    async (req, res) => {
        try {
            const { password, email, displayName, role } = req.body;

            if (!password || !email || !role || !displayName) {
                return res.status(400).send({ message: 'Missing fields' });
            }

            const { uid } = await admin.auth().createUser({
                email,
                password
            });
            await admin.auth().setCustomUserClaims(uid, { role });

            return res.status(201).send({ uid });

        } catch (err) {
            return res.status(500).send({
                message: `${err.code} - ${err.message}`
            });
        }
    }
);

// get :id user
app.get('/users/:id',
    authService.isAuthenticated,
    authService.isAuthorized({ hasRole: ['admin'] }),
    async (req, res) => {
        try {
            const { id } = req.params;
            const user = await admin.auth().getUser(id);
            return res.status(200).send({ user: mapUser(user) });
        } catch (err) {
            return handleError(res, err);
        }
    }
);

// update :id user
app.patch('/users/:id',
    authService.isAuthenticated,
    authService.isAuthorized({ hasRole: ['admin'] }),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { password, email, role, displayName } = req.body;

            if (!id || !email || !role || !displayName) {
                return res.status(400).send({ message: 'Missing fields' });
            }

            await admin.auth().updateUser(id, { email, displayName });

            if (Boolean(password) === true)
                await admin.auth().updateUser(id, { password });

            await admin.auth().setCustomUserClaims(id, { role });

            const user = await admin.auth().getUser(id);

            return res.status(204).send({ user: mapUser(user) });
        } catch (err) {
            return handleError(res, err);
        }
    }
);

// update :id user
app.delete('/users/:id',
    authService.isAuthenticated,
    authService.isAuthorized({ hasRole: ['admin'] }),
    async (req, res) => {
        try {
            const { id } = req.params;
            await admin.auth().deleteUser(id);
            return res.status(204).send({});
        } catch (err) {
            return handleError(res, err);
        }
    }
);

exports.app = functions.https.onRequest(app);