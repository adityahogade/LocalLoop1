const servicePlanService = require('../services/servicePlan.service');

const listPlans = async (req, res, next) => {
  try {
    const providerId = req.user.provider_id;
    const { serviceId } = req.params;

    const plans = await servicePlanService.listPlans(
      providerId,
      serviceId
    );

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

const createPlan = async (req, res, next) => {
  try {
    const providerId = req.user.provider_id;
    const { serviceId } = req.params;

    const plan = await servicePlanService.createPlan(
      providerId,
      serviceId,
      req.body
    );

    res.status(201).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const providerId = req.user.provider_id;
    const { serviceId, id } = req.params;

    const plan = await servicePlanService.updatePlan(
      providerId,
      serviceId,
      id,
      req.body
    );

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const providerId = req.user.provider_id;
    const { serviceId, id } = req.params;

    const result = await servicePlanService.deletePlan(
      providerId,
      serviceId,
      id
    );

    res.status(200).json({
      success: true,
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