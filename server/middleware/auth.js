const jwt = require('jsonwebtoken');


function validateTokenWS(token) {
    try {
        return jwt.verify(token, process.env.TOKEN_KEY);
    } catch (error) {
        throw error;
    }
}

function validateToken(req, res, next) {
    const token = req.body.token || req.headers['x-access-token'];
    if (!token) {
        return res.status(401).json({
            message: 'Unauthorized Request',
            error: 'Invalid Login state Please Login again!!'
        });
    }
    try {
        req.user = jwt.verify(token, process.env.TOKEN_KEY);
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: 'Error validating user',
            error: err
        });
    }
    next();
}

module.exports = { validateToken, validateTokenWS};