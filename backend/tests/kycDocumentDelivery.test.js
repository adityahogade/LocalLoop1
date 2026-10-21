require("dotenv").config();
const path = require("path");
const fs = require("fs");
const request = require("supertest");
const app = require("../src/app");
const { generateDocumentToken, verifyDocumentToken, generateAccessToken } = require("../src/utils/jwt");
const kycService = require("../src/services/kyc.service");
const { sequelize } = require("../src/config/database");

describe("KYC Document Delivery & Security", () => {
  let tempFilePath;
  const testFilename = "test-kyc-doc-12345.png";

  beforeAll(() => {
    // Ensure temporary test file exists in upload dir
    const { uploadDir } = require("../src/midleware/kycUpload");
    tempFilePath = path.resolve(uploadDir, testFilename);
    fs.writeFileSync(tempFilePath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])); // PNG magic bytes
  });

  afterAll(() => {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (_) {}
    }
    jest.restoreAllMocks();
  });

  describe("Token Generation and Validation", () => {
    test("generates and verifies short-lived document view token with filename binding", () => {
      const token = generateDocumentToken({
        userId: 10,
        roleId: 1,
        docFilename: testFilename,
      }, "15m");

      expect(typeof token).toBe("string");
      const decoded = verifyDocumentToken(token);
      expect(decoded.userId).toBe(10);
      expect(decoded.roleId).toBe(1);
      expect(decoded.docFilename).toBe(testFilename);
      expect(decoded.tokenType).toBe("kyc_doc_access");
    });

    test("verifyDocumentToken rejects standard access token without tokenType: kyc_doc_access", () => {
      const accessToken = generateAccessToken({ userId: 10, roleId: 1 });
      expect(() => verifyDocumentToken(accessToken)).toThrow("Invalid document token type");
    });
  });

  describe("Document Authorization Matrix", () => {
    beforeEach(() => {
      jest.spyOn(sequelize, "query").mockImplementation(async (sql, options) => {
        const queryStr = (typeof sql === "string" ? sql : sql.query).replace(/\s+/g, " ");
        if (queryStr.includes("FROM kyc_documents WHERE file_url LIKE :pattern")) {
          const pattern = options?.replacements?.pattern;
          if (pattern && pattern.includes(testFilename)) {
            return [[{
              id: 100,
              provider_id: 99,
              document_type: "id_proof",
              file_url: `private-uploads/kyc/${testFilename}`,
              status: "pending",
            }]];
          }
          return [[]];
        }
        if (queryStr.includes("SELECT id FROM providers WHERE user_id = :userId")) {
          const userId = options?.replacements?.userId;
          if (userId === 50) return [[{ id: 99 }]]; // Owner provider
          if (userId === 51) return [[{ id: 88 }]]; // Different provider
          return [[]];
        }
        return [[]];
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("Admin (roleId: 1) is authorized to access any KYC document", async () => {
      const adminUser = { id: 1, roleId: 1, role: "admin" };
      const doc = await kycService.getKycDocumentFile(adminUser, testFilename);
      expect(doc).toBeDefined();
      expect(doc.filename).toBe(testFilename);
      expect(doc.mimeType).toBe("image/png");
    });

    test("Provider (roleId: 3) is authorized to access their own KYC document", async () => {
      const ownerUser = { id: 50, roleId: 3, role: "provider" };
      const doc = await kycService.getKycDocumentFile(ownerUser, testFilename);
      expect(doc).toBeDefined();
      expect(doc.filename).toBe(testFilename);
    });

    test("Provider (roleId: 3) is FORBIDDEN from accessing another provider's document", async () => {
      const otherProviderUser = { id: 51, roleId: 3, role: "provider" };
      await expect(kycService.getKycDocumentFile(otherProviderUser, testFilename))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: "FORBIDDEN",
        });
    });

    test("Customer (roleId: 2) is FORBIDDEN from accessing KYC documents", async () => {
      const customerUser = { id: 77, roleId: 2, role: "customer" };
      await expect(kycService.getKycDocumentFile(customerUser, testFilename))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: "FORBIDDEN",
        });
    });

    test("Document-scoped token bound to document A cannot access document B", async () => {
      const userWithDocToken = {
        id: 1,
        roleId: 1,
        role: "admin",
        docTokenType: "kyc_doc_access",
        docFilename: "different-document.png",
      };
      await expect(kycService.getKycDocumentFile(userWithDocToken, testFilename))
        .rejects
        .toMatchObject({
          statusCode: 403,
          code: "FORBIDDEN",
        });
    });

    test("Missing file on storage throws 404 KYC_FILE_NOT_FOUND", async () => {
      const adminUser = { id: 1, roleId: 1, role: "admin" };
      await expect(kycService.getKycDocumentFile(adminUser, "non-existent-file.png"))
        .rejects
        .toMatchObject({
          statusCode: 404,
          code: "KYC_FILE_NOT_FOUND",
        });
    });

    test("createDocumentViewToken generates valid signed URL", async () => {
      const adminUser = { id: 1, roleId: 1, role: "admin" };
      const res = await kycService.createDocumentViewToken(adminUser, testFilename, "example.com", "https");
      expect(res.token).toBeDefined();
      expect(res.viewUrl).toContain("private-uploads/kyc/" + testFilename);
      expect(res.viewUrl).toContain("token=");
      expect(res.expiresIn).toBe(900);
    });
  });

  describe("HTTP Endpoint Delivery & Error Handling", () => {
    beforeEach(() => {
      jest.spyOn(sequelize, "query").mockImplementation(async (sql, options) => {
        const queryStr = (typeof sql === "string" ? sql : sql.query).replace(/\s+/g, " ");
        if (queryStr.includes("FROM kyc_documents WHERE file_url LIKE :pattern")) {
          const pattern = options?.replacements?.pattern;
          if (pattern && pattern.includes(testFilename)) {
            return [[{
              id: 100,
              provider_id: 99,
              document_type: "id_proof",
              file_url: `private-uploads/kyc/${testFilename}`,
              status: "pending",
            }]];
          }
          return [[]];
        }
        if (queryStr.includes("SELECT id FROM providers WHERE user_id = :userId")) {
          const userId = options?.replacements?.userId;
          if (userId === 50) return [[{ id: 99 }]];
          return [[]];
        }
        return [[]];
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("GET /private-uploads/kyc/:filename without token returns 401 JSON for API call", async () => {
      const res = await request(app)
        .get(`/private-uploads/kyc/${testFilename}`)
        .set("Accept", "application/json");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("AUTH_TOKEN_REQUIRED");
    });

    test("GET /private-uploads/kyc/:filename without token returns 401 HTML for browser direct visit", async () => {
      const res = await request(app)
        .get(`/private-uploads/kyc/${testFilename}`)
        .set("Accept", "text/html");

      expect(res.status).toBe(401);
      expect(res.text).toContain("Authentication Required");
      expect(res.text).toContain("401 UNAUTHORIZED");
    });

    test("GET /private-uploads/kyc/:filename with valid document view token streams document", async () => {
      const token = generateDocumentToken({
        userId: 1,
        roleId: 1,
        docFilename: testFilename,
      });

      const res = await request(app)
        .get(`/private-uploads/kyc/${testFilename}?token=${token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("image/png");
      expect(res.headers["cache-control"]).toContain("private");
    });

    test("GET /api/admin/kyc/documents/:filename/view-token generates signed view URL for Admin", async () => {
      const adminToken = generateAccessToken({ userId: 1, roleId: 1, role: "admin" });

      const res = await request(app)
        .get(`/api/admin/kyc/documents/${testFilename}/view-token`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.viewUrl).toContain(`/private-uploads/kyc/${testFilename}`);
    });

    test("GET /api/admin/kyc/documents/:filename/view-token is FORBIDDEN for customer (roleId: 2)", async () => {
      const customerToken = generateAccessToken({ userId: 77, roleId: 2, role: "customer" });

      const res = await request(app)
        .get(`/api/admin/kyc/documents/${testFilename}/view-token`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    test("GET /private-uploads/kyc/:filename on missing file returns 404 with friendly HTML in browser", async () => {
      const adminToken = generateAccessToken({ userId: 1, roleId: 1, role: "admin" });

      const res = await request(app)
        .get(`/private-uploads/kyc/missing-file.png?token=${adminToken}`)
        .set("Accept", "text/html");

      expect(res.status).toBe(404);
      expect(res.text).toContain("KYC Document Not Found");
      expect(res.text).toContain("404 ERROR");
    });
  });
});
