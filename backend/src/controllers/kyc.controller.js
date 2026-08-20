const { sequelize } = require("../config/database");
const kycService = require("../services/kyc.service");

/*
|--------------------------------------------------------------------------
| Get Provider ID From Authenticated User
|--------------------------------------------------------------------------
*/

const getProviderId = async (userId) => {
  const [providers] = await sequelize.query(
    `
      SELECT id
      FROM providers
      WHERE user_id = :userId
      LIMIT 1
    `,
    {
      replacements: {
        userId,
      },
    }
  );

  if (!providers.length) {
    throw new Error("Provider profile not found");
  }

  return providers[0].id;
};

/*
|--------------------------------------------------------------------------
| Submit KYC Document
|--------------------------------------------------------------------------
|
| POST /api/providers/kyc
|
*/

const submitKyc = async (req, res, next) => {
  try {
    const providerId = await getProviderId(req.user.id);

    const result = await kycService.submitDocument(
      providerId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "KYC document submitted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get My KYC Documents
|--------------------------------------------------------------------------
|
| GET /api/providers/kyc
|
*/

const getMyKycDocuments = async (req, res, next) => {
  try {
    const providerId = await getProviderId(req.user.id);

    const result =
      await kycService.getProviderDocuments(providerId);

    return res.status(200).json({
      success: true,
      message: "KYC documents fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitKyc,
  getMyKycDocuments,
};