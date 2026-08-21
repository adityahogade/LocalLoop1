const accountingService = require("../services/accounting.service");

/*
|--------------------------------------------------------------------------
| Get Accounting Summary
|--------------------------------------------------------------------------
*/

const getAccountingSummary = async (req, res, next) => {
  try {
    console.log("ACCOUNTING USER DEBUG:", req.user);

    const userId =
      req.user?.userId ??
      req.user?.id ??
      req.user?.user_id;

    if (!userId) {
      throw new Error("Authenticated user ID not found");
    }

    const {
      period,
      from,
      to,
    } = req.query;

    const summary =
      await accountingService.getAccountingSummary(
        userId,
        period,
        from,
        to
      );

    return res.status(200).json({
      success: true,
      message: "Accounting summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => { try { res.json({ success: true, data: await accountingService.getAnalytics(req.user.id, req.query.from, req.query.to) }); } catch (error) { next(error); } };
module.exports = { getAccountingSummary, getAnalytics };
