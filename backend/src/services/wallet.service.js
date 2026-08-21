const { Op } = require("sequelize");
const { sequelize, Wallet, WalletTransaction, Customer, User } = require("../models");
const AppError = require("../utils/AppError");

const getWalletForCustomer = async (userId) => {
  const customer = await Customer.findOne({ where: { user_id: userId } });
  if (!customer) throw new AppError("Customer profile not found", 404, "CUSTOMER_NOT_FOUND");

  const wallet = await Wallet.findOne({
    where: { customer_id: customer.id },
    include: [{ model: WalletTransaction, as: "transactions", order: [["created_at", "DESC"]] }],
  });

  if (!wallet) {
    const created = await Wallet.create({ customer_id: customer.id, balance: 0 });
    return { ...created.toJSON(), transactions: [] };
  }

  return wallet;
};

const getWalletTransactions = async (userId, page = 1, limit = 20) => {
  const customer = await Customer.findOne({ where: { user_id: userId } });
  if (!customer) throw new AppError("Customer profile not found", 404, "CUSTOMER_NOT_FOUND");

  const wallet = await Wallet.findOne({ where: { customer_id: customer.id } });
  if (!wallet) {
    return { rows: [], count: 0, page, limit, totalPages: 0 };
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { count, rows } = await WalletTransaction.findAndCountAll({
    where: { wallet_id: wallet.id },
    order: [["created_at", "DESC"]],
    limit: Number(limit),
    offset,
  });

  return {
    rows,
    count,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.max(1, Math.ceil(count / Number(limit))) || 0,
  };
};

const creditWallet = async (customerId, amount, options = {}) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError("Invalid wallet credit amount", 400, "INVALID_WALLET_AMOUNT");
  }

  const execute = async (transaction) => {
    let wallet = await Wallet.findOne({ where: { customer_id: customerId }, transaction, lock: transaction.LOCK.UPDATE });

    if (!wallet) {
      wallet = await Wallet.create({ customer_id: customerId, balance: 0 }, { transaction });
    }

    const newBalance = Number(wallet.balance || 0) + numericAmount;
    await wallet.update({ balance: newBalance }, { transaction });

    const entry = await WalletTransaction.create({
      wallet_id: wallet.id,
      type: options.type || "credit",
      amount: numericAmount,
      balance_after: newBalance,
      reference_type: options.reference_type || "manual_admin_adjustment",
      reference_id: options.reference_id || null,
      description: options.description || "Wallet credit",
    }, { transaction });

    return { wallet, transaction: entry };
  };
  return options.transaction ? execute(options.transaction) : sequelize.transaction(execute);
};

const debitWallet = async (customerId, amount, options = {}) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError("Invalid wallet debit amount", 400, "INVALID_WALLET_AMOUNT");
  }

  const execute = async (transaction) => {
    let wallet = await Wallet.findOne({ where: { customer_id: customerId }, transaction, lock: transaction.LOCK.UPDATE });

    if (!wallet) {
      throw new AppError("Wallet not found", 404, "WALLET_NOT_FOUND");
    }

    const currentBalance = Number(wallet.balance || 0);
    if (currentBalance < numericAmount) {
      throw new AppError("Insufficient wallet balance", 409, "INSUFFICIENT_WALLET_BALANCE");
    }

    const newBalance = currentBalance - numericAmount;
    await wallet.update({ balance: newBalance }, { transaction });

    const entry = await WalletTransaction.create({
      wallet_id: wallet.id,
      type: options.type || "debit",
      amount: numericAmount,
      balance_after: newBalance,
      reference_type: options.reference_type || "order",
      reference_id: options.reference_id || null,
      description: options.description || "Wallet debit",
    }, { transaction });

    return { wallet, transaction: entry };
  };
  return options.transaction ? execute(options.transaction) : sequelize.transaction(execute);
};

const ensureWalletForCustomer = async (customerId) => {
  const wallet = await Wallet.findOne({ where: { customer_id: customerId } });
  if (wallet) return wallet;
  return Wallet.create({ customer_id: customerId, balance: 0 });
};

module.exports = {
  getWalletForCustomer,
  getWalletTransactions,
  creditWallet,
  debitWallet,
  ensureWalletForCustomer,
};
