const userService = require("../services/user.service");

/*
|--------------------------------------------------------------------------
| Get All Users
|--------------------------------------------------------------------------
|
| GET /api/users
|
*/
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get User By ID
|--------------------------------------------------------------------------
|
| GET /api/users/:id
|
*/
const getUserById = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "Invalid user ID",
        },
      });
    }

    const user = await userService.getUserById(userId);

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
|
| POST /api/users
|
*/
const createUser = async (req, res, next) => {
  try {
    const {
      role_id,
      full_name,
      email,
      phone,
      password,
      preferred_language,
    } = req.body;

    if (
      !role_id ||
      !full_name ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "role_id, full_name, email, phone and password are required",
        },
      });
    }

    const user = await userService.createUser({
      role_id,
      full_name,
      email,
      phone,
      password,
      preferred_language,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update User
|--------------------------------------------------------------------------
|
| PATCH /api/users/:id
|
*/
const updateUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "Invalid user ID",
        },
      });
    }

    const user = await userService.updateUser(
      userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update User Status
|--------------------------------------------------------------------------
|
| PATCH /api/users/:id/status
|
*/
const updateUserStatus = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "Invalid user ID",
        },
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Status is required",
        },
      });
    }

    const user = await userService.updateUserStatus(
      userId,
      status
    );

    return res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Delete User
|--------------------------------------------------------------------------
|
| DELETE /api/users/:id
|
| Uses soft delete.
|
*/
const deleteUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "Invalid user ID",
        },
      });
    }

    const result = await userService.deleteUser(userId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};