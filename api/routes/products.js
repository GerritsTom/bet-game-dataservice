const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const mongoose = require('mongoose');
const checkAuth = require('../middleware/check-auth');

router.get("/", (req, res, next) => {
   Product.find()
   .select('name price _id')
   .exec()
   .then(docs => {
        const response = {
            count: docs.lenght,
            products: docs.map(doc => {
                return {
                    name: doc.name,
                    pric: doc.price,
                    _id: doc._id,
                    request: {
                        type: "GET",
                        url: "http://localhost:3000/products/" + doc._id
                    } 
                }    
            })
        }
        res.status(200).json(response);
   })
   .catch(err => {
       console.log(err);
       res.status(500).json({message: 'No products found'});
   });
});

router.get("/:productId", (req, res, next) => {
    Product.findById(req.params.productId)
    .exec((err, product) => {
        if (err) {
            res.status(404).json({
                messages: 'No valid entry found for provided ID',
                error: err
            });    
        } else {
            res.status(200).json({
                product: product,
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/products'
                }
            })
        }
    });

/*
    Product.findById(req.params.productId)
    .select('name price _id')
    .exec()
    .then(doc => {
        console.log('doc')
        console.log(doc);
        if (doc) {
            res.status(200).json({
                product: doc,
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/products'
                }
            })
        } else {
            res.status(404).json({messages: 'No valid entry found for provided ID'});        
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err})
    }); */
});

router.post("/", checkAuth, (req, res, next) => {
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price
    });
    
    product.save()
        .then(result => {
            res.status(201).json({
                message: 'Created product successfully',
                createdProduct: {
                    name: result.name,
                    price: result.price,
                    _id: result._id,
                    request: {
                        type: 'GET',
                        url: "http://localhost:3000/products/" + result._id
                    }
                }
            });        
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err});
    });
});

router.patch("/:productId", checkAuth, (req, res, next) => {
    const id = req.params.productId;
    const updateOps = {};
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }

    Product.update({_id: id}, {$set:updateOps})
    .exec()
    .then(result => {
        res.status(200).json({
            message: 'Product updated',
            request: {
                type: 'GET',
                url: 'http://localhost:3000/products/'+ id
            }
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err})
    });
});

router.delete("/:productId", checkAuth, (req, res, next) => {
    const id = req.params.productId;
    Product.remove({_id: id})
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'Product deleted',
                request: {
                    type: 'POST',
                    url: 'http://localhost:3000/products',
                    body : {name: 'String', price: 'Number'}    
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: err})
        });
});

module.exports = router;