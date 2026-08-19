const express = require("express");

const userController = require("../controllers/user.controller");
const authenticate = require("../midleware/auth");
const authorize = require("../midleware/authorize");
const validate = require("../midleware/validate");

const {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdSchema,
} = require("../validators/user.validator");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| User Management Routes
|--------------------------------------------------------------------------
|
| All user-management endpoints require:
| 1. Valid JWT
| 2. Admin role (role_id = 1)
|
|--------------------------------------------------------------------------
*/

/**
 * Get all users
 *
 * GET /api/users
 */
router.get(
  "/",
  authenticate,
  authorize(1),
  userController.getAllUsers
);

/**
 * Get user by ID
 *
 * GET /api/users/:id
 */
router.get(
  "/:id",
  authenticate,
  authorize(1),
  validate(userIdSchema),
  userController.getUserById
);

/**
 * Create user
 *
 * POST /api/users
 */
router.post(
  "/",
  authenticate,
  authorize(1),
  validate(createUserSchema),
  userController.createUser
);

/**
 * Update user
 *
 * PATCH /api/users/:id
 */
router.patch(
  "/:id",
  authenticate,
  authorize(1),
  validate(updateUserSchema),
  userController.updateUser
);

/**
 * Update user status
 *
 * PATCH /api/users/:id/status
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize(1),
  validate(updateUserStatusSchema),
  userController.updateUserStatus
);

/**
 * Delete user
 *
 * DELETE /api/users/:id
 */
router.delete(
  "/:id",
  authenticate,
  authorize(1),
  validate(userIdSchema),
  userController.deleteUser
);

module.exports = router;