const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    /*
    |--------------------------------------------------------------------------
    | Authentication Check
    |--------------------------------------------------------------------------
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_TOKEN_REQUIRED",
          message: "Authentication required",
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize Role IDs
    |--------------------------------------------------------------------------
    |
    | Converts both:
    |
    | "3" → 3
    |  3  → 3
    |
    */

    const userRoleId = Number(req.user.roleId);

    const allowed = allowedRoles.map(Number);

    /*
    |--------------------------------------------------------------------------
    | Temporary Authorization Debug
    |--------------------------------------------------------------------------
    */

    console.log("AUTHORIZATION DEBUG:", {
      method: req.method,
      path: req.originalUrl,
      userId: req.user.id,
      roleId: req.user.roleId,
      convertedRoleId: userRoleId,
      allowedRoles: allowed,
    });

    /*
    |--------------------------------------------------------------------------
    | Role Authorization
    |--------------------------------------------------------------------------
    */

    if (!allowed.includes(userRoleId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this resource",
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Authorized
    |--------------------------------------------------------------------------
    */

    next();
  };
};

module.exports = authorize;