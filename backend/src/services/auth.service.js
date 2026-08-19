const { sequelize } = require("../config/database");
const {
  hashPassword,
  comparePassword,
} = require("../utils/password");
const { generateAccessToken } = require("../utils/jwt");

/*
|--------------------------------------------------------------------------
| Customer Registration
|--------------------------------------------------------------------------
*/

const register = async (data) => {
  const {
    full_name,
    email,
    phone,
    password,
    preferred_language = "en",
  } = data;

  /*
  |--------------------------------------------------------------------------
  | Check duplicate email / phone
  |--------------------------------------------------------------------------
  */

  const [existingUsers] = await sequelize.query(
    `
      SELECT id
      FROM users
      WHERE email = :email
         OR phone = :phone
      LIMIT 1
    `,
    {
      replacements: {
        email,
        phone,
      },
    }
  );

  if (existingUsers.length) {
    throw new Error("Email or phone already exists");
  }

  /*
  |--------------------------------------------------------------------------
  | Get Customer Role
  |--------------------------------------------------------------------------
  */

  const [roles] = await sequelize.query(
    `
      SELECT id
      FROM roles
      WHERE name = 'customer'
      LIMIT 1
    `
  );

  if (!roles.length) {
    throw new Error("Customer role not found");
  }

  const customerRoleId = roles[0].id;

  /*
  |--------------------------------------------------------------------------
  | Hash Password
  |--------------------------------------------------------------------------
  */

  const passwordHash = await hashPassword(password);

  /*
  |--------------------------------------------------------------------------
  | Create Customer
  |--------------------------------------------------------------------------
  */

  await sequelize.query(
    `
      INSERT INTO users
      (
        role_id,
        full_name,
        email,
        phone,
        password_hash,
        preferred_language,
        status,
        created_at,
        updated_at
      )
      VALUES
      (
        :role_id,
        :full_name,
        :email,
        :phone,
        :password_hash,
        :preferred_language,
        'active',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `,
    {
      replacements: {
        role_id: customerRoleId,
        full_name,
        email,
        phone,
        password_hash: passwordHash,
        preferred_language,
      },
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Created Customer
  |--------------------------------------------------------------------------
  */

  const [users] = await sequelize.query(
    `
      SELECT
        u.id,
        u.role_id,
        u.full_name,
        u.email,
        u.phone,
        u.preferred_language,
        u.status,
        u.email_verified_at,
        u.phone_verified_at,
        r.name AS role
      FROM users u
      INNER JOIN roles r
        ON u.role_id = r.id
      WHERE u.email = :email
      LIMIT 1
    `,
    {
      replacements: {
        email,
      },
    }
  );

  if (!users.length) {
    throw new Error(
      "User registered but could not be retrieved"
    );
  }

  return users[0];
};

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

const login = async (email, password) => {
  const [users] = await sequelize.query(
    `
      SELECT
        u.id,
        u.role_id,
        u.full_name,
        u.email,
        u.phone,
        u.password_hash,
        u.status,
        r.name AS role_name
      FROM users u
      INNER JOIN roles r
        ON u.role_id = r.id
      WHERE u.email = :email
      LIMIT 1
    `,
    {
      replacements: {
        email,
      },
    }
  );

  if (!users.length) {
    throw new Error("Invalid email or password");
  }

  const user = users[0];

  if (user.status !== "active") {
    throw new Error("User account is not active");
  }

  const passwordValid = await comparePassword(
    password,
    user.password_hash
  );

  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    roleId: user.role_id,
    role: user.role_name,
  });

  await sequelize.query(
    `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = :userId
    `,
    {
      replacements: {
        userId: user.id,
      },
    }
  );

  return {
    user: {
      id: user.id,
      role_id: user.role_id,
      role: user.role_name,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    },
    accessToken,
  };
};

/*
|--------------------------------------------------------------------------
| Provider Registration
|--------------------------------------------------------------------------
|
| Public endpoint.
|
| Creates:
| 1. users row with provider role
| 2. providers row
|
| Both operations use the same database transaction.
|
*/

const providerRegister = async (data) => {
  const {
    full_name,
    email,
    phone,
    password,
    preferred_language = "en",
    business_name,
    business_description = null,
    logo_url = null,
  } = data;

  const transaction = await sequelize.transaction();

  try {
    /*
    |--------------------------------------------------------------------------
    | Check duplicate email / phone
    |--------------------------------------------------------------------------
    */

    const [existingUsers] = await sequelize.query(
      `
        SELECT id
        FROM users
        WHERE email = :email
           OR phone = :phone
        LIMIT 1
      `,
      {
        replacements: {
          email,
          phone,
        },
        transaction,
      }
    );

    if (existingUsers.length) {
      throw new Error("Email or phone already exists");
    }

    /*
    |--------------------------------------------------------------------------
    | Get Provider Role
    |--------------------------------------------------------------------------
    */

    const [roles] = await sequelize.query(
      `
        SELECT id
        FROM roles
        WHERE name = 'provider'
        LIMIT 1
      `,
      {
        transaction,
      }
    );

    if (!roles.length) {
      throw new Error("Provider role not found");
    }

    const providerRoleId = roles[0].id;

    /*
    |--------------------------------------------------------------------------
    | Hash Password
    |--------------------------------------------------------------------------
    */

    const passwordHash = await hashPassword(password);

    /*
    |--------------------------------------------------------------------------
    | Create Provider User
    |--------------------------------------------------------------------------
    */

    await sequelize.query(
      `
        INSERT INTO users
        (
          role_id,
          full_name,
          email,
          phone,
          password_hash,
          preferred_language,
          status,
          created_at,
          updated_at
        )
        VALUES
        (
          :role_id,
          :full_name,
          :email,
          :phone,
          :password_hash,
          :preferred_language,
          'active',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
      {
        replacements: {
          role_id: providerRoleId,
          full_name,
          email,
          phone,
          password_hash: passwordHash,
          preferred_language,
        },
        transaction,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Get Newly Created User
    |--------------------------------------------------------------------------
    */

    const [users] = await sequelize.query(
      `
        SELECT id
        FROM users
        WHERE email = :email
        LIMIT 1
      `,
      {
        replacements: {
          email,
        },
        transaction,
      }
    );

    if (!users.length) {
      throw new Error(
        "Provider user created but could not be retrieved"
      );
    }

    const userId = users[0].id;

    /*
    |--------------------------------------------------------------------------
    | Create Provider Profile
    |--------------------------------------------------------------------------
    |
    | New providers always start with:
    |
    | kyc_status = pending
    | is_active = 0
    | average_rating = 0.00
    |
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
          0,
          0.00,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
      {
        replacements: {
          user_id: userId,
          business_name,
          business_description,
          logo_url,
        },
        transaction,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Get Created Provider
    |--------------------------------------------------------------------------
    */

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
        WHERE p.user_id = :user_id
        LIMIT 1
      `,
      {
        replacements: {
          user_id: userId,
        },
        transaction,
      }
    );

    if (!providers.length) {
      throw new Error(
        "Provider profile created but could not be retrieved"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Commit Transaction
    |--------------------------------------------------------------------------
    */

    await transaction.commit();

    return providers[0];
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Rollback
    |--------------------------------------------------------------------------
    */

    await transaction.rollback();

    throw error;
  }
};
module.exports = {
  register,
   providerRegister,
  login,
};