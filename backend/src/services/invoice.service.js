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

// Helper to convert number to English Words (Indian numbering system)
const numberToWords = (num) => {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return "Zero Rupees Only";

  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
                 "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convertChunk = (val) => {
    let str = "";
    if (val >= 100) {
      str += units[Math.floor(val / 100)] + " Hundred ";
      val %= 100;
    }
    if (val >= 20) {
      str += tens[Math.floor(val / 10)] + (val % 10 !== 0 ? " " + units[val % 10] : "") + " ";
    } else if (val > 0) {
      str += units[val] + " ";
    }
    return str;
  };

  let words = "";
  let crore = Math.floor(n / 10000000);
  let lakh = Math.floor((n % 10000000) / 100000);
  let thousand = Math.floor((n % 100000) / 1000);
  let remainder = n % 1000;

  if (crore > 0) words += convertChunk(crore) + "Crore ";
  if (lakh > 0) words += convertChunk(lakh) + "Lakh ";
  if (thousand > 0) words += convertChunk(thousand) + "Thousand ";
  if (remainder > 0) words += convertChunk(remainder);

  return words.trim() + " Only";
};

// Function to draw dynamic barcode vectors
const drawBarcode = (doc, x, y, width, height, codeStr) => {
  const cleanCode = (codeStr || "INV").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const barPattern = [2, 1, 1, 2];
  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i);
    barPattern.push((charCode % 3) + 1, ((charCode >> 1) % 2) + 1, ((charCode >> 2) % 3) + 1, ((charCode >> 3) % 2) + 1);
  }
  barPattern.push(2, 1, 2, 1, 2);

  const totalUnits = barPattern.reduce((a, b) => a + b, 0);
  const unitWidth = width / totalUnits;

  let currentX = x;
  let isBar = true;
  for (let i = 0; i < barPattern.length; i++) {
    const barW = barPattern[i] * unitWidth;
    if (isBar) {
      doc.rect(currentX, y, barW, height).fill("#111827");
    }
    currentX += barW;
    isBar = !isBar;
  }
};

