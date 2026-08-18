const validate = (schema) => {
  return (req, res, next) => {
    try {
      /*
       * Joi schema can contain:
       *
       * {
       *   body: Joi.object(...),
       *   params: Joi.object(...),
       *   query: Joi.object(...)
       * }
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

      const { error, value } = schema.validate(
        validationTargets,
        {
          abortEarly: false,

          // Important:
          // Reject unexpected fields instead of silently
          // accepting them.
          allowUnknown: false,

          // Do not silently remove fields.
          stripUnknown: false,
        }
      );

      if (error) {
        return next(error);
      }

      /*
       * Joi may normalize values.
       * Put the validated values back into request.
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