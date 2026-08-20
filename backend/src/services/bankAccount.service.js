const { sequelize } = require("../config/database");
const {
  encryptBankAccount,
} = require("../utils/bankEncryption");

/*
|--------------------------------------------------------------------------
| Get Provider
|--------------------------------------------------------------------------
*/

const getProviderByUserId = async (userId) => {
  const [providers] = await sequelize.query(
    `
      SELECT
        id,
        user_id,
        kyc_status,
        is_active
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

  return providers[0];
};

/*
|--------------------------------------------------------------------------
| Format Bank Account Response
|--------------------------------------------------------------------------
|
| Never expose account_number_encrypted.
|
|--------------------------------------------------------------------------
*/

const sanitizeBankAccount = (account) => {
  if (!account) {
    return null;
  }

  return {
    id: account.id,
    provider_id: account.provider_id,
    account_holder_name: account.account_holder_name,
    account_number_last4: account.account_number_last4,
    ifsc_code: account.ifsc_code,
    bank_name: account.bank_name,
    verified: Number(account.verified) === 1,
    created_at: account.created_at,
    updated_at: account.updated_at,
  };
};

/*
|--------------------------------------------------------------------------
| Get My Bank Account
|--------------------------------------------------------------------------
*/

const getMyBankAccount = async (userId) => {
  const provider = await getProviderByUserId(userId);

  const [accounts] = await sequelize.query(
    `
      SELECT
        id,
        provider_id,
        account_holder_name,
        account_number_last4,
        ifsc_code,
        bank_name,
        verified,
        created_at,
        updated_at
      FROM provider_bank_accounts
      WHERE provider_id = :providerId
      LIMIT 1
    `,
    {
      replacements: {
        providerId: provider.id,
      },
    }
  );

  if (!accounts.length) {
    throw new Error("Bank account not found");
  }

  return sanitizeBankAccount(accounts[0]);
};

/*
|--------------------------------------------------------------------------
| Create Bank Account
|--------------------------------------------------------------------------
*/

const createBankAccount = async (userId, data) => {
  const provider = await getProviderByUserId(userId);

  /*
  |--------------------------------------------------------------------------
  | One bank account per provider
  |--------------------------------------------------------------------------
  */

  const [existingAccounts] = await sequelize.query(
    `
      SELECT id
      FROM provider_bank_accounts
      WHERE provider_id = :providerId
      LIMIT 1
    `,
    {
      replacements: {
        providerId: provider.id,
      },
    }
  );

  if (existingAccounts.length) {
    throw new Error("Provider bank account already exists");
  }

  const accountNumber = data.account_number.trim();

  const encryptedAccountNumber =
    encryptBankAccount(accountNumber);

  const last4 = accountNumber.slice(-4);

  await sequelize.query(
    `
      INSERT INTO provider_bank_accounts
      (
        provider_id,
        account_holder_name,
        account_number_encrypted,
        account_number_last4,
        ifsc_code,
        bank_name,
        verified,
        created_at,
        updated_at
      )
      VALUES
      (
        :providerId,
        :accountHolderName,
        :accountNumberEncrypted,
        :accountNumberLast4,
        :ifscCode,
        :bankName,
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `,
    {
      replacements: {
        providerId: provider.id,
        accountHolderName: data.account_holder_name,
        accountNumberEncrypted: encryptedAccountNumber,
        accountNumberLast4: last4,
        ifscCode: data.ifsc_code,
        bankName: data.bank_name,
      },
    }
  );

  return getMyBankAccount(userId);
};

/*
|--------------------------------------------------------------------------
| Update Bank Account
|--------------------------------------------------------------------------
*/

const updateBankAccount = async (userId, data) => {
  const provider = await getProviderByUserId(userId);

  const [accounts] = await sequelize.query(
    `
      SELECT
        id
      FROM provider_bank_accounts
      WHERE provider_id = :providerId
      LIMIT 1
    `,
    {
      replacements: {
        providerId: provider.id,
      },
    }
  );

  if (!accounts.length) {
    throw new Error("Bank account not found");
  }

  const updates = [];
  const replacements = {
    providerId: provider.id,
  };

  if (data.account_holder_name !== undefined) {
    updates.push(
      "account_holder_name = :accountHolderName"
    );

    replacements.accountHolderName =
      data.account_holder_name;
  }

  if (data.ifsc_code !== undefined) {
    updates.push("ifsc_code = :ifscCode");

    replacements.ifscCode = data.ifsc_code;
  }

  if (data.bank_name !== undefined) {
    updates.push("bank_name = :bankName");

    replacements.bankName = data.bank_name;
  }

  /*
  |--------------------------------------------------------------------------
  | Account Number
  |--------------------------------------------------------------------------
  */

  if (data.account_number !== undefined) {
    const accountNumber =
      data.account_number.trim();

    const encryptedAccountNumber =
      encryptBankAccount(accountNumber);

    updates.push(
      "account_number_encrypted = :accountNumberEncrypted"
    );

    updates.push(
      "account_number_last4 = :accountNumberLast4"
    );

    replacements.accountNumberEncrypted =
      encryptedAccountNumber;

    replacements.accountNumberLast4 =
      accountNumber.slice(-4);

    /*
    |----------------------------------------------------------------------
    | Changing bank details requires re-verification
    |----------------------------------------------------------------------
    */

    updates.push("verified = 0");
  }

  if (!updates.length) {
    throw new Error("No fields to update");
  }

  await sequelize.query(
    `
      UPDATE provider_bank_accounts
      SET
        ${updates.join(", ")},
        updated_at = CURRENT_TIMESTAMP
      WHERE provider_id = :providerId
    `,
    {
      replacements,
    }
  );

  return getMyBankAccount(userId);
};

/*
|--------------------------------------------------------------------------
| Delete Bank Account
|--------------------------------------------------------------------------
*/

const deleteBankAccount = async (userId) => {
  const provider = await getProviderByUserId(userId);

  const [accounts] = await sequelize.query(
    `
      SELECT id
      FROM provider_bank_accounts
      WHERE provider_id = :providerId
      LIMIT 1
    `,
    {
      replacements: {
        providerId: provider.id,
      },
    }
  );

  if (!accounts.length) {
    throw new Error("Bank account not found");
  }

  await sequelize.query(
    `
      DELETE FROM provider_bank_accounts
      WHERE provider_id = :providerId
    `,
    {
      replacements: {
        providerId: provider.id,
      },
    }
  );

  return {
    message: "Bank account deleted successfully",
  };
};

module.exports = {
  getMyBankAccount,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
};