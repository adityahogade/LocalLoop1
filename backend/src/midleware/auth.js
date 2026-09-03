const { verifyAccessToken } = require("../utils/jwt");

const authenticate = (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(" ");

      if (
        parts.length !== 2 ||
        parts[0].toLowerCase() !== "bearer"
      ) {
        return res.status(401).json({
          success: false,
          error: {
            code: "INVALID_AUTH_HEADER",
            message: "Authorization header must use Bearer token",
          },
        });
      }

      token = parts[1];
    } else if (req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_TOKEN_REQUIRED",
          message: "Authentication token is required",
        },
      });
    }

    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.userId,
      roleId: decoded.roleId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_OR_EXPIRED_TOKEN",
        message: "Invalid or expired authentication token",
      },
    });
  }
};

module.exports = authenticate;