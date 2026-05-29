const getInvoices = async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [invoices] = await pool.query(
      "SELECT * FROM invoices ORDER BY created_at DESC"
    );
    res.status(200).json({ success: true, invoices });
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ success: false, message: "Could not fetch invoices." });
  }
};

const createInvoice = async (req, res) => {
  const {
    invoiceDate,
    invoiceValue,
    invoiceGSTValue,
    invoiceTotalValue,
    transportAmount,
    billPdfBase64,
    billPdfName,
  } = req.body;

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Generate Invoice Number
    let nextInvoiceNo = "INV001";
    const [lastInvoice] = await pool.query(
      "SELECT invoice_no FROM invoices ORDER BY id DESC LIMIT 1"
    );

    if (lastInvoice && lastInvoice.length > 0 && lastInvoice[0].invoice_no) {
      const lastNo = lastInvoice[0].invoice_no;
      const match = lastNo.match(/^INV(\d+)$/);
      if (match) {
        const nextNumber = parseInt(match[1], 10) + 1;
        nextInvoiceNo = `INV${nextNumber.toString().padStart(3, "0")}`;
      }
    }

    const crypto = require("crypto");
    const uniqueInvoiceId = crypto.randomUUID();

    const [result] = await pool.query(
      `INSERT INTO invoices (invoice_id, invoice_no, invoice_date, invoice_value, gst_value, total_value, transport_amount, bill_pdf_base64, bill_pdf_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uniqueInvoiceId,
        nextInvoiceNo,
        invoiceDate || null,
        invoiceValue || 0,
        invoiceGSTValue || 0,
        invoiceTotalValue || 0,
        transportAmount || 0,
        billPdfBase64 || null,
        billPdfName || null,
        timestamp,
        timestamp,
      ]
    );

    res.status(201).json({ success: true, message: "Invoice added.", id: result.insertId });
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({ success: false, message: "Could not create invoice." });
  }
};

const updateInvoice = async (req, res) => {
  const { id } = req.params;
  const {
    invoiceNo,
    invoiceDate,
    invoiceValue,
    invoiceGSTValue,
    invoiceTotalValue,
    transportAmount,
    billPdfBase64,
    billPdfName,
  } = req.body;

  try {
    const pool = req.app.locals.pool;
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    const fields = [];
    const values = [];

    if (invoiceNo !== undefined) { fields.push("invoice_no = ?"); values.push(invoiceNo); }
    if (invoiceDate !== undefined) { fields.push("invoice_date = ?"); values.push(invoiceDate); }
    if (invoiceValue !== undefined) { fields.push("invoice_value = ?"); values.push(invoiceValue); }
    if (invoiceGSTValue !== undefined) { fields.push("gst_value = ?"); values.push(invoiceGSTValue); }
    if (invoiceTotalValue !== undefined) { fields.push("total_value = ?"); values.push(invoiceTotalValue); }
    if (transportAmount !== undefined) { fields.push("transport_amount = ?"); values.push(transportAmount); }
    if (billPdfBase64 !== undefined) { fields.push("bill_pdf_base64 = ?"); values.push(billPdfBase64); }
    if (billPdfName !== undefined) { fields.push("bill_pdf_name = ?"); values.push(billPdfName); }

    fields.push("updated_at = ?");
    values.push(timestamp);
    values.push(id);

    if (fields.length === 1) {
      return res.status(400).json({ success: false, message: "No fields to update." });
    }

    const [result] = await pool.query(
      `UPDATE invoices SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    res.status(200).json({ success: true, message: "Invoice updated." });
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({ success: false, message: "Could not update invoice." });
  }
};

const deleteInvoice = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.pool;
    const [result] = await pool.query("DELETE FROM invoices WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }
    res.status(200).json({ success: true, message: "Invoice deleted." });
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ success: false, message: "Could not delete invoice." });
  }
};

module.exports = { getInvoices, createInvoice, updateInvoice, deleteInvoice };
