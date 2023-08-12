const express = require('express')
const router = express.Router()
const multer = require('multer')
const fetchUser = require('../middleware/fetchuser')
const ImageModel = require('../database/models/Images')

const storage = multer.diskStorage({
    destination: './static/images/',
    filename: function (req, file, cb) {
        cb(null, file.filename);
        // cb(null, `${req.header.username}.${file.mimetype.split('/')[1]}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const upload = multer({ storage, fileFilter })

router.post('/upload', fetchUser, upload.single("photo"), async (req, res) => {
    await ImageModel.create({
        name : req.file.name,
        path : req.file.path,
        tag : req.body.tag
    }).catch((e) => {
        res.status(400).json({
            'msg': "image not saved"
        })
    })
    res.json({
        'msg': "image saved"
    })
})

router.get('/getImages', async (req, res) => {
    const data = await ImageModel.find({    }).catch((e) => {
        res.status(400).json({
            'msg': "error"
        })
    })
    res.json(data)
})

module.exports = router