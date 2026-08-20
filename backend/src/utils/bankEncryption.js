const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

const getEncryptionKey = () => {
  const key = process.env.BANK_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("BANK_ENCRYPTION_KEY is not configured");
  }

  const buffer = Buffer.from(key, "hex");

  if (buffer.length !== 32) {
    throw new Error(
      "BANK_ENCRYPTION_KEY must be a 64-character hexadecimal string"
    );
  }

  return buffer;
};

/*
|--------------------------------------------------------------------------
| Encrypt Bank Account Number
|--------------------------------------------------------------------------
*/

const encryptBankAccount = (accountNumber) => {
  const key = getEncryptionKey();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(accountNumber, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  /*
  |----------------------------------------------------------------------
  | Stored format:
  | IV + AuthTag + CipherText
  |----------------------------------------------------------------------
  */

  return Buffer.concat([
    iv,
    authTag,
    encrypted,
  ]);
};

module.exports = {
  encryptBankAccount,
};
