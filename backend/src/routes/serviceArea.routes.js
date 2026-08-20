const express = require('express');

const router = express.Router();

const controller = require('../controllers/serviceArea.controller');

const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');

const {
  createServiceAreaSchema,
  updateServiceAreaSchema,
} = require('../validators/serviceArea.validator');

router.use(authenticate);
router.use(authorize(['provider']));

router.get(
  '/',
  controller.listAreas
);

router.post(
  '/',
  validate(createServiceAreaSchema),
  controller.createArea
);

router.patch(
  '/:id',
  validate(updateServiceAreaSchema),
  controller.updateArea
);

router.delete(
  '/:id',
  controller.deleteArea
);

module.exports = router;