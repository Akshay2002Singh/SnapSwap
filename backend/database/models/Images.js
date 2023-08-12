const mongoose = require('mongoose')
const { Schema } = mongoose;

const imageSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index : true
    },
    path: {
        type: String,
        required: true,
        unique: true
    },
    username : {
        type : String,
        required : true
    }
});


const ImageModel = mongoose.model('ImageModel', imageSchema);

module.exports = ImageModel