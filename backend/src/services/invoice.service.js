const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { Invoice, Payment, Order, Customer, Provider, sequelize } = require("../models");
const AppError = require("../utils/AppError");

const buildInvoiceNumber = () => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${stamp}-${random}`;
};

const createInvoiceForPayment = async (paymentId, options = {}) => {
  const payment = await Payment.findByPk(paymentId, { include: [{ model: Customer, as: "customer" }] });
  if (!payment) throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");

  const existingInvoice = await Invoice.findOne({
    where: {
      reference_type: payment.reference_type,
      reference_id: payment.reference_id,
      customer_id: payment.customer_id,
    },
  });

  if (existingInvoice) return existingInvoice;

  const order = payment.reference_type === "order"
    ? await Order.findByPk(payment.reference_id, { include: [{ model: Provider, as: "provider" }] })
    : null;
  const providerId = order?.provider_id || options.provider_id || null;
  if (!providerId) throw new AppError("Provider not found for invoice", 404, "PROVIDER_NOT_FOUND");

  const invoiceNumber = buildInvoiceNumber();
  const issuedAt = new Date();
  const subtotal = Number(payment.amount || order?.total_amount || 0);
  const discount = Number(order?.discount_amount || 0);
  const tax = 0;
  const total = subtotal - discount + tax;

  const invoice = await Invoice.create({
    invoice_number: invoiceNumber,
    customer_id: payment.customer_id,
    provider_id: providerId,
    reference_type: payment.reference_type,
    reference_id: payment.reference_id,
    subtotal,
    discount,
    tax,
    total,
    payment_status: payment.status === "paid" ? "paid" : "unpaid",
    pdf_url: null,
    issued_at: issuedAt,
  });

  const uploadsDir = path.join(__dirname, "../../uploads/invoices");
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  const pdfPath = path.join(uploadsDir, `${invoice.id}.pdf`);

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);
  doc.fontSize(20).text("ServiceHub Invoice", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice #: ${invoice.invoice_number}`);
  doc.text(`Issued: ${issuedAt.toISOString().slice(0, 10)}`);
  doc.text(`Customer: ${payment.customer?.user_id ? `Customer #${payment.customer_id}` : `Customer #${payment.customer_id}`}`);
  doc.text(`Provider: ${providerId}`);
  doc.text(`Reference: ${payment.reference_type} #${payment.reference_id}`);
  doc.moveDown();
  doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`);
  doc.text(`Discount: ₹${discount.toFixed(2)}`);
  doc.text(`Tax: ₹${tax.toFixed(2)}`);
  doc.text(`Total: ₹${total.toFixed(2)}`);
  doc.text(`Payment status: ${invoice.payment_status}`);
  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  const publicUrl = `/uploads/invoices/${invoice.id}.pdf`;
  await invoice.update({ pdf_url: publicUrl });
  return invoice;
};

const listInvoices = async (userId, roleId) => {
  const where = Number(roleId) === 3
    ? { provider_id: (await Provider.findOne({ where: { user_id: userId }, attributes: ["id"] }))?.id }
    : { customer_id: (await Customer.findOne({ where: { user_id: userId }, attributes: ["id"] }))?.id };
  return Invoice.findAll({
    where,
    order: [["issued_at", "DESC"]],
  });
};

const getInvoicePdf = async (userId, invoiceId, roleId) => {
  const invoice = await Invoice.findByPk(invoiceId);
  if (!invoice) throw new AppError("Invoice not found", 404, "INVOICE_NOT_FOUND");

  const profileId = Number(roleId) === 3
    ? (await Provider.findOne({ where: { user_id: userId }, attributes: ["id"] }))?.id
    : (await Customer.findOne({ where: { user_id: userId }, attributes: ["id"] }))?.id;
  const ownerCheck = Number(roleId) === 3 ? invoice.provider_id !== profileId : invoice.customer_id !== profileId;
  if (ownerCheck) throw new AppError("Forbidden", 403, "FORBIDDEN");

  const filePath = path.join(__dirname, "../../uploads/invoices", `${invoice.id}.pdf`);
  if (!fs.existsSync(filePath)) {
    throw new AppError("Invoice PDF not found", 404, "INVOICE_PDF_NOT_FOUND");
  }

  return { invoice, filePath };
};

module.exports = {
  createInvoiceForPayment,
  listInvoices,
  getInvoicePdf,
  buildInvoiceNumber,
};
