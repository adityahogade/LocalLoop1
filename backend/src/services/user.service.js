const { sequelize } = require("../config/database");
const { AuditLog } = require("../models");
const AppError = require("../utils/AppError");
const { hashPassword } = require("../utils/password");

/*
|--------------------------------------------------------------------------
| Remove sensitive fields
|--------------------------------------------------------------------------
*/

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const {
    password_hash,
    refresh_token_hash,
    ...safeUser
  } = user;

  return safeUser;
};

/*
|--------------------------------------------------------------------------
| Get All Users
|--------------------------------------------------------------------------
*/

const getAllUsers = async () => {
  const [users] = await sequelize.query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.preferred_language,
      u.status,
      u.email_verified_at,
      u.phone_verified_at,
      u.last_login_at,
      u.created_at,
      u.updated_at,
      r.id AS role_id,
      r.name AS role
    FROM users u
    INNER JOIN roles r
      ON u.role_id = r.id
    WHERE u.status != 'deleted'
    ORDER BY u.id DESC
  `);

  return users.map(sanitizeUser);
};

/*
|--------------------------------------------------------------------------
| Get User By ID
|--------------------------------------------------------------------------
*/

const getUserById = async (userId) => {
  const [users] = await sequelize.query(
    `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.preferred_language,
        u.status,
        u.email_verified_at,
        u.phone_verified_at,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        r.id AS role_id,
        r.name AS role
      FROM users u
      INNER JOIN roles r
        ON u.role_id = r.id
      WHERE u.id = :userId
        AND u.status != 'deleted'
      LIMIT 1
    `,
    {
      replacements: { userId },
    }
  );

  if (!users.length) {
    throw new Error("User not found");
  }

  return sanitizeUser(users[0]);
};

/*
|--------------------------------------------------------------------------
| Create User
|--------------------------------------------------------------------------
*/
const createUser = async (data) => {
  const {
    role_id,
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
  | Hash Password
  |--------------------------------------------------------------------------
  */

  const passwordHash = await hashPassword(password);

  /*
  |--------------------------------------------------------------------------
  | Insert User
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
        role_id,
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
  | Fetch newly created user
  |--------------------------------------------------------------------------
  |
  | Instead of depending on insertId, find the user
  | using the unique email.
  |
  */

  const [createdUsers] = await sequelize.query(
    `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.preferred_language,
        u.status,
        u.email_verified_at,
        u.phone_verified_at,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        r.id AS role_id,
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

  if (!createdUsers.length) {
    throw new Error("User was created but could not be retrieved");
  }

  return sanitizeUser(createdUsers[0]);
};
/*
|--------------------------------------------------------------------------
| Update User
|--------------------------------------------------------------------------
*/

const updateUser = async (userId, data) => {
  const allowedFields = [
    "full_name",
    "email",
    "phone",
    "preferred_language",
  ];

  const updates = [];
  const replacements = {
    userId,
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
      UPDATE users
      SET ${updates.join(", ")},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :userId
        AND status != 'deleted'
    `,
    {
      replacements,
    }
  );

  return getUserById(userId);
};

/*
|--------------------------------------------------------------------------
| Update User Status
|--------------------------------------------------------------------------
*/

const updateUserStatus = async (adminUserId, userId, status) => {
  const allowedStatuses = [
    "active",
    "suspended",
    "deleted",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid user status");
  }

  const previous = await getUserById(userId);
  await sequelize.query(
    `
      UPDATE users
      SET status = :status,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :userId
    `,
    {
      replacements: {
        userId,
        status,
      },
    }
  );

  const updated = await getUserById(userId);
  await AuditLog.create({ user_id: adminUserId, action: "user.status_updated", entity_type: "user", entity_id: updated.id, old_values_json: { status: previous.status }, new_values_json: { status: updated.status } });
  return updated;
};

/*
|--------------------------------------------------------------------------
| Delete User
|--------------------------------------------------------------------------
|
| Soft delete:
| status = deleted
|
*/

const deleteUser = async (userId) => {
  const [result] = await sequelize.query(
    `
      UPDATE users
      SET status = 'deleted',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = :userId
    `,
    {
      replacements: {
        userId,
      },
    }
  );

  if (!result.affectedRows) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return {
    message: "User deleted successfully",
  };
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};
