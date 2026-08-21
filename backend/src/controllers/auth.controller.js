const authService = require("../services/auth.service");

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
|
| POST /api/auth/register
|
| Public endpoint — no JWT required.
|
*/
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
|
| POST /api/auth/login
|
*/
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
        },
      });
    }

    const result = await authService.login(
      email,
      password
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Authenticated User
|--------------------------------------------------------------------------
|
| GET /api/auth/me
|
| Requires JWT authentication middleware.
|
*/
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Authenticated user",
      data: {
        userId: req.user.id,
        roleId: req.user.roleId,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Provider Registration
|--------------------------------------------------------------------------
|
| POST /api/auth/provider-register
|
| Public endpoint — no JWT required.
|
*/
const providerRegister = async (req, res, next) => {
  try {
    const result = await authService.providerRegister(req.body);

    return res.status(201).json({
      success: true,
      message: "Provider registration successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
const refresh = async (req, res, next) => { try { res.json({ success: true, data: await authService.refresh(req.body.refresh_token) }); } catch (error) { next(error); } };
const logout = async (req, res, next) => { try { await authService.logout(req.user.id); res.status(204).send(); } catch (error) { next(error); } };
const forgotPassword = async (req, res, next) => { try { res.json({ success: true, data: await authService.requestPasswordReset(req.body.email) }); } catch (error) { next(error); } };
const resetPassword = async (req, res, next) => { try { await authService.resetPassword(req.body.token, req.body.password); res.json({ success: true, message: "Password reset successful" }); } catch (error) { next(error); } };
module.exports = {
  register,
  providerRegister,
  login,
  getMe,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};