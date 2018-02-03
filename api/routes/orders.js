const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const checkAuth = require('../middleware/check-auth');

router.get("/", (req, res, next) => {
    Order.find()
    .select('product quantity _id')
    .populate('product', 'name')
    .exec()
    .then(docs => {
        res.status(200).json({
            count: docs.length,
            orders: docs.map(doc => {
                return {
                    _id: doc._id,
                    product: doc.product,
                    quantity: doc.quantity,
                    request: {
                        type: 'GET',
                        url: 'http:localhost:3000/orders/' + doc._id
                    }
                }
            })
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json(err);
    });
});

router.get("/:orderId", checkAuth, (req, res, next) => {
    Order.findById(req.params.orderId)
    .populate('product')
    .exec((err, order) => {
        if (err) {
            res.status(404).json({
                messages: 'No valid entry found for provided ID',
                error: err
            });    
        } else {
            res.status(200).json({
                order: order,
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/orders'
                }
            })
        }
    });
});

router.post("/", checkAuth, (req, res, next) => {
    // check if product exists
    Product.findById(req.body.productId)
    .then(product => {
        console.log(product);
        if (!product) {
            return res.status(404).json({
                message: 'Product not found!'
            });
        }
        const order = new Order({
            _id: mongoose.Types.ObjectId(),
            quantity : req.body.quantity,
            product: req.body.productId
        });
        order.save().then(result => {
            res.status(201).json({
                message: 'Order stored successfully',
                createdOrder: {
                    _id: result._id,
                    product: result.product,
                    quantity: result.quantity,
                    request: {
                        type: 'GET',
                        url: "http://localhost:3000/orders/" + result._id
                    }
                }
            });
        });
    })
    .catch(err => {
        res.status(500).json({
            message: 'Product not found',
            error: err
        });
    });
});

router.delete("/:orderId", checkAuth, (req, res, next) => {
    Product.remove({_id: req.body.orderId})
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'Order deleted',
                request: {
                    type: 'POST',
                    url: 'http://localhost:3000/orders'
                }
            });
        })
        .catch(err => {
            res.status(500).json({error: err})
        });
});

module.exports = router;