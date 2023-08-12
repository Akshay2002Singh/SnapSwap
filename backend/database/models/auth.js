const mongoose = require('mongoose')
const { Schema } = mongoose;

const authSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        index : true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password : {
        type : String,
        required : true
    }
});

authSchema.index({ email : 1 });

const AuthModel = mongoose.model('AuthModel', authSchema);

module.exports = AuthModel