const admin = require('firebase-admin');

exports.isAuthenticated = async function (req, res, next) {
    const { authorization } = req.headers;

    if (!authorization) return res.status(401).send({ message: 'Unauthorized' });

    if (!authorization.startsWith('Bearer'))
        return res.status(401).send({ message: 'Unauthorized' });

    const split = authorization.split('Bearer ');
    if (split.length !== 2)
        return res.status(401).send({ message: 'Unauthorized' });

    const token = split[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        res.locals = {
            ...res.locals,
            uid: decodedToken.uid,
            role: decodedToken.role,
            email: decodedToken.email
        };
        return next();
    } catch (err) {
        console.error(`${err.code} -  ${err.message}`)
        return res.status(401).send({ message: 'Unauthorized' });
    }
}

exports.isAuthorized = function ({ hasRole }) {
    return (req, res, next) => {
        const { role, email, uid } = res.locals;
        const { id } = req.params;

        if (id && uid === id) return next();

        if (!role) return res.status(403).send();
        
        if (hasRole.includes(role)) return next();

        return res.status(403).send();
    }
}