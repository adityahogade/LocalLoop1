const Joi = require("joi");

const createSettlementSchema = Joi.object({
  period_start: Joi.date()
    .iso()
    .required(),

  period_end: Joi.date()
    .iso()
    .required(),
})
.custom((value, helpers) => {
  if (
    new Date(value.period_end) <
    new Date(value.period_start)
  ) {
    return helpers.message(
      "period_end must be greater than or equal to period_start"
    );
  }

  return value;
});

module.exports = {
  createSettlementSchema,
};