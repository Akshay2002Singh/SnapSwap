const jwt = require('jsonwebtoken')

const fetchUser = (req,res,next) => {
    const JWT_SECRET = 'Rapid';
    const token = req.header('authToken');
    if(!token){
        res.status(401).json({
            'error' : "invalid request"
        })
    }
    // console.log("fetch user")
    const data = jwt.verify(token,JWT_SECRET);
    req.body.username = data.username;
    req.header.username = data.username;
    next()
}

module.exports = fetchUser