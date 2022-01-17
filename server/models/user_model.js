const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    userName: {
        type: String,
        min: 6,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        min: 8,
    },
    role: {
        type: String,
        required: true,
    },
    accountCreationDate: {
        type: Date,
        required: false,
        default: Date.now()
    }
});

userSchema.statics.assertUnique = async function (user) {
    try {
        const userNameQuery = await mongoose.model('UserModel').findOne({ userName: user.userName });
        const emailQuery = await mongoose.model('UserModel').findOne({ email: user.email });
        return !(userNameQuery || emailQuery);

    } catch (err) {
        throw new Error(err.message);
    }
};


module.exports = mongoose.model('UserModel', userSchema);