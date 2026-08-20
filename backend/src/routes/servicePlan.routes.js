const express = require('express');

const router = express.Router();

const controller = require('../controllers/servicePlan.controller');

const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');

const {
  createServicePlanSchema,
  updateServicePlanSchema,
} = require('../validators/servicePlan.validator');

router.use(authenticate);
router.use(authorize(['provider']));

router.get(
  '/:serviceId/plans',
  controller.listPlans
);

router.post(
  '/:serviceId/plans',
  validate(createServicePlanSchema),
  controller.createPlan
);

router.patch(
  '/:serviceId/plans/:id',
  validate(updateServicePlanSchema),
  controller.updatePlan
);

router.delete(
  '/:serviceId/plans/:id',
  controller.deletePlan
);

module.exports = router;