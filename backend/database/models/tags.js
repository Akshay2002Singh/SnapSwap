const mongoose = require('mongoose')
const { Schema } = mongoose;

const authSchema = new Schema({
    tag: {
        type: String,
        required: true,
        index : true
    },
    name: {
        type: String,
        required: true,
    }
});


const ImageModel = mongoose.model('ImageModel', authSchema);

module.exports = ImageModel