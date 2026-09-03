const path = require("path");
const fs = require("fs");
const { sequelize } = require("../config/database");
const { hasValidSignature, uploadDir } = require("../midleware/kycUpload");
const { Notification, AuditLog } = require("../models");
const AppError = require("../utils/AppError");

/*
|--------------------------------------------------------------------------
| Submit KYC Document
|--------------------------------------------------------------------------
*/
const submitDocument = async (providerId, data) => {
  const {
    document_type,
    file,
  } = data;
  if (!file || !(await hasValidSignature(file))) throw new Error("KYC file content is invalid");

  /*
  |--------------------------------------------------------------------------
  | Verify Provider
  |--------------------------------------------------------------------------
  */

  const [providers] = await sequelize.query(
    `
      SELECT
        id,
        user_id,
        kyc_status,
        is_active
      FROM providers
      WHERE id = :providerId
      LIMIT 1
    `,
    {
      replacements: {
        providerId,
      },
    }
  );

  if (!providers.length) {
    throw new Error("Provider not found");
  }

  const provider = providers[0];

  /*
  |--------------------------------------------------------------------------
  | Prevent duplicate submission after approval
  |--------------------------------------------------------------------------
  */

  if (
    provider.kyc_status === "approved" &&
    Number(provider.is_active) === 1
  ) {
    throw new Error("Provider KYC is already approved");
  }

  /*
  |--------------------------------------------------------------------------
  | Insert KYC Document
  |--------------------------------------------------------------------------
  */

  await sequelize.query(
    `
      INSERT INTO kyc_documents
      (
        provider_id,
        document_type,
        file_url,
        status,
        created_at
      )
      VALUES
      (
        :providerId,
        :documentType,
        :fileUrl,
        'pending',
        CURRENT_TIMESTAMP
      )
    `,
    {
      replacements: {
        providerId,
        documentType: document_type,
        fileUrl: `private-uploads/kyc/${file.filename}`,
      },
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Get newly created document
  |--------------------------------------------------------------------------
  |
  | Do not depend on Sequelize insertId here.
  |
  */

  const [documents] = await sequelize.query(
    `
      SELECT
        id,
        provider_id,
        document_type,
        file_url,
        status,
        reviewed_by,
        reviewed_at,
        created_at
      FROM kyc_documents
      WHERE provider_id = :providerId
        AND document_type = :documentType
        AND file_url = :fileUrl
      ORDER BY id DESC
      LIMIT 1
    `,
    {
      replacements: {
        providerId,
        documentType: document_type,
        fileUrl: `private-uploads/kyc/${file.filename}`,
      },
    }
  );

  if (!documents.length) {
    throw new Error(
      "KYC document was inserted but could not be retrieved"
    );
  }

  return documents[0];
};

/*
|--------------------------------------------------------------------------
| Get Provider KYC Documents
|--------------------------------------------------------------------------
*/

const getProviderDocuments = async (providerId) => {
  const [documents] = await sequelize.query(
    `
      SELECT
        id,
        provider_id,
        document_type,
        file_url,
        status,
        reviewed_by,
        reviewed_at,
        created_at
      FROM kyc_documents
      WHERE provider_id = :providerId
      ORDER BY id DESC
    `,
    {
      replacements: {
        providerId,
      },
    }
  );

  return documents;
};

/*
|--------------------------------------------------------------------------
| Get KYC Document By ID
|--------------------------------------------------------------------------
*/

const getDocumentById = async (documentId) => {
  const [documents] = await sequelize.query(
    `
      SELECT
        id,
        provider_id,
        document_type,
        file_url,
        status,
        reviewed_by,
        reviewed_at,
        created_at
      FROM kyc_documents
      WHERE id = :documentId
      LIMIT 1
    `,
    {
      replacements: {
        documentId,
      },
    }
  );

  if (!documents.length) {
    throw new Error("KYC document not found");
  }

  return documents[0];
};

/*
|--------------------------------------------------------------------------
| Review KYC Document
|--------------------------------------------------------------------------
*/

const reviewDocument = async (
  documentId,
  adminUserId,
  status
) => {
  /*
  |--------------------------------------------------------------------------
  | Validate status
  |--------------------------------------------------------------------------
  */

  if (!["approved", "rejected"].includes(status)) {
    throw new Error("Invalid KYC review status");
  }

  /*
  |--------------------------------------------------------------------------
  | Find document
  |--------------------------------------------------------------------------
  */

  const [documents] = await sequelize.query(
    `
      SELECT
        id,
        provider_id,
        status
      FROM kyc_documents
      WHERE id = :documentId
      LIMIT 1
    `,
    {
      replacements: {
        documentId,
      },
    }
  );

  if (!documents.length) {
    throw new Error("KYC document not found");
  }

  const document = documents[0];

  if (document.status !== "pending") {
    throw new Error("KYC document has already been reviewed");
  }

  /*
  |--------------------------------------------------------------------------
  | Update Document
  |--------------------------------------------------------------------------
  */

  await sequelize.query(
    `
      UPDATE kyc_documents
      SET
        status = :status,
        reviewed_by = :adminUserId,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = :documentId
    `,
    {
      replacements: {
        status,
        adminUserId,
        documentId,
      },
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Update Provider KYC Status
  |--------------------------------------------------------------------------
  |
  | For now:
  |
  | approved → provider approved + active
  | rejected → provider rejected + inactive
  |
  */

  if (status === "approved") {
    await sequelize.query(
      `
        UPDATE providers
        SET
          kyc_status = 'approved',
          is_active = 1,
          kyc_rejection_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = :providerId
      `,
      {
        replacements: {
          providerId: document.provider_id,
        },
      }
    );
  } else {
    await sequelize.query(
      `
        UPDATE providers
        SET
          kyc_status = 'rejected',
          is_active = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = :providerId
      `,
      {
        replacements: {
          providerId: document.provider_id,
        },
      }
    );
  }

  const [providers] = await sequelize.query(
    "SELECT user_id FROM providers WHERE id = :providerId LIMIT 1",
    { replacements: { providerId: document.provider_id } }
  );
  const userId = providers[0]?.user_id;
  if (userId) {
    await Notification.create({
      user_id: userId,
      type: status === "approved" ? "kyc_approved" : "kyc_rejected",
      title: status === "approved" ? "KYC approved" : "KYC rejected",
      body: status === "approved" ? "Your KYC verification has been approved." : "Your KYC verification was rejected.",
      reference_type: "kyc_document",
      reference_id: document.id,
    });
  }
  await AuditLog.create({
    user_id: adminUserId,
    action: `kyc.${status}`,
    entity_type: "kyc_document",
    entity_id: document.id,
    old_values_json: { status: document.status },
    new_values_json: { status },
  });

  return getDocumentById(documentId);
};

/*
|--------------------------------------------------------------------------
| Get KYC Document File For Secure Download/Viewing
|--------------------------------------------------------------------------
*/
const getKycDocumentFile = async (user, rawFilename) => {
  if (!rawFilename || typeof rawFilename !== "string") {
    throw new AppError("Invalid filename requested", 400, "INVALID_FILENAME");
  }

  // Remove query string if any and get basename
  const cleanFilename = path.basename(rawFilename.split("?")[0].trim());

  if (!cleanFilename || cleanFilename.includes("..") || cleanFilename.includes("/") || cleanFilename.includes("\\")) {
    throw new AppError("Invalid filename requested", 400, "INVALID_FILENAME");
  }

  const ext = path.extname(cleanFilename).toLowerCase();
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf"];
  if (!allowedExtensions.includes(ext)) {
    throw new AppError("Unsupported file type", 400, "INVALID_FILE_TYPE");
  }

  // Look up KYC document in DB
  const [docRows] = await sequelize.query(
    `
      SELECT id, provider_id, document_type, file_url, status
      FROM kyc_documents
      WHERE file_url LIKE :pattern
      ORDER BY id DESC
      LIMIT 1
    `,
    {
      replacements: {
        pattern: `%${cleanFilename}%`,
      },
    }
  );

  const kycDoc = docRows.length > 0 ? docRows[0] : null;

  // Authorization check
  if (Number(user.roleId) === 1) {
    // Admin authorized to view all KYC documents
  } else if (Number(user.roleId) === 3) {
    // Provider authorized only to view own KYC documents
    const [providers] = await sequelize.query(
      "SELECT id FROM providers WHERE user_id = :userId LIMIT 1",
      { replacements: { userId: user.id } }
    );
    if (!providers.length) {
      throw new AppError("Provider profile not found", 403, "FORBIDDEN");
    }
    const providerId = providers[0].id;

    if (!kycDoc || kycDoc.provider_id !== providerId) {
      throw new AppError("You are not authorized to view this KYC document", 403, "FORBIDDEN");
    }
  } else {
    // Customer or any other unauthorized role
    throw new AppError("Unauthorized access to KYC documents", 403, "FORBIDDEN");
  }

  // Resolve file safely in uploadDir
  const absoluteUploadDir = path.resolve(__dirname, "../../private-uploads/kyc");
  const targetFilePath = path.resolve(absoluteUploadDir, cleanFilename);

  if (!targetFilePath.startsWith(absoluteUploadDir)) {
    throw new AppError("Invalid file path", 400, "INVALID_FILE_PATH");
  }

  if (!fs.existsSync(targetFilePath)) {
    throw new AppError("KYC document file not found", 404, "KYC_FILE_NOT_FOUND");
  }

  let mimeType = "application/octet-stream";
  if (ext === ".png") mimeType = "image/png";
  else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
  else if (ext === ".pdf") mimeType = "application/pdf";

  return {
    filePath: targetFilePath,
    filename: cleanFilename,
    mimeType,
  };
};

module.exports = {
  submitDocument,
  getProviderDocuments,
  getDocumentById,
  reviewDocument,
  getKycDocumentFile,
};
