const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDir = path.resolve(__dirname, "../../private-uploads/kyc");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) return callback(new Error("Unsupported KYC file type"));
    callback(null, true);
  },
});

const hasValidSignature = async (file) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.has(extension)) return false;
  const handle = await fs.promises.open(file.path, "r");
  try {
    const buffer = Buffer.alloc(8);
    await handle.read(buffer, 0, 8, 0);
    if (extension === ".pdf") return buffer.subarray(0, 4).toString() === "%PDF";
    if (extension === ".png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    return buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  } finally {
    await handle.close();
  }
};

module.exports = { upload, hasValidSignature, uploadDir };
