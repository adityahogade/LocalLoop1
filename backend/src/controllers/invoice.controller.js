const invoiceService = require("../services/invoice.service");

const list = async (req, res, next) => {
  try {
    const invoices = await invoiceService.listInvoices(req.user.id, req.user.roleId);
    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

const getPdf = async (req, res, next) => {
  try {
    const { invoice, filePath } = await invoiceService.getInvoicePdf(req.user.id, req.params.id, req.user.roleId);
    res.download(filePath, `${invoice.invoice_number}.pdf`);
  } catch (error) {
    next(error);
  }
};

module.exports = { list, getPdf };
