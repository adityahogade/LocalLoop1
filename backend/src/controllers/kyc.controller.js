const { sequelize } = require("../config/database");
const kycService = require("../services/kyc.service");
const fs = require("fs");

/*
|--------------------------------------------------------------------------
| Get Provider ID From Authenticated User
|--------------------------------------------------------------------------
*/

const getProviderId = async (userId) => {
  const [providers] = await sequelize.query(
    `
      SELECT id
      FROM providers
      WHERE user_id = :userId
      LIMIT 1
    `,
    {
      replacements: {
        userId,
      },
    }
  );

  if (!providers.length) {
    throw new Error("Provider profile not found");
  }

  return providers[0].id;
};

/*
|--------------------------------------------------------------------------
| Submit KYC Document
|--------------------------------------------------------------------------
|
| POST /api/providers/kyc
|
*/

const submitKyc = async (req, res, next) => {
  try {
    const providerId = await getProviderId(req.user.id);

    if (!req.file) return res.status(400).json({ success: false, error: { code: "KYC_FILE_REQUIRED", message: "KYC file is required" } });
    const result = await kycService.submitDocument(
      providerId,
      { ...req.body, file: req.file }
    );

    return res.status(201).json({
      success: true,
      message: "KYC document submitted successfully",
      data: result,
    });
  } catch (error) {
    if (req.file?.path) await fs.promises.unlink(req.file.path).catch(() => {});
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get My KYC Documents
|--------------------------------------------------------------------------
|
| GET /api/providers/kyc
|
*/

const getMyKycDocuments = async (req, res, next) => {
  try {
    const providerId = await getProviderId(req.user.id);

    const result =
      await kycService.getProviderDocuments(providerId);

    return res.status(200).json({
      success: true,
      message: "KYC documents fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Generate Temporary KYC Document View Token & URL
|--------------------------------------------------------------------------
|
| GET /api/kyc/documents/:filename/view-token
| GET /api/admin/kyc/documents/:filename/view-token
| GET /api/providers/kyc/documents/:filename/view-token
|
*/

const getKycViewToken = async (req, res, next) => {
  try {
    const filename = req.params.filename || req.params[0];
    const host = req.get("host");
    const protocol = req.protocol || (req.secure ? "https" : "http");
    const result = await kycService.createDocumentViewToken(req.user, filename, host, protocol);

    return res.status(200).json({
      success: true,
      message: "KYC document view token generated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Serve Private KYC Document
|--------------------------------------------------------------------------
|
| GET /private-uploads/kyc/:filename
| GET /api/kyc/documents/:filename
|
*/
const serveKycDocument = async (req, res, next) => {
  try {
    const filename = req.params.filename || req.params[0];
    const { filePath, filename: safeFilename, mimeType } = await kycService.getKycDocumentFile(req.user, filename);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${safeFilename}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");

    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => next(err));
    stream.pipe(res);
  } catch (error) {
    if (req.accepts("html") && !req.xhr && !req.headers.authorization) {
      const statusCode = error.statusCode || error.status || 500;
      const title = statusCode === 404
        ? "KYC Document Not Found"
        : (statusCode === 403 ? "Access Denied" : "Unable to Open Document");
      const message = statusCode === 404
        ? "The requested KYC document file could not be found on server storage. The provider may need to re-upload it."
        : (error.message || "An unexpected error occurred while loading this document.");

      return res.status(statusCode).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title} - ServiceHub</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
            .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); max-width: 480px; text-align: center; border: 1px solid #e2e8f0; }
            h2 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 0.75rem; }
            p { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-bottom: 1.5rem; }
            .badge { display: inline-block; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700; color: #b91c1c; background: #fee2e2; border-radius: 9999px; margin-bottom: 1rem; }
            .code { font-family: monospace; font-size: 0.75rem; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 0.25rem; color: #475569; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">${statusCode} ERROR</div>
            <h2>${title}</h2>
            <p>${message}</p>
            <div class="code">CODE: ${error.errorCode || "DOCUMENT_ERROR"}</div>
          </div>
        </body>
        </html>
      `);
    }
    next(error);
  }
};

module.exports = {
  submitKyc,
  getMyKycDocuments,
  getKycViewToken,
  serveKycDocument,
};
