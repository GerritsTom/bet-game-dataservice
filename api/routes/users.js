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
            return res.json({
                success: false,
                message: 'Account existiert bereits.'
            });
        } else {
            bcrypt.hash(req.body.password, null, null, (err, hash) => {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Anmeldung fehlgeschlagen.'
                    });
                } else {
                    const user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        email: req.body.email,
                        password: hash
                    });
                    user.save()
                    .then(result => {
                        res.json({
                            success: true,
                            token: hash,
                            message: 'Benutzer ist angelegt'
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.json({
                            success: false,
                            message: 'Fehler bei der Anmeldung aufgetreten.'
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
            return res.json({
                success: false,
                message: 'Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Eingabe.'
            });
        }
        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Anmeldung fehlgeschlagen.'
                }); 
            }
            if (result) {
                const token = jwt.sign({
                    email: user[0].email,   
                    userId: user[0]._id
                },  'secret', {
                    expiresIn: "1h"    
                });
                return res.json({
                    success: true,
                    message: 'Anmeldung erfolgreich.',
                    token: token
                });         
            }
        });
    })
    .catch(err => {
        res.json({
            success: false,
            message: 'Fehler bei der Anmeldung aufgetreten.'
        })
    });
});


router.post('/forgot', (req, res, next) => {
    async.waterfall([
        function(done) {  
            crypto.randomBytes(20, (err, buf) => {
                var token = buf.toString('hex');
                done(err, token);
            });        
        },
        function(token, done) {
            User.findOne({email: req.body.email}, (err, user) => {
                if (!user || user.length < 1) {
                    return res.json({
                        success: false,
                        message: 'Anmeldung fehlgeschlagen.'
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
                secure: false,
                auth: {
                    user: process.env.USER,
                    pass: process.env.PASSWORD
                }
            });
            var mailOptions = {
                to: user.email,
                from: process.env.USER,
                subject: 'Christ Tippspiel WM 2018 Kennwort zurücksetzen',
                text: 
                'Sie haben Ihr Kennwort vergessen!\n'+
                'Klicken Sie diesen Link, und geben Sie ein neues Kennwort ein.\n\n'+
                'http://' + req.headers.host + '/reset/' + token + '\n\n\n\n'+
                'Diese Link ist nur eine Stunde gültig.'    
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                if (!err) {
                    return res.json({
                        success: true,
                        message: 'An diese Adresse '+user.email+' ist ein Email geschickt worden. '
                    });
                }    
                done(err, 'done')
            });
        }
    ], (err) => {
        if (err) {
            return res.json({
                succes: false,
                message: err.response
            });
        }
    });    
});

router.post('/reset', (req, res, next) => {
    async.waterfall([
        function(done) {
            // resetPasswordExpires: {$gt: Date.now()}
            User.findOne({resetPasswordToken: req.body.token}, function(err, user) {
                if (!user) {
                    return res.json({
                        succes: false,
                        message: 'Anmeldung fehlgeschlagen oder Token ist abgelaufen!'
                    });  
                }

                bcrypt.hash(req.body.password, null, null, (err, hash) => {
                    if (err) {
                        return res.json({
                            succes: false,
                            message: 'Anmeldung fehlgeschlagen!'
                        });
                    } else {
                        user.password = hash;
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        user.save(function(err) {
                            done(err, user);
                        });
                    }
                });
            });
        },
        function(user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                secure: false,
                auth: {
                    user: process.env.USER,
                    pass: process.env.PASSWORD
                }
            });
            var mailOptions = {
                to: user.email,
                from: process.env.USER,
                subject: 'Kennwort Christ Tippspiel ist geändert',
                text:
                'Hallo,\n\n'+
                'Sie haben Ihr Kennwort erfolgreich geändert.'
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                res.status(200).json({
                    success: true,
                    message: 'Kennwort ist geändert.'
                });    
                done(err, 'done')
            });
        }
    ], function(err) {  
        if (err) {
            return res.json({
                succes: false,
                message: err.response
            });
        }
    });
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