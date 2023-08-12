// const mongoose = require('mongoose');
const fs = require('fs');
const mongoose = require('mongoose')

require('dotenv').config()
const uri = process.env.uri

// console.log(uri)

async function main() {
  await mongoose.connect(uri).catch((e) => {
    console.log("Error in connection with database")
  })
}

module.exports = main