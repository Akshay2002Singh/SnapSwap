const express = require('express')
const { body, validationResult } = require('express-validator')
const router = express.Router()
const auth = require('../database/models/auth')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// jwt secret 
const JWT_SECRET = process.env.JWT_SECRET || 'Rapid'

router.post('/signup',
    body('email').trim().notEmpty().isEmail(),
    body('username').trim().notEmpty(),
    body('password').trim().notEmpty(),
    async (req, res) => {
        try {
            // find error in validation and send 
            const result = validationResult(req);
            if (!result.isEmpty()) {
                return res.json({
                    'error': "Validation error",
                    'errors_array': result.array(),
                    'userCreated': false
                })
            }
            
            // Check if username already exists
            const existingUser = await auth.findOne({ username: req.body.username })
            if (existingUser) {
                return res.json({
                    'error': "Username already exists",
                    'userCreated': false
                })
            }
            
            // Check if email already exists
            const existingEmail = await auth.findOne({ email: req.body.email })
            if (existingEmail) {
                return res.json({
                    'error': "Email already exists",
                    'userCreated': false
                })
            }
            
            // generate salt 
            const salt = bcrypt.genSaltSync(10);
            const hashPassword = await bcrypt.hash(req.body.password, salt)

            // create entry in auth model
            await auth.create({
                username: req.body.username,
                email: req.body.email,
                password: hashPassword
            });

            res.json({
                'userCreated': true
            })
        } catch (error) {
            console.error("Signup error:", error)
            res.status(500).json({
                'error': "Server error. Please try again later.",
                'userCreated': false
            })
        }
    })


router.post('/signin',
    body('username').trim().notEmpty(),
    body('password').trim().notEmpty(),
    async (req, res) => {
        // find error in validation and send 
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.json({
                'error': "Validation error",
                'errors_array': result.array()
            })
        }

        const user = await auth.findOne({
            username: req.body.username
        })

        if (!user) {
            return res.json({
                error: "invalid user"
            })
        }

        const is_valid_password = await bcrypt.compare(req.body.password, user.password)

        if (is_valid_password) {
            const data = {
                'username': user.username
            }
            const authToken = jwt.sign(data, JWT_SECRET, { expiresIn: "1d" })
            // console.log(authToken)
            res.json({
                'authToken': authToken
            })
        } else {
            res.json({
                error: "invalid password"
            })
        }
    })


router.post('/isValidUser', async (req, res) => {
    const user = await auth.findOne({ username: req.body.username })
    // console.log(user)
    if (!user) {
        return res.json({
            'valid': true
        })
    } else {
        return res.json({
            'valid': false
        })
    }
})

router.post('/isValidEmail', async (req, res) => {
    const user = await auth.findOne({ email: req.body.email }).catch(err => res.json({ "error": err }))
    if (!user) {
        return res.json({
            'valid': true
        })
    } else {
        return res.json({
            'valid': false
        })
    }
})


module.exports = router