const generateInvoicePdf = async (invoice, filePath) => {
  const uploadsDir = path.dirname(filePath);
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  // 1. Fetch Customer
  const customer = await Customer.findByPk(invoice.customer_id, {
    include: [{ model: User, as: "user" }]
  });

  // 2. Fetch Provider
  const provider = await Provider.findByPk(invoice.provider_id, {
    include: [{ model: User, as: "user" }]
  });

  // 3. Extract Details Dynamically based on reference_type
  const isSubscription = invoice.reference_type === "subscription_payment";
  let serviceName = "Local Service";
  let serviceDescription = "Standard service fulfillment";
  let planFrequency = isSubscription ? "Daily Plan" : "One-Time Service";
  let quantity = 1;
  let unit = "unit";
  let baseUnitPrice = 0;
  let deliveriesPerDay = 1;
  let billingCycleDays = 30;
  let totalDeliveries = 1;
  let discountPercent = 0;
  let discountAmount = Number(invoice.discount || 0);
  let grossAmount = Number(invoice.subtotal || 0);
  let netServiceAmount = Number(invoice.subtotal || 0);
  let platformCharges = 0;
  let totalPayable = Number(invoice.total || 0);
  
  let deliverySlots = [];
  let startDate = null;
  let nextBillingDate = null;
  let firstDeliveryLabel = "Today";
  let addressText = null;
  let placeOfSupply = "Maharashtra";
  let paymentMethod = "Online Payment";
  let paymentRef = null;
  let paymentDate = invoice.issued_at || new Date();
  let remainingDeliveries = 0;

  if (isSubscription) {
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
          paymentMethod = p.method ? (p.method === 'mock' ? 'Online Payment' : p.method.toUpperCase()) : 'Online Payment';
          paymentRef = p.gateway_payment_id || `PAY-${p.id}`;
          if (p.created_at || p.paid_at) paymentDate = p.paid_at || p.created_at;
          if (p.commission_amount) platformCharges = Number(p.commission_amount);
        }
      }

      const sub = subPayment.subscription;
      if (sub) {
        serviceName = sub.service?.name || "Subscription Service";
        serviceDescription = sub.service?.description || "Daily service delivery";
        unit = sub.service?.unit || "unit";
        quantity = Number(sub.quantity || 1);
        startDate = sub.start_date;
        nextBillingDate = sub.next_billing_date;

        const plan = sub.servicePlan;
        if (plan) {
          planFrequency = plan.frequency ? `${plan.frequency.charAt(0).toUpperCase() + plan.frequency.slice(1)} Plan` : "Daily Plan";
          deliveriesPerDay = Math.max(1, parseInt(plan.deliveries_per_day) || 1);
          billingCycleDays = Math.max(1, parseInt(plan.billing_cycle_days) || 30);
          discountPercent = Math.min(100, Math.max(0, parseFloat(plan.discount_percent) || 0));
        }

        totalDeliveries = deliveriesPerDay * billingCycleDays;
        const rawBase = Number(sub.service?.base_price || 0);
        
        if (discountPercent > 0 && rawBase > 0) {
          baseUnitPrice = rawBase;
          grossAmount = baseUnitPrice * quantity * totalDeliveries;
          discountAmount = (grossAmount * discountPercent) / 100;
          netServiceAmount = Math.max(0, grossAmount - discountAmount);
        } else if (invoice.discount && Number(invoice.discount) > 0) {
          discountAmount = Number(invoice.discount);
          netServiceAmount = Number(invoice.subtotal || invoice.total || 0);
          grossAmount = netServiceAmount + discountAmount;
          baseUnitPrice = (totalDeliveries > 0 && quantity > 0) ? (grossAmount / (quantity * totalDeliveries)) : (rawBase || netServiceAmount);
        } else {
          discountAmount = 0;
          netServiceAmount = Number(invoice.subtotal || invoice.total || 0);
          grossAmount = netServiceAmount;
          baseUnitPrice = (totalDeliveries > 0 && quantity > 0) ? (grossAmount / (quantity * totalDeliveries)) : (rawBase || netServiceAmount);
        }

        // Extract slots
        if (Array.isArray(sub.delivery_slots) && sub.delivery_slots.length > 0) {
          deliverySlots = sub.delivery_slots.map(s => {
            const slotName = (s.slot || "morning").toLowerCase();
            const timeRange = slotName === "morning" ? "07:00:00" : slotName === "evening" ? "18:00:00" : (s.custom_time || "07:00:00");
            return `${slotName.charAt(0).toUpperCase() + slotName.slice(1)} (${timeRange})`;
          });
        } else if (sub.delivery_time_slot) {
          const slotName = sub.delivery_time_slot.toLowerCase();
          const timeRange = slotName === "custom" && sub.custom_time ? ` (${sub.custom_time})` : slotName === "morning" ? " (07:00:00)" : slotName === "evening" ? " (18:00:00)" : "";
          deliverySlots = [`${slotName.charAt(0).toUpperCase() + slotName.slice(1)}${timeRange}`];
        }

        if (sub.first_delivery_choice === "tomorrow") {
          firstDeliveryLabel = "Tomorrow";
        } else if (sub.first_delivery_choice === "custom" || sub.first_delivery_choice === "select_date") {
          firstDeliveryLabel = startDate ? new Date(`${startDate}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Scheduled Date";
        } else {
          firstDeliveryLabel = "Today";
        }

        // Calculate actual scheduled and remaining deliveries
        try {
          const totalScheduled = await SubscriptionDelivery.count({ where: { subscription_id: sub.id } });
          const deliveredCount = await SubscriptionDelivery.count({ where: { subscription_id: sub.id, status: "delivered" } });
          if (totalScheduled > 0) {
            totalDeliveries = totalScheduled;
            remainingDeliveries = Math.max(0, totalScheduled - deliveredCount);
          } else {
            remainingDeliveries = totalDeliveries;
          }
        } catch (err) {
          remainingDeliveries = totalDeliveries;
        }

        if (sub.address) {
          if (sub.address.state) placeOfSupply = sub.address.state;
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
      serviceDescription = order.service?.description || order.notes || "Professional local service delivery";
      unit = order.service?.unit || "unit";
      planFrequency = "One-Time Service";
      quantity = Number(order.quantity || 1);
      baseUnitPrice = Number(order.unit_price || (Number(invoice.subtotal) / quantity));
      startDate = order.scheduled_date;
      deliverySlots = [order.scheduled_time || order.scheduled_time_slot || "10:00 AM - 12:00 PM"];
      firstDeliveryLabel = startDate ? new Date(`${startDate}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Scheduled Date";

      grossAmount = baseUnitPrice * quantity;
      discountAmount = Number(order.discount_amount || 0);
      netServiceAmount = Math.max(0, grossAmount - discountAmount);

      const p = await Payment.findOne({ where: { reference_type: "order", reference_id: order.id } });
      if (p) {
        paymentMethod = p.method ? (p.method === 'mock' ? 'Online Payment' : p.method.toUpperCase()) : 'Online Payment';
        paymentRef = p.gateway_payment_id || `PAY-${p.id}`;
        if (p.created_at || p.paid_at) paymentDate = p.paid_at || p.created_at;
        if (p.commission_amount) platformCharges = Number(p.commission_amount);
      }

      if (order.address) {
        if (order.address.state) placeOfSupply = order.address.state;
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

  // Fallback customer address
  if (!addressText && invoice.customer_id) {
    const addr = await Address.findOne({ where: { customer_id: invoice.customer_id, is_default: true } });
    if (addr) {
      if (addr.state) placeOfSupply = addr.state;
      addressText = [addr.house_no, addr.building, addr.street, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
    }
  }

  // If platform charges are calculated or stored in invoice/payment
  if (platformCharges === 0 && Number(invoice.total) > netServiceAmount) {
    platformCharges = Number(invoice.total) - netServiceAmount;
  }
  totalPayable = Number(invoice.total || (netServiceAmount + platformCharges));

  // --- PDF GENERATION SETUP ---
  const doc = new PDFDocument({ size: "A4", margin: 28, bufferPages: true });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Register Unicode TrueType Fonts for native ₹ symbol support
  let regularFont = "Helvetica";
  let boldFont = "Helvetica-Bold";

  const fontCandidates = [
    { regular: "C:/Windows/Fonts/segoeui.ttf", bold: "C:/Windows/Fonts/segoeuib.ttf" },
    { regular: "C:/Windows/Fonts/arial.ttf", bold: "C:/Windows/Fonts/arialbd.ttf" },
    { regular: "C:/Windows/Fonts/calibri.ttf", bold: "C:/Windows/Fonts/calibrib.ttf" }
  ];

  for (const c of fontCandidates) {
    if (fs.existsSync(c.regular) && fs.existsSync(c.bold)) {
      doc.registerFont("BillRegular", c.regular);
      doc.registerFont("BillBold", c.bold);
      regularFont = "BillRegular";
      boldFont = "BillBold";
      break;
    }
  }

  const formatCurrency = (amt) => Number(amt || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? String(dateInput) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const cBlack = "#111827";
  const cBorder = "#374151";
  const cLightBorder = "#9CA3AF";
  const cDotted = "#9CA3AF";
  const cHeaderBg = "#E5E7EB";

  const pageWidth = 538;
  const leftX = 28;
  const rightX = leftX + pageWidth;
  const halfW = pageWidth / 2;

  let curY = 24;

  // 1. TOP HEADER
  doc.font(boldFont).fontSize(16).fillColor(cBlack).text("SERVICEHUB", leftX, curY, { align: "center", width: pageWidth });
  curY += 16;
  doc.font(regularFont).fontSize(8.5).fillColor(cBlack).text("Local Services  •  Delivered Locally", leftX, curY, { align: "center", width: pageWidth });
  curY += 11;
  doc.font(regularFont).fontSize(8).fillColor(cBlack).text("support@servicehub.com   |   www.servicehub.com", leftX, curY, { align: "center", width: pageWidth });
  curY += 13;

  // Solid header line
  doc.moveTo(leftX, curY).lineTo(rightX, curY).lineWidth(1.2).strokeColor(cBlack).stroke();
  curY += 8;

  // TAX INVOICE
  doc.font(boldFont).fontSize(12).fillColor(cBlack).text("TAX INVOICE", leftX, curY, { align: "center", width: pageWidth });
  curY += 16;

  // 2. INVOICE INFORMATION (2-Column Grid)
  const metaY = curY;
  const drawMetaRow = (label, val, x, y, valOffset = 105) => {
    doc.font(boldFont).fontSize(7.5).fillColor(cBlack).text(label, x, y);
    doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(":", x + valOffset - 8, y);
    doc.font(boldFont).fontSize(7.8).fillColor(cBlack).text(val, x + valOffset, y);
  };

  drawMetaRow("INVOICE NO.", invoice.invoice_number, leftX, metaY);
  drawMetaRow("INVOICE DATE", formatDate(invoice.issued_at || invoice.created_at), leftX, metaY + 12);
  drawMetaRow("PAYMENT REFERENCE", paymentRef || `PAY-${invoice.reference_id}`, leftX, metaY + 24);

  drawMetaRow("PAYMENT STATUS", invoice.payment_status?.toUpperCase() || "PAID", leftX + halfW, metaY, 95);
  drawMetaRow("PAYMENT METHOD", paymentMethod, leftX + halfW, metaY + 12, 95);

  curY = metaY + 36;

  // Dashed divider line
  doc.moveTo(leftX, curY).lineTo(rightX, curY).lineWidth(0.6).dash(2, { space: 2 }).strokeColor(cDotted).stroke();
  doc.undash();
  curY += 8;

  // 3. BILLED TO / SERVICE PROVIDER
  const partyY = curY;
  const partyH = 72;

  // Vertical separator in middle
  doc.moveTo(leftX + halfW, partyY - 4).lineTo(leftX + halfW, partyY + partyH + 4).lineWidth(0.6).strokeColor(cLightBorder).stroke();

  // Left: BILLED TO
  doc.font(boldFont).fontSize(8.5).fillColor(cBlack).text("BILLED TO", leftX, partyY);
  doc.font(boldFont).fontSize(8.5).fillColor(cBlack).text(customer?.user?.full_name || customer?.user?.name || "Valued Customer", leftX, partyY + 13);
  
  const drawPartyRow = (label, val, x, y, valOffset = 45, maxW = halfW - 55) => {
    doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(label, x, y);
    doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(":", x + valOffset - 8, y);
    doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(val, x + valOffset, y, { width: maxW, height: 24, ellipsis: true });
  };

  drawPartyRow("Mobile", customer?.user?.phone ? `+91 ${customer.user.phone}` : "N/A", leftX, partyY + 25);
  drawPartyRow("Email", customer?.user?.email || "N/A", leftX, partyY + 36);
  drawPartyRow("Address", addressText || "Service Location Delivered", leftX, partyY + 47);

  // Right: SERVICE PROVIDER
  const provX = leftX + halfW + 12;
  doc.font(boldFont).fontSize(8.5).fillColor(cBlack).text("SERVICE PROVIDER", provX, partyY);
  doc.font(boldFont).fontSize(8.5).fillColor(cBlack).text(provider?.business_name || "Authorized Service Partner", provX, partyY + 13);
  drawPartyRow("Mobile", provider?.user?.phone ? `+91 ${provider.user.phone}` : "N/A", provX, partyY + 25, 52, halfW - 65);
  drawPartyRow("Email", provider?.user?.email || "provider@servicehub.com", provX, partyY + 36, 52, halfW - 65);
  drawPartyRow("Fulfillment", "Local Delivery Partner", provX, partyY + 47, 52, halfW - 65);

  curY = partyY + partyH + 8;

  // Dashed divider line
  doc.moveTo(leftX, curY).lineTo(rightX, curY).lineWidth(0.6).dash(2, { space: 2 }).strokeColor(cDotted).stroke();
  doc.undash();
  curY += 8;

  // 4. MAIN ITEM TABLE
  const thY = curY;
  const thH = 18;
  const tbCols = [
    { name: "Sr.", x: leftX, w: 25, align: "center" },
    { name: "Service Description", x: leftX + 25, w: 120, align: "center" },
    { name: "Plan / Frequency", x: leftX + 145, w: 90, align: "center" },
    { name: "Qty / Unit", x: leftX + 235, w: 60, align: "center" },
    { name: "Unit Price (₹)", x: leftX + 295, w: 78, align: "center" },
    { name: "Discount (₹)", x: leftX + 373, w: 75, align: "center" },
    { name: "Amount (₹)", x: leftX + 448, w: 90, align: "center" },
  ];

  // Header Box
  doc.rect(leftX, thY, pageWidth, thH).lineWidth(0.8).strokeColor(cBorder).stroke();
  tbCols.forEach((col, idx) => {
    if (idx > 0) doc.moveTo(col.x, thY).lineTo(col.x, thY + thH).lineWidth(0.8).strokeColor(cBorder).stroke();
    doc.font(boldFont).fontSize(7.5).fillColor(cBlack).text(col.name, col.x + 2, thY + 5, { width: col.w - 4, align: col.align });
  });

  // Table Data Row
  const rowY = thY + thH;
  const rowH = 34;
  doc.rect(leftX, rowY, pageWidth, rowH).lineWidth(0.8).strokeColor(cBorder).stroke();
  tbCols.forEach((col, idx) => {
    if (idx > 0) doc.moveTo(col.x, rowY).lineTo(col.x, rowY + rowH).lineWidth(0.8).strokeColor(cBorder).stroke();
  });

  // Row Contents
  doc.font(boldFont).fontSize(8).fillColor(cBlack).text("1", tbCols[0].x, rowY + 11, { width: tbCols[0].w, align: "center" });
  
  doc.font(boldFont).fontSize(8).fillColor(cBlack).text(serviceName, tbCols[1].x + 8, rowY + 7, { width: tbCols[1].w - 12, ellipsis: true });
  doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(serviceDescription, tbCols[1].x + 8, rowY + 18, { width: tbCols[1].w - 12, height: 12, ellipsis: true });

  doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(planFrequency, tbCols[2].x + 8, rowY + 5, { width: tbCols[2].w - 10, ellipsis: true });
  if (isSubscription) {
    doc.font(regularFont).fontSize(7).fillColor(cBlack).text(`${deliveriesPerDay} delivery/day`, tbCols[2].x + 8, rowY + 14);
    doc.font(regularFont).fontSize(7).fillColor(cBlack).text(`(${totalDeliveries} total)`, tbCols[2].x + 8, rowY + 23);
  } else {
    doc.font(regularFont).fontSize(7).fillColor(cBlack).text("One-time fulfillment", tbCols[2].x + 8, rowY + 16);
  }

  doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(`${quantity} ${unit}`, tbCols[3].x, rowY + 11, { width: tbCols[3].w, align: "center" });
  doc.font(regularFont).fontSize(7.8).fillColor(cBlack).text(formatCurrency(baseUnitPrice), tbCols[4].x, rowY + 11, { width: tbCols[4].w, align: "center" });
  doc.font(regularFont).fontSize(7.8).fillColor(cBlack).text(formatCurrency(discountAmount), tbCols[5].x, rowY + 11, { width: tbCols[5].w, align: "center" });
  doc.font(boldFont).fontSize(8).fillColor(cBlack).text(formatCurrency(netServiceAmount), tbCols[6].x, rowY + 11, { width: tbCols[6].w, align: "center" });

  curY = rowY + rowH + 10;

  // 5. SUBSCRIPTION DETAILS (Left) & AMOUNT SUMMARY (Right Box)
  const subY = curY;
  const rightSumX = leftX + 255;
  const rightSumW = pageWidth - 255; // 283
  const summaryBoxH = 88;

  // Left: SUBSCRIPTION DETAILS
  if (isSubscription) {
    doc.font(boldFont).fontSize(8.5).fillColor(cBlack).text("SUBSCRIPTION DETAILS", leftX, subY);
    
    const drawSubRow = (label, val, y) => {
      doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(label, leftX, y);
      doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(":", leftX + 82, y);
      doc.font(boldFont).fontSize(7.5).fillColor(cBlack).text(val, leftX + 90, y, { width: 160, ellipsis: true });
    };

    drawSubRow("Plan", planFrequency.replace(" Plan", ""), subY + 14);
    drawSubRow("Deliveries per day", String(deliveriesPerDay), subY + 25);
    drawSubRow("Billing cycle", `${billingCycleDays} Days`, subY + 36);
    drawSubRow("Total deliveries", String(totalDeliveries), subY + 47);
    drawSubRow("Delivery slot", deliverySlots[0] || "Standard Slot", subY + 58);
    drawSubRow("Start date", formatDate(startDate), subY + 69);
    drawSubRow("Next billing date", formatDate(nextBillingDate), subY + 80);
  } else {
    doc.font(boldFont).fontSize(8.5).fillColor(cBlack).text("BOOKING DETAILS", leftX, subY);
    const drawSubRow = (label, val, y) => {
      doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(label, leftX, y);
      doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(":", leftX + 82, y);
      doc.font(boldFont).fontSize(7.5).fillColor(cBlack).text(val, leftX + 90, y);
    };
    drawSubRow("Service Type", "One-Time Booking", subY + 14);
    drawSubRow("Scheduled Date", formatDate(startDate), subY + 25);
    drawSubRow("Timing Slot", deliverySlots[0] || "10:00 AM - 12:00 PM", subY + 36);
    drawSubRow("Status", "Confirmed & Paid", subY + 47);
  }

  // Right: AMOUNT SUMMARY Table Box
  doc.rect(rightSumX, subY, rightSumW, summaryBoxH).lineWidth(0.8).strokeColor(cBorder).stroke();
  
  // Header band
  doc.rect(rightSumX, subY, rightSumW, 16).fill(cHeaderBg);
  doc.rect(rightSumX, subY, rightSumW, 16).lineWidth(0.8).strokeColor(cBorder).stroke();
  doc.font(boldFont).fontSize(7.8).fillColor(cBlack).text("AMOUNT SUMMARY", rightSumX + 8, subY + 4.5);
  doc.font(boldFont).fontSize(7.8).fillColor(cBlack).text("AMOUNT (₹)", rightSumX + rightSumW - 75, subY + 4.5, { width: 67, align: "right" });

  // Rows
  const drawSumRow = (label, val, y, isBold = false) => {
    doc.font(isBold ? boldFont : regularFont).fontSize(7.5).fillColor(cBlack).text(label, rightSumX + 8, y);
    doc.font(isBold ? boldFont : regularFont).fontSize(7.5).fillColor(cBlack).text(val, rightSumX + rightSumW - 75, y, { width: 67, align: "right" });
  };

  drawSumRow("Subtotal (Service Amount)", formatCurrency(grossAmount), subY + 21);
  drawSumRow(discountPercent > 0 ? `Plan Discount (${discountPercent}%)` : "Discount", discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : formatCurrency(0), subY + 33);

  // Separator line
  doc.moveTo(rightSumX, subY + 44).lineTo(rightSumX + rightSumW, subY + 44).lineWidth(0.8).strokeColor(cBorder).stroke();
  drawSumRow("Platform Charges", formatCurrency(platformCharges), subY + 49, true);

  // Separator line
  doc.moveTo(rightSumX, subY + 62).lineTo(rightSumX + rightSumW, subY + 62).lineWidth(0.8).strokeColor(cBorder).stroke();
  drawSumRow("TOTAL PAYABLE", formatCurrency(totalPayable), subY + 70, true);

  curY = subY + summaryBoxH + 10;

  // Dashed divider line
  doc.moveTo(leftX, curY).lineTo(rightX, curY).lineWidth(0.6).dash(2, { space: 2 }).strokeColor(cDotted).stroke();
  doc.undash();
  curY += 8;

  // 6. DELIVERY DETAILS (Left) & PAYMENT DETAILS (Right)
  const bottomDetY = curY;

  // Left: DELIVERY DETAILS
  doc.font(boldFont).fontSize(8.5).fillColor(cBlack).text(isSubscription ? "DELIVERY DETAILS" : "FULFILLMENT DETAILS", leftX, bottomDetY);
  
  const drawDelivRow = (label, val, y) => {
    doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(label, leftX, y);
    doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(":", leftX + 88, y);
    doc.font(boldFont).fontSize(7.5).fillColor(cBlack).text(val, leftX + 96, y, { width: halfW - 100, ellipsis: true });
  };

  if (isSubscription) {
    drawDelivRow("First Delivery", firstDeliveryLabel, bottomDetY + 13);
    drawDelivRow("Delivery Cadence", `${deliveriesPerDay} ${deliveriesPerDay > 1 ? 'Deliveries' : 'Delivery'} / Day`, bottomDetY + 24);
    drawDelivRow("Delivery Slot", deliverySlots[0] || "Standard Slot", bottomDetY + 35);
    drawDelivRow("Scheduled Deliveries", String(totalDeliveries), bottomDetY + 46);
    drawDelivRow("Remaining Deliveries", String(remainingDeliveries), bottomDetY + 57);
  } else {
    drawDelivRow("Service Date", formatDate(startDate), bottomDetY + 13);
    drawDelivRow("Timing Slot", deliverySlots[0] || "10:00 AM - 12:00 PM", bottomDetY + 24);
    drawDelivRow("Fulfillment Type", "On-Demand Partner", bottomDetY + 35);
    drawDelivRow("Status", "Confirmed", bottomDetY + 46);
  }

  // Right: PAYMENT DETAILS
  const rPayX = leftX + halfW;
  doc.font(boldFont).fontSize(8.5).fillColor(cBlack).text("PAYMENT DETAILS", rPayX, bottomDetY);

  const drawPayRow = (label, val, y) => {
    doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(label, rPayX, y);
    doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(":", rPayX + 94, y);
    doc.font(boldFont).fontSize(7.5).fillColor(cBlack).text(val, rPayX + 102, y);
  };

  drawPayRow("Payment Status", invoice.payment_status?.toUpperCase() || "PAID", bottomDetY + 13);
  drawPayRow("Payment Method", paymentMethod, bottomDetY + 24);
  drawPayRow("Payment Date", formatDate(paymentDate), bottomDetY + 35);
  drawPayRow("Transaction Reference", paymentRef || `PAY-${invoice.reference_id}`, bottomDetY + 46);

  curY = bottomDetY + 68;

  // 7. GRAND TOTAL & SUMMARY BOX (Prominent Business Box)
  const grandBoxY = curY;
  const grandBoxH = 46;

  doc.rect(leftX, grandBoxY, pageWidth, grandBoxH).lineWidth(0.8).strokeColor(cBorder).stroke();

  // Top partition: GRAND TOTAL & Amount in Words on Left, ₹ Amount on Right
  doc.moveTo(leftX + 320, grandBoxY).lineTo(leftX + 320, grandBoxY + 28).lineWidth(0.8).strokeColor(cBorder).stroke();
  doc.moveTo(leftX, grandBoxY + 28).lineTo(rightX, grandBoxY + 28).lineWidth(0.8).strokeColor(cBorder).stroke();

  doc.font(boldFont).fontSize(9.5).fillColor(cBlack).text("GRAND TOTAL", leftX + 8, grandBoxY + 4);
  doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(`(${numberToWords(totalPayable)})`, leftX + 8, grandBoxY + 16);

  doc.font(boldFont).fontSize(14).fillColor(cBlack).text(`₹${formatCurrency(totalPayable)}`, leftX + 330, grandBoxY + 7, { width: pageWidth - 340, align: "right" });

  // Bottom partition: NO. OF ITEMS : 1 | TOTAL QTY : 1.00 | PLACE OF SUPPLY : Maharashtra
  const thirdW = pageWidth / 3;
  doc.moveTo(leftX + thirdW, grandBoxY + 28).lineTo(leftX + thirdW, grandBoxY + grandBoxH).lineWidth(0.8).strokeColor(cBorder).stroke();
  doc.moveTo(leftX + (thirdW * 2), grandBoxY + 28).lineTo(leftX + (thirdW * 2), grandBoxY + grandBoxH).lineWidth(0.8).strokeColor(cBorder).stroke();

  doc.font(boldFont).fontSize(7.5).fillColor(cBlack).text("NO. OF ITEMS : 1", leftX + 16, grandBoxY + 33);
  doc.font(boldFont).fontSize(7.5).fillColor(cBlack).text(`TOTAL QTY : ${quantity.toFixed(2)}`, leftX + thirdW + 12, grandBoxY + 33);
  doc.font(boldFont).fontSize(7.5).fillColor(cBlack).text(`PLACE OF SUPPLY : ${placeOfSupply}`, leftX + (thirdW * 2) + 12, grandBoxY + 33);

  curY = grandBoxY + grandBoxH + 12;

  // 8. NOTE & BARCODE
  const noteY = curY;
  const barcodeW = 190;
  const barcodeH = 32;
  const barcodeX = rightX - barcodeW;
  const barcodeCode = invoice.invoice_number.replace(/[^A-Za-z0-9]/g, "");

  // Left: Note
  doc.font(boldFont).fontSize(7.5).fillColor(cBlack).text("NOTE:", leftX, noteY);
  doc.font(regularFont).fontSize(6.8).fillColor(cBlack).text("•  This is a computer generated invoice and does not require any signature.", leftX, noteY + 10);
  doc.font(regularFont).fontSize(6.8).fillColor(cBlack).text("•  Services are provided as per the subscription plan selected.", leftX, noteY + 19);
  doc.font(regularFont).fontSize(6.8).fillColor(cBlack).text("•  Manage or modify your subscription from your ServiceHub dashboard.", leftX, noteY + 28);
  doc.font(regularFont).fontSize(6.8).fillColor(cBlack).text("•  For any support, email us at support@servicehub.com.", leftX, noteY + 37);

  // Right: Barcode & Human-readable number
  drawBarcode(doc, barcodeX, noteY + 2, barcodeW, barcodeH, barcodeCode);
  doc.font(regularFont).fontSize(7.5).fillColor(cBlack).text(`-${barcodeCode}-`, barcodeX, noteY + barcodeH + 5, { width: barcodeW, align: "center" });

  curY = noteY + 52;

  // 9. FOOTER
  doc.font(boldFont).fontSize(8).fillColor(cBlack).text("Thank you for choosing ServiceHub!", leftX, curY, { align: "center", width: pageWidth });
  doc.font(regularFont).fontSize(7.2).fillColor(cBlack).text("Page 1 of 1", rightX - 60, curY, { width: 60, align: "right" });

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
