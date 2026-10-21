const { verifyAccessToken, verifyDocumentToken } = require("../utils/jwt");

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
      if (req.accepts("html") && !req.xhr && !req.headers.authorization) {
        return res.status(401).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Authentication Required - ServiceHub</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
              .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); max-width: 450px; text-align: center; border: 1px solid #e2e8f0; }
              h2 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 0.75rem; }
              p { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-bottom: 1.5rem; }
              .badge { display: inline-block; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700; color: #dc2626; background: #fee2e2; border-radius: 9999px; margin-bottom: 1rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">401 UNAUTHORIZED</div>
              <h2>Authentication Required</h2>
              <p>An authentication token is required to view this protected KYC document. Please log in to ServiceHub to access this resource.</p>
            </div>
          </body>
          </html>
        `);
      }

      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_TOKEN_REQUIRED",
          message: "Authentication token is required",
        },
      });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (accessErr) {
      // If access token verification fails, check if this is a short-lived KYC document view token
      try {
        decoded = verifyDocumentToken(token);
      } catch (_) {
        throw accessErr;
      }
    }

    req.user = {
      id: decoded.userId,
      roleId: decoded.roleId,
      role: decoded.role,
      docTokenType: decoded.tokenType,
      docFilename: decoded.docFilename,
    };

    next();
  } catch (error) {
    if (req.accepts("html") && !req.xhr && !req.headers.authorization) {
      return res.status(401).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Link Expired - ServiceHub</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
            .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); max-width: 450px; text-align: center; border: 1px solid #e2e8f0; }
            h2 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 0.75rem; }
            p { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-bottom: 1.5rem; }
            .badge { display: inline-block; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700; color: #dc2626; background: #fee2e2; border-radius: 9999px; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">AUTH ERROR</div>
            <h2>Document Access Link Expired</h2>
            <p>The authentication token for this KYC document is invalid or has expired. Please return to the portal and click "View Document" again.</p>
          </div>
        </body>
        </html>
      `);
    }

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
