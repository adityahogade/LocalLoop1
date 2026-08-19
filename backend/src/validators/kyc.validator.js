const Joi = require("joi");

/*
|--------------------------------------------------------------------------
| Submit KYC Document
|--------------------------------------------------------------------------
*/

const createKycDocumentSchema = {
  body: Joi.object({
    document_type: Joi.string()
      .valid(
        "id_proof",
        "address_proof",
        "bank_proof",
        "business_license",
        "other"
      )
      .required(),

    file_url: Joi.string()
      .trim()
      .uri()
      .max(255)
      .required(),
  }).required(),
};

/*
|--------------------------------------------------------------------------
| KYC Document ID
|--------------------------------------------------------------------------
*/

const kycDocumentIdSchema = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  }).required(),
};

/*
|--------------------------------------------------------------------------
| Review KYC Document
|--------------------------------------------------------------------------
*/

const reviewKycDocumentSchema = {
  params: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
  }).required(),

  body: Joi.object({
    status: Joi.string()
      .valid("approved", "rejected")
      .required(),
  }).required(),
};

module.exports = {
  createKycDocumentSchema,
  kycDocumentIdSchema,
  reviewKycDocumentSchema,
};