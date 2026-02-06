import 'dotenv/config';
 import express from 'express';
 import db from './db.js';
 import { sendPaidMessage } from './telegram.js';
 
 const app = express();
 app.use(express.json());
 
 app.post('/webhook/monobank', async (req, res) => {
  console.log('📥 MONOBANK WEBHOOK HIT');
  console.log('HEADERS:', req.headers);
  console.log('BODY:', req.body);

  const { invoiceId, status } = req.body;
  ...
});

   const { invoiceId, status } = req.body;
 
   if (status !== 'success') {
     return res.sendStatus(200);
   }
 
   const payment = db.prepare(`
     SELECT * FROM payments WHERE invoice_id = ?
   `).get(invoiceId);
 
   if (!payment) {
     return res.sendStatus(404);
   }
 
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
 
   await sendPaidMessage(customer.telegram_user_id);
 
   res.sendStatus(200);
 });
 
 app.listen(3000, () => {
   console.log('Webhook server running on port 3000');
 });
