const Joi = require('joi');
/**
 * @type {Joi.ObjectSchema<any>}
 */
const registerSchema = Joi.object({
    userName: Joi.string()
        .alphanum()
        .min(6)
        .required(),

    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: ['com', 'co.in', 'net'] })
        .required(),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .min(8)
        .required(),

    role: Joi.string()
        .required()
});

/**
 *
 * @type {Joi.ObjectSchema<any>}
 */
const loginSchema = Joi.object({
    userName: Joi.string()
        .alphanum()
        .min(6)
        .required(),

    password: Joi.string()
        .min(8)
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .required(),

    role: Joi.string()
        .required()
});

/**
 *
 * @type {Joi.ObjectSchema<any>}
 */
const settingPatchSchema = Joi.object({
    userName: Joi.string()
        .alphanum()
        .min(6),

    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: ['com', 'co.in', 'net'] }),

    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .min(8),

    role: Joi.string()
});

/**
 *
 * @param user
 * @returns {Promise<{error: undefined, warning?: Joi.ValidationError, value: *}|{error: Joi.ValidationError, warning?: Joi.ValidationError, value: undefined}>}
 */
async function registerValidation(user) {
    return { error, value } = registerSchema.validate(user);

}

/**
 *
 * @param user
 * @returns {Promise<{error: undefined, warning?: Joi.ValidationError, value: *}|{error: Joi.ValidationError, warning?: Joi.ValidationError, value: undefined}>}
 */
async function loginValidation(user) {
    return { error, value } = loginSchema.validate(user);
}

/**
 *
 * @param data
 * @returns {Promise<{error: undefined, warning?: Joi.ValidationError, value: *}|{error: Joi.ValidationError, warning?: Joi.ValidationError, value: undefined}>}
 */
async function settingPatchValidation(data) {
    return { error, value } = settingPatchSchema.validate(data);
}

module.exports = { registerValidation, loginValidation, settingPatchValidation };