const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { Invoice, Payment, Order, Customer, Provider, User, SubscriptionPayment, CustomerSubscription, Service, ServicePlan, Address, sequelize } = require("../models");
const AppError = require("../utils/AppError");

const buildInvoiceNumber = () => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${stamp}-${random}`;
};

const generateInvoicePdf = async (invoice, filePath) => {
  const uploadsDir = path.dirname(filePath);
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  // Load customer
  const customer = await Customer.findByPk(invoice.customer_id, {
    include: [{ model: User, as: "user" }]
  });

  // Load provider
  const provider = await Provider.findByPk(invoice.provider_id, {
    include: [{ model: User, as: "user" }]
  });

  // Load reference details
  let serviceName = "Service Delivery";
  let planFrequency = "Standard Plan";
  let quantity = 1;
  let unit = "unit";
  let unitPrice = Number(invoice.total || 0);
  let deliverySlot = null;
  let startDate = null;
  let nextBillingDate = null;
  let addressText = null;
  let paymentMethod = "Online Payment";
  let paymentRef = null;
  let paymentDate = invoice.issued_at || new Date();

  if (invoice.reference_type === "subscription_payment") {
    const subPayment = await SubscriptionPayment.findByPk(invoice.reference_id, {
      include: [
        {
          model: CustomerSubscription,
          as: "subscription",
          include: [
            { model: Service, as: "service" },
            { model: ServicePlan, as: "servicePlan" },
            { model: Address, as: "address" }
          ]
        }
      ]
    });

    if (subPayment) {
      if (subPayment.payment_id) {
        const p = await Payment.findByPk(subPayment.payment_id);
        if (p) {
          paymentMethod = p.method ? (p.method === 'mock' ? 'Online (Mock Payment)' : p.method.toUpperCase()) : 'Online Payment';
          paymentRef = p.gateway_payment_id || `PAY-${p.id}`;
          if (p.created_at || p.paid_at) paymentDate = p.paid_at || p.created_at;
        }
      }

      const sub = subPayment.subscription;
      if (sub) {
        serviceName = sub.service?.name || "Subscription Service";
        unit = sub.service?.unit || "unit";
        planFrequency = sub.servicePlan?.frequency
          ? `${sub.servicePlan.frequency.charAt(0).toUpperCase() + sub.servicePlan.frequency.slice(1)} Plan`
          : "Monthly Plan";
        quantity = Number(sub.quantity || 1);
        unitPrice = Number(sub.servicePlan?.price || (Number(invoice.total) / quantity));
        deliverySlot = sub.delivery_time_slot === "custom" ? sub.custom_time : sub.delivery_time_slot;
        startDate = sub.start_date;
        nextBillingDate = sub.next_billing_date;

        if (sub.address) {
          addressText = [
            sub.address.house_no,
            sub.address.building,
            sub.address.street,
            sub.address.area,
            sub.address.city,
            sub.address.state,
            sub.address.pincode
          ].filter(Boolean).join(", ");
        }
      }
    }
  } else if (invoice.reference_type === "order") {
    const order = await Order.findByPk(invoice.reference_id, {
      include: [
        { model: Service, as: "service" },
        { model: Address, as: "address" }
      ]
    });

    if (order) {
      serviceName = order.service?.name || "On-Demand Service";
      unit = order.service?.unit || "service";
      planFrequency = "One-Time Service";
      quantity = Number(order.quantity || 1);
      unitPrice = Number(order.unit_price || (Number(invoice.subtotal) / quantity));
      deliverySlot = order.scheduled_time_slot;
      startDate = order.scheduled_date;

      const p = await Payment.findOne({ where: { reference_type: "order", reference_id: order.id } });
      if (p) {
        paymentMethod = p.method ? (p.method === 'mock' ? 'Online (Mock Payment)' : p.method.toUpperCase()) : 'Online Payment';
        paymentRef = p.gateway_payment_id || `PAY-${p.id}`;
        if (p.created_at || p.paid_at) paymentDate = p.paid_at || p.created_at;
      }

      if (order.address) {
        addressText = [
          order.address.house_no,
          order.address.building,
          order.address.street,
          order.address.area,
          order.address.city,
          order.address.state,
          order.address.pincode
        ].filter(Boolean).join(", ");
      }
    }
  }

  // Fallback to customer's default address if addressText is still null
  if (!addressText && invoice.customer_id) {
    const addr = await Address.findOne({ where: { customer_id: invoice.customer_id, is_default: true } });
    if (addr) {
      addressText = [addr.house_no, addr.building, addr.street, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
    }
  }

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const primaryColor = "#1E3A8A";   // Navy Blue
  const secondaryColor = "#2563EB"; // Vibrant Blue
  const darkTextColor = "#0F172A";  // Slate 900
  const mutedTextColor = "#64748B"; // Slate 500
  const lightBgColor = "#F8FAFC";   // Slate 50
  const borderColor = "#E2E8F0";    // Slate 200
  const successColor = "#059669";   // Emerald Green

  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;
  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? String(dateInput) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  // --- HEADER SECTION ---
  doc.rect(40, 40, 515, 65).fill("#F8FAFC");
  doc.rect(40, 40, 5, 65).fill(secondaryColor);

  // Platform Brand
  doc.fillColor(primaryColor).fontSize(20).font("Helvetica-Bold").text("ServiceHub", 55, 52);
  doc.fillColor(mutedTextColor).fontSize(9).font("Helvetica").text("Local Services • Delivered Locally", 55, 75);
  doc.fillColor(mutedTextColor).fontSize(8).text("support@servicehub.com  •  www.servicehub.com", 55, 88);

  // Invoice Title & Status Badge
  doc.fillColor(primaryColor).fontSize(16).font("Helvetica-Bold").text("SERVICE INVOICE", 360, 50, { align: "right", width: 180 });
  
  // Paid Pill Badge
  if (invoice.payment_status?.toLowerCase() === "paid") {
    doc.roundedRect(485, 72, 55, 18, 9).fill("#D1FAE5");
    doc.fillColor(successColor).fontSize(8).font("Helvetica-Bold").text("✓ PAID", 485, 76, { align: "center", width: 55 });
  } else {
    doc.roundedRect(475, 72, 65, 18, 9).fill("#FEF3C7");
    doc.fillColor("#D97706").fontSize(8).font("Helvetica-Bold").text("PENDING", 475, 76, { align: "center", width: 65 });
  }

  // --- INVOICE META ROW ---
  const metaY = 120;
  doc.rect(40, metaY, 515, 42).fillAndStroke(lightBgColor, borderColor);

  const colW = 515 / 3;
  // Invoice Number
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("INVOICE NUMBER", 50, metaY + 8);
  doc.fillColor(darkTextColor).fontSize(10).font("Helvetica-Bold").text(invoice.invoice_number, 50, metaY + 20);

  // Issue Date
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("ISSUE DATE", 50 + colW, metaY + 8);
  doc.fillColor(darkTextColor).fontSize(10).font("Helvetica-Bold").text(formatDate(invoice.issued_at), 50 + colW, metaY + 20);

  // Payment Reference
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("PAYMENT REFERENCE", 50 + (colW * 2), metaY + 8);
  doc.fillColor(darkTextColor).fontSize(10).font("Helvetica-Bold").text(paymentRef || `REF-${invoice.reference_id}`, 50 + (colW * 2), metaY + 20);

  // --- BILLED TO & SERVICE PROVIDER BOXES ---
  const partyY = 175;
  const boxW = 250;
  const boxH = 95;

  // Customer Box
  doc.rect(40, partyY, boxW, boxH).fillAndStroke(lightBgColor, borderColor);
  doc.fillColor(secondaryColor).fontSize(9).font("Helvetica-Bold").text("BILLED TO (CUSTOMER)", 50, partyY + 10);
  doc.fillColor(darkTextColor).fontSize(10).font("Helvetica-Bold").text(customer?.user?.full_name || "Valued Customer", 50, partyY + 24);
  doc.fillColor(mutedTextColor).fontSize(8.5).font("Helvetica").text(`Email: ${customer?.user?.email || "N/A"}`, 50, partyY + 38);
  doc.fillColor(mutedTextColor).fontSize(8.5).text(`Phone: ${customer?.user?.phone || "N/A"}`, 50, partyY + 50);
  if (addressText) {
    doc.fillColor(mutedTextColor).fontSize(8).text(`Address: ${addressText}`, 50, partyY + 62, { width: boxW - 20, height: 28, ellipsis: true });
  }

  // Provider Box
  const provX = 305;
  doc.rect(provX, partyY, boxW, boxH).fillAndStroke(lightBgColor, borderColor);
  doc.fillColor(secondaryColor).fontSize(9).font("Helvetica-Bold").text("SERVICE PROVIDER", provX + 10, partyY + 10);
  doc.fillColor(darkTextColor).fontSize(10).font("Helvetica-Bold").text(provider?.business_name || "Authorized Service Partner", provX + 10, partyY + 24);
  if (provider?.user?.email) {
    doc.fillColor(mutedTextColor).fontSize(8.5).font("Helvetica").text(`Email: ${provider.user.email}`, provX + 10, partyY + 38);
  }
  if (provider?.user?.phone) {
    doc.fillColor(mutedTextColor).fontSize(8.5).font("Helvetica").text(`Phone: ${provider.user.phone}`, provX + 10, partyY + 50);
  }
  doc.fillColor(mutedTextColor).fontSize(8).text("Fulfillment: Local Delivery Partner", provX + 10, partyY + 62);

  // --- ITEMIZED SERVICE BILLING TABLE ---
  const tableY = 285;
  // Table Header Bar
  doc.rect(40, tableY, 515, 24).fill("#1E293B");
  doc.fillColor("#FFFFFF").fontSize(8.5).font("Helvetica-Bold");
  doc.text("SERVICE DESCRIPTION", 50, tableY + 7);
  doc.text("PLAN / FREQUENCY", 220, tableY + 7);
  doc.text("QTY", 340, tableY + 7, { width: 40, align: "center" });
  doc.text("UNIT PRICE", 390, tableY + 7, { width: 75, align: "right" });
  doc.text("AMOUNT", 470, tableY + 7, { width: 75, align: "right" });

  // Table Data Row
  const rowY = tableY + 24;
  doc.rect(40, rowY, 515, 36).fillAndStroke("#FFFFFF", borderColor);

  // Service Description
  doc.fillColor(darkTextColor).fontSize(9.5).font("Helvetica-Bold").text(serviceName, 50, rowY + 8);
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica").text(`Fulfilled by ${provider?.business_name || "Local Provider"}`, 50, rowY + 20);

  // Plan / Frequency
  doc.fillColor(darkTextColor).fontSize(9).font("Helvetica").text(planFrequency, 220, rowY + 12);

  // Quantity
  doc.fillColor(darkTextColor).fontSize(9).font("Helvetica").text(`${quantity} ${unit}`, 340, rowY + 12, { width: 40, align: "center" });

  // Unit Price
  doc.fillColor(darkTextColor).fontSize(9).font("Helvetica").text(formatCurrency(unitPrice), 390, rowY + 12, { width: 75, align: "right" });

  // Total
  doc.fillColor(darkTextColor).fontSize(9.5).font("Helvetica-Bold").text(formatCurrency(invoice.subtotal), 470, rowY + 12, { width: 75, align: "right" });

  // --- SUBSCRIPTION SCHEDULE (IF APPLICABLE) ---
  let nextSectionY = rowY + 46;
  if (startDate || deliverySlot) {
    doc.rect(40, nextSectionY, 515, 32).fillAndStroke("#EFF6FF", "#BFDBFE");
    doc.fillColor("#1D4ED8").fontSize(8.5).font("Helvetica-Bold").text("Subscription Schedule & Delivery Details:", 50, nextSectionY + 6);
    
    const slotStr = deliverySlot ? `Slot: ${deliverySlot.charAt(0).toUpperCase() + deliverySlot.slice(1)}` : "";
    const startStr = startDate ? `Start: ${formatDate(startDate)}` : "";
    const nextStr = nextBillingDate ? `Next Billing: ${formatDate(nextBillingDate)}` : "";
    const detailsLine = [slotStr, startStr, nextStr].filter(Boolean).join("   •   ");
    
    doc.fillColor("#1E40AF").fontSize(8).font("Helvetica").text(detailsLine, 50, nextSectionY + 18);
    nextSectionY += 40;
  }

  // --- BILLING SUMMARY & PAYMENT INFO ---
  const summaryY = nextSectionY + 10;

  // Left: Payment & Verification Note
  const payBoxW = 260;
  doc.rect(40, summaryY, payBoxW, 90).fillAndStroke(lightBgColor, borderColor);
  doc.fillColor(secondaryColor).fontSize(9).font("Helvetica-Bold").text("PAYMENT DETAILS", 50, summaryY + 10);
  doc.fillColor(darkTextColor).fontSize(8.5).font("Helvetica").text(`Payment Status: `, 50, summaryY + 26);
  doc.fillColor(successColor).font("Helvetica-Bold").text("PAID (Verified)", 125, summaryY + 26);

  doc.fillColor(darkTextColor).font("Helvetica").text(`Payment Method: ${paymentMethod}`, 50, summaryY + 40);
  doc.fillColor(darkTextColor).text(`Payment Date: ${formatDate(paymentDate)}`, 50, summaryY + 54);
  if (paymentRef) {
    doc.fillColor(darkTextColor).text(`Transaction Ref: ${paymentRef}`, 50, summaryY + 68);
  }

  // Right: Summary Numbers
  const sumX = 320;
  const sumW = 235;
  doc.rect(sumX, summaryY, sumW, 90).fillAndStroke("#FFFFFF", borderColor);

  // Subtotal
  doc.fillColor(mutedTextColor).fontSize(9).font("Helvetica").text("Subtotal", sumX + 12, summaryY + 10);
  doc.fillColor(darkTextColor).font("Helvetica-Bold").text(formatCurrency(invoice.subtotal), sumX + 100, summaryY + 10, { width: 120, align: "right" });

  // Discount
  doc.fillColor(mutedTextColor).fontSize(9).font("Helvetica").text("Discount", sumX + 12, summaryY + 26);
  doc.fillColor(darkTextColor).font("Helvetica-Bold").text(`-${formatCurrency(invoice.discount)}`, sumX + 100, summaryY + 26, { width: 120, align: "right" });

  // Taxes
  doc.fillColor(mutedTextColor).fontSize(9).font("Helvetica").text("Taxes & Fees", sumX + 12, summaryY + 42);
  doc.fillColor(darkTextColor).font("Helvetica-Bold").text(formatCurrency(invoice.tax), sumX + 100, summaryY + 42, { width: 120, align: "right" });

  // Total Paid Row
  doc.rect(sumX, summaryY + 58, sumW, 32).fill("#1E3A8A");
  doc.fillColor("#FFFFFF").fontSize(10).font("Helvetica-Bold").text("TOTAL PAID", sumX + 12, summaryY + 69);
  doc.fillColor("#FFFFFF").fontSize(12).font("Helvetica-Bold").text(formatCurrency(invoice.total), sumX + 100, summaryY + 68, { width: 120, align: "right" });

  // --- FOOTER SECTION ---
  const footerY = 740;
  doc.moveTo(40, footerY).lineTo(555, footerY).stroke(borderColor);

  doc.fillColor(darkTextColor).fontSize(10).font("Helvetica-Bold").text("Thank you for your order! ❤️", 40, footerY + 12, { align: "center", width: 515 });
  doc.fillColor(mutedTextColor).fontSize(8.5).font("Helvetica").text("We appreciate you choosing ServiceHub for your local service needs.", 40, footerY + 26, { align: "center", width: 515 });
  doc.fillColor(mutedTextColor).fontSize(8).text("For support or queries, email us at support@servicehub.com • www.servicehub.com", 40, footerY + 38, { align: "center", width: 515 });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
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

  let providerId = options.provider_id || null;
  let order = null;
  if (payment.reference_type === "order") {
    order = await Order.findByPk(payment.reference_id);
    providerId = providerId || order?.provider_id || null;
  } else if (payment.reference_type === "subscription_payment") {
    const subPayment = await SubscriptionPayment.findByPk(payment.reference_id, {
      include: [{ model: CustomerSubscription, as: "subscription" }]
    });
    providerId = providerId || subPayment?.subscription?.provider_id || null;
  }
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

  await generateInvoicePdf(invoice, pdfPath);

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
    include: [
      {
        model: Provider,
        as: "provider",
        attributes: ["id", "business_name"]
      }
    ],
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
  // Ensure the PDF is generated with the latest ServiceHub professional template
  await generateInvoicePdf(invoice, filePath);

  return { invoice, filePath };
};

module.exports = {
  createInvoiceForPayment,
  listInvoices,
  getInvoicePdf,
  buildInvoiceNumber,
  generateInvoicePdf,
};
