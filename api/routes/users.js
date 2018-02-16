const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const User = require('../models/user');

router.post('/signup', (req, res, next) => {
    // Check if user exists
    User.find({email: req.body.email})
    .exec()
    .then(user => {
        if (user.length >= 1) {
            return res.status(409).json({
                message: 'User already exists'
            });
        } else {
            console.log('in hash....')
            bcrypt.hash(req.body.password, null, null, (err, hash) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        error: err
                    });
                } else {
                    const user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        email: req.body.email,
                        password: hash
                    });
                    user.save()
                    .then(result => {
                        res.status(201).json({
                            message: 'User created'
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            error: err
                        });
                    });
                }
            });
        }
    })
});

router.post('/login', (req, res, next) => {
    // Check if user exists
    User.find({email: req.body.email})
    .exec()
    .then(user => {
        if (user.length < 1) {
            return res.status(401).json({
                message: 'Authentication failed'
            });
        } 
        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
            if (err) {
                return res.status(401).json({
                    message: 'Authentication failed'
                }); 
            }
            if (result) {
                const token = jwt.sign({
                    email: user[0].email,   
                    userId: user[0]._id
                },  'secret', {
                    expiresIn: "1h"    
                });
                return res.status(200).json({
                    message: 'Authentication succesful',
                    token: token
                });         
            }
            res.status(401).json({
                message: 'Authentication failed'
            });         
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err})
    });
});


router.post('/forgot', (req, res, next) => {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, (err, buf) => {
                var token = buf.toString('hex');
                console.log('token');
                console.log(token);
                done(err, token);
            });        
        },
        function(token, done) {
            User.findOne({email: req.body.email}, (err, user) => {
                if (!user || user.length < 1) {
                    return res.status(500).json({
                        error: err
                    });
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; 

                user.save((err) => {
                    done(err, token, user);
                }); 
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'tippspielwm2018@gmail.com',
                    pass: '19Amsterdam65!'
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'tippspielwm2018@gmail.com',
                subject: 'Passport Reset Tippspiel WM 2018',
                text: 'dfgdfgdgdfgd'    
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                console.log('mail sent');
                done(err, 'done')
            });
        }
    ], (err) => {
        if (err) {
            return res.status(500).json({
                error: err
            });
        }
    });    
});

router.get('/reset/:token', (req, res, next) => {
    User.findOne({resetPasswordToken: req.params.token});
    if (!user) {

    }
});

router.post('/reset/:token', (req, res, next) => {
    async.waterfall([
        function(done) {
            User.findOne({resetPasswordToken: req.params.token});
        	if (!user) {
                return;
            }
            if (req.body.password === req.body.confirm) {
                user.set
            }
        }
    ]);
});



router.delete("/:userId", (req, res, next) => {
    Product.remove({_id: req.params.id})
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'User deleted'
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: err})
        });
});

module.exports = router;