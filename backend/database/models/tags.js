const mongoose = require('mongoose')
const { Schema } = mongoose;

const tagModel = new Schema({
    tag: {
        type: String,
        required: true,
        index : true
    },
    path: {
        type: String,
        required: true,
    }
});


const TagModel = mongoose.model('TagModel', tagModel);

module.exports = TagModel