import 'dotenv/config';
import express from 'express';
import db from './db.js';
import { sendPaidMessage } from './telegram.js';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/testinvite/:userId', async (req, res) => {
  try {
    await sendPaidMessage(req.params.userId);
    res.json({ status: 'sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/webhook/monobank', async (req, res) => {
  console.log('📩 Webhook received:', JSON.stringify(req.body));

  const { invoiceId, status } = req.body;

  if (!invoiceId) {
    console.error('❌ Webhook: no invoiceId in body');
    return res.sendStatus(400);
  }

  if (status !== 'success') {
    console.log('⏳ Webhook: status is', status, '(not success), ignoring');
    return res.sendStatus(200);
  }

  const payment = db.prepare(`
    SELECT * FROM payments WHERE invoice_id = ?
  `).get(invoiceId);

  if (!payment) {
    console.error('❌ Payment not found for invoiceId:', invoiceId);
    return res.sendStatus(404);
  }

  if (payment.status === 'paid') {
    console.log('⚠️ Payment already processed:', invoiceId);
    return res.sendStatus(200);
  }

  console.log('✅ Payment found:', payment.id, 'for customer:', payment.customer_id);

  db.prepare(`
    UPDATE payments SET status = 'paid' WHERE id = ?
  `).run(payment.id);

  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  db.prepare(`
    INSERT INTO access (customer_id, expires_at)
    VALUES (?, ?)
  `).run(payment.customer_id, expires.toISOString());

  const customer = db.prepare(`
    SELECT telegram_user_id FROM customers WHERE id = ?
  `).get(payment.customer_id);

  if (!customer) {
    console.error('❌ Customer not found for id:', payment.customer_id);
    return res.sendStatus(500);
  }

  console.log('📨 Sending invite to telegram user:', customer.telegram_user_id);

  try {
    await sendPaidMessage(customer.telegram_user_id);
    console.log('✅ Invite sent successfully');
  } catch (err) {
    console.error('❌ Failed to send invite:', err.message);
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
   console.log('Webhook server running on port 3000');
 });
