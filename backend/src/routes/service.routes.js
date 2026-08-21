const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/service.controller"
);

const authenticate = require(
  "../midleware/auth"
);

const authorize = require(
  "../midleware/authorize"
);

const validate = require(
  "../midleware/validate"
);

const {
  createServiceSchema,
  updateServiceSchema,
} = require(
  "../validators/service.validator"
);

/*
|--------------------------------------------------------------------------
| Provider Service Routes
|--------------------------------------------------------------------------
|
| Role 3 = Provider
|
|--------------------------------------------------------------------------
*/

router.use(authenticate);
router.use(authorize(3));

/*
|--------------------------------------------------------------------------
| GET /api/v1/provider/services
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  controller.getServices
);

/*
|--------------------------------------------------------------------------
| GET /api/v1/provider/services/:id
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  controller.getServiceById
);

/*
|--------------------------------------------------------------------------
| POST /api/v1/provider/services
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  validate(createServiceSchema),
  controller.createService
);

/*
|--------------------------------------------------------------------------
| PATCH /api/v1/provider/services/:id
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id",
  validate(updateServiceSchema),
  controller.updateService
);

/*
|--------------------------------------------------------------------------
| DELETE /api/v1/provider/services/:id
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  controller.deleteService
);

module.exports = router;