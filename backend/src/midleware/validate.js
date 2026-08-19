const Joi = require("joi");

const validate = (schema) => {
  return (req, res, next) => {
    try {
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
      | Build Joi schema from validation targets
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

      if (error) {
        return next(error);
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