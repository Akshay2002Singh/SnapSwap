const mongoose = require('mongoose')
const { Schema } = mongoose;

const imageSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    path: {
        type: String,
        required: true,
        unique: true,
        index : true
    },
    watermarkPath: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    username : {
        type : String,
        required : true
    },
    fileType: {
        type: String,
        enum: ['image', 'video'],
        default: 'image',
        required: true
    }
});


const ImageModel = mongoose.model('ImageModel', imageSchema);

module.exports = ImageModel