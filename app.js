const express = require('express');
const app = express();
const morgan = require('morgan'); // Logging
const bodyParser = require('body-parser');
const mongoose = require('mongoose')

const productsRoutes = require('./api/routes/products');
const ordersRoutes = require('./api/routes/orders');
const usersRoutes = require('./api/routes/users');

// connect to DB
console.log(process.env.MONGODB_PASSWORD);

mongoose.connect('mongodb://mongoDBAdmin:Admin123@ds211088.mlab.com:11088/node-rest-shop', function(err, db) {
    if (err) {
        console.log('Unable to connect to the server' + err);
        process.exit(1);
    } else {
        console.log('Connected to DB succesfully!')
    }
}); 

// 
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// handle CORS cross origin request
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", 
    "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    if (req.method === 'OPTIONS') {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
}); 

// Routes which handle requests
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
app.use('/users', usersRoutes);


// handle all request that comes here
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);    // this forward the request with this error
});

// General error handling
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = app;