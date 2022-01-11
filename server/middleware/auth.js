const jwt = require('jsonwebtoken');

function validateToken(req, res, next) {
    const token = req.body.token || req.headers['x-access-token'];
    if (!token) {
        return res.status(401).json({
            message: 'Unauthorized Request',
            error: 'Invalid Login state Please Login again!!'
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        req.user = decoded;

    } catch (err) {
        res.status(500).json({
            message: 'Error validating user',
            error: err
        });
    }
    next();
}

module.exports = { validateToken };