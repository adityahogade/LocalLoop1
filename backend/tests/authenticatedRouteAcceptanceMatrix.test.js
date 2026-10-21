process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const express = require("express");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const authenticate = require("../src/midleware/auth");
const authorize = require("../src/midleware/authorize");
const validate = require("../src/midleware/validate");

const buildApp = () => {
  const app = express();

  app.use(express.json());

  app.get("/api/admin/stats", authenticate, authorize(1), (req, res) => {
    res.status(200).json({ success: true, data: { ok: true } });
  });

  app.get("/api/providers/me", authenticate, authorize(3), (req, res) => {
    res.status(200).json({ success: true, data: { id: req.user.id, roleId: req.user.roleId } });
  });

  app.get("/api/orders/:id", authenticate, authorize(2, 3), validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }), (req, res) => {
    if (Number(req.params.id) === 42 && Number(req.user.id) === 42) {
      return res.status(200).json({ success: true, data: { id: req.params.id } });
    }

    if (Number(req.params.id) === 42 && Number(req.user.id) !== 42) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN" } });
    }

    return res.status(404).json({ success: false, error: { code: "ORDER_NOT_FOUND" } });
  });

  app.get("/api/support/tickets/:id", authenticate, validate({ params: Joi.object({ id: Joi.number().integer().positive().required() }) }), (req, res) => {
    if (Number(req.params.id) === 7 && Number(req.user.id) === 7) {
      return res.status(200).json({ success: true, data: { id: req.params.id, user_id: req.user.id } });
    }

    if (Number(req.params.id) === 7 && Number(req.user.id) !== 7) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN" } });
    }

    return res.status(404).json({ success: false, error: { code: "TICKET_NOT_FOUND" } });
  });

  return app;
};

const signToken = (roleId, userId = 1) => jwt.sign({ userId, roleId }, process.env.JWT_SECRET, { expiresIn: "1h" });

const buildAuthHeader = (roleId, userId = 1) => `Bearer ${signToken(roleId, userId)}`;

describe("authenticated route acceptance matrix", () => {
  const app = buildApp();

  test.each([
    ["GET /api/admin/stats", "GET", "/api/admin/stats", undefined, 401],
    ["GET /api/admin/stats", "GET", "/api/admin/stats", "Bearer invalid.token", 401],
    ["GET /api/admin/stats", "GET", "/api/admin/stats", buildAuthHeader(2, 9), 403],
    ["GET /api/admin/stats", "GET", "/api/admin/stats", buildAuthHeader(1, 1), 200],
  ])("admin route matrix: %s", async (_label, method, path, token, expected) => {
    const req = request(app)[method.toLowerCase()](path);
    if (token) {
      req.set({ Authorization: token });
    }
    const res = await req;
    expect(res.status).toBe(expected);
  });

  test.each([
    ["GET /api/providers/me", "GET", "/api/providers/me", undefined, 401],
    ["GET /api/providers/me", "GET", "/api/providers/me", buildAuthHeader(1, 1), 403],
    ["GET /api/providers/me", "GET", "/api/providers/me", buildAuthHeader(3, 15), 200],
  ])("provider route matrix: %s", async (_label, method, path, token, expected) => {
    const req = request(app)[method.toLowerCase()](path);
    if (token) {
      req.set({ Authorization: token });
    }
    const res = await req;
    expect(res.status).toBe(expected);
  });

  test.each([
    ["GET /api/orders/42", "GET", "/api/orders/42", buildAuthHeader(2, 42), 200],
    ["GET /api/orders/42", "GET", "/api/orders/42", buildAuthHeader(3, 42), 200],
    ["GET /api/orders/42", "GET", "/api/orders/42", buildAuthHeader(2, 99), 403],
    ["GET /api/orders/42", "GET", "/api/orders/42", buildAuthHeader(1, 1), 403],
    ["GET /api/orders/wrong-id", "GET", "/api/orders/wrong-id", buildAuthHeader(2, 42), 400],
    ["GET /api/orders/999999", "GET", "/api/orders/999999", buildAuthHeader(2, 42), 404],
  ])("order route matrix: %s", async (_label, method, path, token, expected) => {
    const res = await request(app)
      [method.toLowerCase()](path)
      .set({ Authorization: token });

    expect(res.status).toBe(expected);
  });

  test.each([
    ["GET /api/support/tickets/7", "GET", "/api/support/tickets/7", buildAuthHeader(2, 7), 200],
    ["GET /api/support/tickets/7", "GET", "/api/support/tickets/7", buildAuthHeader(2, 99), 403],
    ["GET /api/support/tickets/999999", "GET", "/api/support/tickets/999999", buildAuthHeader(2, 7), 404],
    ["GET /api/support/tickets/abc", "GET", "/api/support/tickets/abc", buildAuthHeader(2, 7), 400],
    ["GET /api/support/tickets/7", "GET", "/api/support/tickets/7", undefined, 401],
    ["GET /api/support/tickets/7", "GET", "/api/support/tickets/7", "Bearer invalid.token", 401],
  ])("support ticket matrix: %s", async (_label, method, path, token, expected) => {
    const req = request(app)[method.toLowerCase()](path);
    if (token) {
      req.set({ Authorization: token });
    }

    const res = await req;
    expect(res.status).toBe(expected);
  });
});
