const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const generateDocumentToken = (payload, expiresIn = "15m") => {
  return jwt.sign({ ...payload, tokenType: "kyc_doc_access" }, JWT_SECRET, {
    expiresIn,
  });
};

const verifyDocumentToken = (token) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.tokenType !== "kyc_doc_access") {
    throw new Error("Invalid document token type");
  }
  return decoded;
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateDocumentToken,
  verifyDocumentToken,
};
