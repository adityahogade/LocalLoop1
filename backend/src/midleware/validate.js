const Joi = require("joi");

const validate = (schema) => {
  return (req, res, next) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Case 1: Direct Joi schema
      |--------------------------------------------------------------------------
      |
      | Example:
      |
      | validate(
      |   Joi.object({
      |     name: Joi.string().required()
      |   })
      | )
      |
      | In this case, validate req.body directly.
      |
      |--------------------------------------------------------------------------
      */

      if (Joi.isSchema(schema)) {
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: false,
        });

        if (error) {
          return res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Request validation failed",
              details: error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
              })),
            },
          });
        }

        req.body = value;

        return next();
      }

      /*
      |--------------------------------------------------------------------------
      | Case 2: Structured validation schema
      |--------------------------------------------------------------------------
      |
      | Example:
      |
      | {
      |   body: Joi.object(...),
      |   params: Joi.object(...),
      |   query: Joi.object(...)
      | }
      |
      |--------------------------------------------------------------------------
      */

      const validationTargets = {};

      if (schema.body) {
        validationTargets.body = req.body;
      }

      if (schema.params) {
        validationTargets.params = req.params;
      }

      if (schema.query) {
        validationTargets.query = req.query;
      }

      /*
      |--------------------------------------------------------------------------
      | Build Joi schema
      |--------------------------------------------------------------------------
      */

      const joiSchema = Joi.object(schema);

      const { error, value } = joiSchema.validate(
        validationTargets,
        {
          abortEarly: false,
          allowUnknown: false,
          stripUnknown: false,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Validation Error
      |--------------------------------------------------------------------------
      */

      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: error.details.map((detail) => ({
              field: detail.path.join("."),
              message: detail.message,
            })),
          },
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Put validated values back into request
      |--------------------------------------------------------------------------
      */

      if (value.body !== undefined) {
        req.body = value.body;
      }

      if (value.params !== undefined) {
        req.params = value.params;
      }

      if (value.query !== undefined) {
        req.query = value.query;
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = validate;