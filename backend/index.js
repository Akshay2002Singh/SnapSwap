const express = require('express')
var cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3003
const connect_to_database = require('./database/connect')
const staticWatermarkMiddleware = require('./middleware/staticWatermark')

// data base connection 
connect_to_database().catch(err => console.log(err))

app.use(express.json());
app.use(cors())

app.use(staticWatermarkMiddleware)
app.use('/static', express.static('static'))

// routes 
app.use('/',require('./routes/basic'))
app.use('/api/auth',require('./routes/auth'))
app.use('/api/images',require('./routes/image'))


app.listen(port,()=>{
    console.log(`Backend of linktree listening at http://localhost:${port}`)
})