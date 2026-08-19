const { sequelize } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Submit KYC Document
|--------------------------------------------------------------------------
*/

const submitDocument = async (providerId, data) => {
  const {
    document_type,
    file_url,
  } = data;

  /*
  |--------------------------------------------------------------------------
  | Verify Provider Exists
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
  | Prevent documents for deleted/inactive provider
  |--------------------------------------------------------------------------
  */

  if (provider.kyc_status === "approved" && provider.is_active) {
    throw new Error("Provider KYC is already approved");
  }

  /*
  |--------------------------------------------------------------------------
  | Create KYC Document
  |--------------------------------------------------------------------------
  */

  const [result] = await sequelize.query(
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
        fileUrl: file_url,
      },
    }
  );

  if (!result || !result.insertId) {
    throw new Error("KYC document creation failed");
  }

  /*
  |--------------------------------------------------------------------------
  | Return Created Document
  |--------------------------------------------------------------------------
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
      WHERE id = :documentId
      LIMIT 1
    `,
    {
      replacements: {
        documentId: Number(result.insertId),
      },
    }
  );

  if (!documents.length) {
    throw new Error("KYC document could not be retrieved");
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

  return getDocumentById(documentId);
};

module.exports = {
  submitDocument,
  getProviderDocuments,
  getDocumentById,
  reviewDocument,
};