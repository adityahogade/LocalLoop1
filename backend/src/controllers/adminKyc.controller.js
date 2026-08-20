const adminKycService = require("../services/adminKyc.service");

/*
|--------------------------------------------------------------------------
| Get Pending KYC
|--------------------------------------------------------------------------
|
| GET /api/admin/kyc
|
*/

const getPendingKyc = async (req, res, next) => {
  try {
    const result =
      await adminKycService.getPendingKycDocuments();

    return res.status(200).json({
      success: true,
      message: "Pending KYC documents fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Review KYC
|--------------------------------------------------------------------------
|
| PATCH /api/admin/kyc/:id/review
|
*/

const reviewKyc = async (req, res, next) => {
  try {
    const documentId = Number(req.params.id);
    const adminUserId = req.user.id;

    const {
      status,
      rejection_reason,
    } = req.body;

    const result =
      await adminKycService.reviewKycDocument(
        documentId,
        adminUserId,
        status,
        rejection_reason
      );

    return res.status(200).json({
      success: true,
      message: `KYC document ${status} successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingKyc,
  reviewKyc,
};