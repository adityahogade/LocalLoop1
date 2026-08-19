const { sequelize } = require("../config/database");

/*
|--------------------------------------------------------------------------
| Remove sensitive fields
|--------------------------------------------------------------------------
*/

const sanitizeProvider = (provider) => {
  if (!provider) {
    return null;
  }

  return provider;
};

/*
|--------------------------------------------------------------------------
| Get All Providers
|--------------------------------------------------------------------------
*/

const getAllProviders = async () => {
  const [providers] = await sequelize.query(`
    SELECT
      p.id,
      p.user_id,
      u.full_name,
      u.email,
      u.phone,
      p.business_name,
      p.business_description,
      p.logo_url,
      p.kyc_status,
      p.kyc_rejection_reason,
      p.is_active,
      p.average_rating,
      p.created_at,
      p.updated_at
    FROM providers p
    INNER JOIN users u
      ON p.user_id = u.id
    WHERE u.status != 'deleted'
    ORDER BY p.id DESC
  `);

  return providers.map(sanitizeProvider);
};

/*
|--------------------------------------------------------------------------
| Get Provider By ID
|--------------------------------------------------------------------------
*/

const getProviderById = async (providerId) => {
  const [providers] = await sequelize.query(
    `
      SELECT
        p.id,
        p.user_id,
        u.full_name,
        u.email,
        u.phone,
        p.business_name,
        p.business_description,
        p.logo_url,
        p.kyc_status,
        p.kyc_rejection_reason,
        p.is_active,
        p.average_rating,
        p.created_at,
        p.updated_at
      FROM providers p
      INNER JOIN users u
        ON p.user_id = u.id
      WHERE p.id = :providerId
        AND u.status != 'deleted'
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

  return sanitizeProvider(providers[0]);
};

/*
|--------------------------------------------------------------------------
| Create Provider
|--------------------------------------------------------------------------
*/

const createProvider = async (data) => {
  const {
    user_id,
    business_name,
    business_description = null,
    logo_url = null,
  } = data;

  /*
  |--------------------------------------------------------------------------
  | Verify user exists and has provider role
  |--------------------------------------------------------------------------
  */

  const [users] = await sequelize.query(
    `
      SELECT
        u.id,
        u.role_id,
        u.status,
        r.name AS role
      FROM users u
      INNER JOIN roles r
        ON u.role_id = r.id
      WHERE u.id = :user_id
      LIMIT 1
    `,
    {
      replacements: {
        user_id,
      },
    }
  );

  if (!users.length) {
    throw new Error("User not found");
  }

  const user = users[0];

  if (user.role_id !== 3) {
    throw new Error("User does not have provider role");
  }

  if (user.status !== "active") {
    throw new Error("User account is not active");
  }

  /*
  |--------------------------------------------------------------------------
  | Check existing provider profile
  |--------------------------------------------------------------------------
  */

  const [existingProviders] = await sequelize.query(
    `
      SELECT id
      FROM providers
      WHERE user_id = :user_id
      LIMIT 1
    `,
    {
      replacements: {
        user_id,
      },
    }
  );

  if (existingProviders.length) {
    throw new Error("Provider profile already exists");
  }

  /*
  |--------------------------------------------------------------------------
  | Create Provider
  |--------------------------------------------------------------------------
  */

  await sequelize.query(
    `
      INSERT INTO providers
      (
        user_id,
        business_name,
        business_description,
        logo_url,
        kyc_status,
        is_active,
        average_rating,
        created_at,
        updated_at
      )
      VALUES
      (
        :user_id,
        :business_name,
        :business_description,
        :logo_url,
        'pending',
        1,
        0.00,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `,
    {
      replacements: {
        user_id,
        business_name,
        business_description,
        logo_url,
      },
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch created provider
  |--------------------------------------------------------------------------
  */

  const [createdProviders] = await sequelize.query(
    `
      SELECT
        p.id,
        p.user_id,
        u.full_name,
        u.email,
        u.phone,
        p.business_name,
        p.business_description,
        p.logo_url,
        p.kyc_status,
        p.kyc_rejection_reason,
        p.is_active,
        p.average_rating,
        p.created_at,
        p.updated_at
      FROM providers p
      INNER JOIN users u
        ON p.user_id = u.id
      WHERE p.user_id = :user_id
      LIMIT 1
    `,
    {
      replacements: {
        user_id,
      },
    }
  );

  if (!createdProviders.length) {
    throw new Error("Provider was created but could not be retrieved");
  }

  return sanitizeProvider(createdProviders[0]);
};

/*
|--------------------------------------------------------------------------
| Update Provider
|--------------------------------------------------------------------------
*/

const updateProvider = async (providerId, data) => {
  const allowedFields = [
    "business_name",
    "business_description",
    "logo_url",
  ];

  const updates = [];
  const replacements = {
    providerId,
  };

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = :${field}`);
      replacements[field] = data[field];
    }
  }

  if (!updates.length) {
    throw new Error("No fields to update");
  }

  await sequelize.query(
    `
      UPDATE providers
      SET ${updates.join(", ")},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :providerId
    `,
    {
      replacements,
    }
  );

  return getProviderById(providerId);
};

/*
|--------------------------------------------------------------------------
| Update Provider Active Status
|--------------------------------------------------------------------------
*/

const updateProviderStatus = async (providerId, isActive) => {
  await sequelize.query(
    `
      UPDATE providers
      SET is_active = :isActive,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :providerId
    `,
    {
      replacements: {
        providerId,
        isActive: isActive ? 1 : 0,
      },
    }
  );

  return getProviderById(providerId);
};

/*
|--------------------------------------------------------------------------
| Update Provider KYC
|--------------------------------------------------------------------------
*/

const updateProviderKyc = async (
  providerId,
  kycStatus,
  kycRejectionReason = null
) => {
  if (!["pending", "approved", "rejected"].includes(kycStatus)) {
    throw new Error("Invalid KYC status");
  }

  if (kycStatus !== "rejected") {
    kycRejectionReason = null;
  }

  await sequelize.query(
    `
      UPDATE providers
      SET
        kyc_status = :kycStatus,
        kyc_rejection_reason = :kycRejectionReason,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = :providerId
    `,
    {
      replacements: {
        providerId,
        kycStatus,
        kycRejectionReason,
      },
    }
  );

  return getProviderById(providerId);
};

module.exports = {
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  updateProviderStatus,
  updateProviderKyc,
}; 