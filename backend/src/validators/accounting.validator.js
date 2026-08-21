const Joi = require("joi");

const accountingSummarySchema = {
  query: Joi.object({
    period: Joi.string()
      .valid(
        "today",
        "yesterday",
        "week",
        "month",
        "year",
        "custom"
      )
      .required(),

    from: Joi.date()
      .iso()
      .when("period", {
        is: "custom",
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),

    to: Joi.date()
      .iso()
      .when("period", {
        is: "custom",
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
  }).required(),
};

module.exports = {
  accountingSummarySchema,
};