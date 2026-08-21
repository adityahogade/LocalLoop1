const settlementService = require("../services/providerSettlement.service");

/*
|--------------------------------------------------------------------------
| Get All Settlements
|--------------------------------------------------------------------------
*/

const getSettlements = async (req, res, next) => {
  try {
    const settlements =
      await settlementService.getSettlements(
        req.user.id
      );

    return res.status(200).json({
      success: true,
      message: "Settlements fetched successfully",
      data: settlements,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Settlement By ID
|--------------------------------------------------------------------------
*/

const getSettlementById = async (req, res, next) => {
  try {
    const settlement =
      await settlementService.getSettlementById(
        req.user.id,
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message: "Settlement fetched successfully",
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Create Settlement
|--------------------------------------------------------------------------
*/

const createSettlement = async (req, res, next) => {
  try {
    const settlement =
      await settlementService.createSettlement(
        req.user.id,
        req.body
      );

    return res.status(201).json({
      success: true,
      message: "Settlement requested successfully",
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettlements,
  getSettlementById,
  createSettlement,
};