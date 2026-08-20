const bankAccountService = require("../services/bankAccount.service");

/*
|--------------------------------------------------------------------------
| Get My Bank Account
|--------------------------------------------------------------------------
*/

const getMyBankAccount = async (req, res, next) => {
  try {
    const account =
      await bankAccountService.getMyBankAccount(
        req.user.id
      );

    return res.status(200).json({
      success: true,
      message: "Bank account fetched successfully",
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Create Bank Account
|--------------------------------------------------------------------------
*/

const createBankAccount = async (req, res, next) => {
  try {
    const account =
      await bankAccountService.createBankAccount(
        req.user.id,
        req.body
      );

    return res.status(201).json({
      success: true,
      message: "Bank account created successfully",
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update Bank Account
|--------------------------------------------------------------------------
*/

const updateBankAccount = async (req, res, next) => {
  try {
    const account =
      await bankAccountService.updateBankAccount(
        req.user.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Bank account updated successfully",
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Delete Bank Account
|--------------------------------------------------------------------------
*/

const deleteBankAccount = async (req, res, next) => {
  try {
    const result =
      await bankAccountService.deleteBankAccount(
        req.user.id
      );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBankAccount,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
};