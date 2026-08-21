const walletService = require("../services/wallet.service");

const getWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getWalletForCustomer(req.user.id);
    res.json({ success: true, data: wallet });
  } catch (error) {
    next(error);
  }
};

const listTransactions = async (req, res, next) => {
  try {
    const data = await walletService.getWalletTransactions(req.user.id, req.query.page || 1, req.query.limit || 20);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWallet, listTransactions };
