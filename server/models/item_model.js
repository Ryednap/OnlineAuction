const mongoose = require('mongoose');

const itemSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        default: "unknown"
    },
    description: {
        type: String,
        default: "",
    },
    basePrice: {
        type: Number,
        default: 0.0,
    },
    minSalePrice: {
        type: Number,
        default: 0.0
    },
});

const userItemRelation = mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    itemId: mongoose.Schema.Types.ObjectId,
    originalOwner: mongoose.Schema.Types.Boolean
});

const itemModel = mongoose.model('itemModel', itemSchema);
const userItemRelationModel = mongoose.model('userItemRelationModel', userItemRelation);

module.exports = { itemModel, userItemRelationModel };
