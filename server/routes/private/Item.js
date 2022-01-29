'use strict';

const express = require('express');

const {itemModel, userItemRelationModel} = require('../../models/item_model');
const {auctionModel} = require('../../models/auction_model');
const itemRouter = express.Router({caseSensitive: true, strict: true});

/**
 * [Add new item to the list]
 * @required [Header Body]
 * req.body.name : itemName
 * req.body.type: type of item
 * req.body.description: description for the item
 * basePrice: base price for item
 * minSalePrice: [optional] minimum sale price for the item
 * auctionId: id of the auction to post the listing
 *
 * Verified
 */

itemRouter.post('/api/add', async (req, res) => {
    /**
     * @type {{name, minSalePrice: (number|{default: number, type: Number | NumberConstructor}|*),
     * description, type, basePrice: ({default: number, type: Number | NumberConstructor}|*)}}
     */
    const itemDoc = {
        name: req.body.name,
        type: req.body.type,
        description: req.body.description,
        basePrice: req.body.basePrice,
        minSalePrice: req.body.minSalePrice ? req.body.minSalePrice : 0.0
    };

    itemModel.create(itemDoc).then((doc) => {
        const id = doc._id;

        const userItemRelationDoc = {
            userId: req.user._id,
            itemId: id,
            originalOwner: true
        };
        userItemRelationModel.create(userItemRelationDoc).then(r => {
            const auctionId = req.body.auctionId;

            auctionModel.findOneAndUpdate(
                {_id: auctionId},
                {$addToSet: {
                    itemListing: id
                    }}
            ).then(success => {
                console.log(success);
                res.status(200).json({});
            });
        });
    }).catch ((error) => {
        console.log(error);
        res.status(500).json({});
    });

});

// TODO: Implement following routes
itemRouter.delete('/api/remove', (req, res) => {
    const itemId = req.body.id;
    itemModel.findOneAndDelete({_id : itemId}).then(r => {
        console.log(r);
        res.status(200).json({
            message: 'Deleted',
            doc: r
        });
    }).catch (err => {
        console.log(err);
        return res.status(200).json({
            err: err
        })
    })
});

itemRouter.patch('/api/update/', (req, res) => {
    const itemId = req.body.id;
    const patchDetails = req.body.patch;
    itemModel.updateOne({_id: itemId}, patchDetails).then(r => {
        if (r.acknowledged) return res.status(200).json ({message: 'Updated '});
        return res.status(404).json({message: 'Error updating details'});
    }).catch (err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    })
});

itemRouter.get('/api/get/:itemId', (req, res) => {
    const itemId = req.params.itemId;
    itemModel.findOne({_id: itemId}).then((doc) => {
        return res.status(200).json(doc);
    }).catch (err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    })
});

module.exports = itemRouter;
