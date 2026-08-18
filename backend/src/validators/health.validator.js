const Joi = require("joi");

/**
 * Health API validation schema
 *
 * Currently the health endpoint does not accept
 * any request body, params, or query parameters.
 */
const healthSchema = {
    body: Joi.object({}).unknown(false),

    params: Joi.object({}).unknown(false),

    query: Joi.object({}).unknown(false),
};

module.exports = {
    healthSchema,
};