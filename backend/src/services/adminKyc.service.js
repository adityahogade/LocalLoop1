const { sequelize } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Get All Pending KYC Documents
|--------------------------------------------------------------------------
*/

const getPendingKycDocuments = async () => {
  const [documents] = await sequelize.query(
    `
      SELECT
        k.id,
        k.provider_id,
        k.document_type,
        k.file_url,
        k.status,
        k.reviewed_by,
        k.reviewed_at,
        k.created_at,
        p.business_name,
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone
      FROM kyc_documents k
      INNER JOIN providers p
        ON k.provider_id = p.id
      INNER JOIN users u
        ON p.user_id = u.id
      WHERE k.status = 'pending'
      ORDER BY k.id DESC
    `
  );

  return documents;
};

/*
|--------------------------------------------------------------------------
| Review KYC Document
|--------------------------------------------------------------------------
*/

const reviewKycDocument = async (
  documentId,
  adminUserId,
  status,
  rejectionReason = null
) => {
  if (!["approved", "rejected"].includes(status)) {
    throw new Error("Invalid KYC review status");
  }

  const transaction = await sequelize.transaction();

  try {
    /*
    |--------------------------------------------------------------------------
    | Find KYC document
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
        transaction,
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
    | Update KYC Document
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
        transaction,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Update Provider
    |--------------------------------------------------------------------------
    */

    if (status === "approved") {
      await sequelize.query(
        `
          UPDATE providers
          SET
            kyc_status = 'approved',
            kyc_rejection_reason = NULL,
            is_active = 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = :providerId
        `,
        {
          replacements: {
            providerId: document.provider_id,
          },
          transaction,
        }
      );
    } else {
      await sequelize.query(
        `
          UPDATE providers
          SET
            kyc_status = 'rejected',
            kyc_rejection_reason = :rejectionReason,
            is_active = 0,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = :providerId
        `,
        {
          replacements: {
            providerId: document.provider_id,
            rejectionReason,
          },
          transaction,
        }
      );
    }

    await transaction.commit();

    /*
    |--------------------------------------------------------------------------
    | Return Updated Document
    |--------------------------------------------------------------------------
    */

    const [updatedDocuments] = await sequelize.query(
      `
        SELECT
          k.id,
          k.provider_id,
          k.document_type,
          k.file_url,
          k.status,
          k.reviewed_by,
          k.reviewed_at,
          k.created_at,
          p.business_name,
          p.kyc_status,
          p.kyc_rejection_reason,
          p.is_active
        FROM kyc_documents k
        INNER JOIN providers p
          ON k.provider_id = p.id
        WHERE k.id = :documentId
        LIMIT 1
      `,
      {
        replacements: {
          documentId,
        },
      }
    );

    return updatedDocuments[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  getPendingKycDocuments,
  reviewKycDocument,
};