const express = require('express')
const router = express.Router()

router.get('/',(req,res)=>{
    res.json({
        "msg" : "Server is working"
    })
})

module.exports = router