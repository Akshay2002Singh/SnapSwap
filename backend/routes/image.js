const express = require('express')
const router = express.Router()
const multer = require('multer')
const fetchUser = require('../middleware/fetchuser')
const ImageModel = require('../database/models/Images')
const TagModel = require('../database/models/tags')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const storage = multer.diskStorage({
    destination: './static/images/',
    filename: function (req, file, cb) {
        cb(null, uuidv4() + '-' + Date.now() + path.extname(file.originalname));
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
        title: req.body.title,
        path: req.file.path,
        username: req.header.username
    }).catch((error) => {
        res.json({
            'msg': "image not saved"
        })
    })
    JSON.parse(req.body.tags).forEach((element) => {
        TagModel.create({
            tag: element,
            path: req.file.path
        }).catch(e => console.log(e))
    });

    res.json({
        'msg': "image saved"
    })
})


router.get('/getImages', async (req, res) => {
    let page = req.query.page;
    const data = await ImageModel.find({}).catch((e) => {
        return res.status(400).json({
            'msg': "error"
        })
    })
    var new_data = []
    for (let i = (page * 10); i < ((page + 1) * 10) && i < data.length; ++i) {
        new_data.push(data[i])
    }
    res.json({
        data: new_data,
        morePage: ((page + 1) * 10) < data.length
    })
})

router.post('/search', async (req, res) => {
    // find paths of image 
    // console.log(typeof(req.body.val))
    const data = await TagModel.find(
        {
            tag: { $in: JSON.parse(req.body.val) }
        }, { path: 1, _id: 0 })
        .catch((e) => {
            return res.status(400).json({
                'msg': "error"
            })
        })

    if (!data) {
        return res.json({
            'msg': "data not found"
        })
    }
    // find count 
    try {
        var obj = {}

        data.forEach(element => {
            if (Object.keys(obj).indexOf(element.path) === -1) {
                obj[element.path] = 1
            } else {
                obj[element.path] = obj[element.path] + 1
            }
        });

        // sort 

        obj = Object.entries(obj).sort((a, b) => b[1] - a[1]);

        // make list of paths 
        let pathList = obj.map((element) => {
            return element[0]
        })

        const finalData = await ImageModel.find(
            {
                path: { $in: pathList }
            })
            .catch((e) => {
                return res.status(400).json({
                    'msg': "error"
                })
            })

        res.json({
            data: finalData,
            msg: "data found"
        })
    } catch (error) {
        return res.status(400).json({
            'msg': "error"
        })
    }
})

module.exports = router