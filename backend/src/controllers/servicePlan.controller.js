const servicePlanService = require("../services/servicePlan.service");

const getProviderId = async (req) => {
  return servicePlanService.getProviderIdByUserId(req.user.id);
};

/*
|--------------------------------------------------------------------------
| GET /api/v1/provider/services/:serviceId/plans
|--------------------------------------------------------------------------
*/

const listPlans = async (req, res, next) => {
  try {
    const providerId = await getProviderId(req);
    const { serviceId } = req.params;

    const plans = await servicePlanService.listPlans(
      providerId,
      serviceId
    );

    return res.status(200).json({
      success: true,
      message: "Service plans fetched successfully",
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| POST /api/v1/provider/services/:serviceId/plans
|--------------------------------------------------------------------------
*/

const createPlan = async (req, res, next) => {
  try {
    const providerId = await getProviderId(req);
    const { serviceId } = req.params;

    const plan = await servicePlanService.createPlan(
      providerId,
      serviceId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Service plan created successfully",
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| PATCH /api/v1/provider/services/:serviceId/plans/:id
|--------------------------------------------------------------------------
*/

const updatePlan = async (req, res, next) => {
  try {
    const providerId = await getProviderId(req);
    const { serviceId, id } = req.params;

    const plan = await servicePlanService.updatePlan(
      providerId,
      serviceId,
      id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Service plan updated successfully",
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| DELETE /api/v1/provider/services/:serviceId/plans/:id
|--------------------------------------------------------------------------
*/

const deletePlan = async (req, res, next) => {
  try {
    const providerId = await getProviderId(req);
    const { serviceId, id } = req.params;

    const result = await servicePlanService.deletePlan(
      providerId,
      serviceId,
      id
    );

    return res.status(200).json({
      success: true,
      message: "Service plan deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
};