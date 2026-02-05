import 'dotenv/config';
 import { bot } from './telegram.js';
 import db from './db.js';
 import { createInvoice } from './monobank.js';
 import { sendPaidMessage } from './telegram.js';
 
 bot.startPolling();
 
 bot.onText(/\/start/, async (msg) => {
   const tgId = msg.from.id;
   const username = msg.from.username || null;
 
   db.prepare(`
     INSERT OR IGNORE INTO customers (telegram_user_id, username)
     VALUES (?, ?)
   `).run(tgId, username);
 
   await bot.sendMessage(
     tgId,
     'Доступ в закрытое сообщество на 30 дней — 500 грн',
     {
       reply_markup: {
         inline_keyboard: [[
           { text: 'Оплатить', callback_data: 'pay_30' }
         ]]
       }
     }
   );
 });
 
/*bot.onText(/\/testinvite/, async (msg) => {
  const tgId = msg.from.id;

  try {
    await sendPaidMessage(tgId);
    await bot.sendMessage(tgId, '✅ Тестовое приглашение создано и отправлено!');
    console.log('💻 Test invite sent to', tgId);
  } catch (err) {
    console.error('❌ Failed to send test invite:', err.message);
    await bot.sendMessage(tgId, '❌ Не удалось создать тестовое приглашение.');
  }
});*/


 bot.on('callback_query', async (q) => {
   if (q.data !== 'pay_30') return;
 
   const customer = db.prepare(`
     SELECT id FROM customers WHERE telegram_user_id = ?
   `).get(q.from.id);
 
   const invoice = await createInvoice(500);
 
   db.prepare(`
     INSERT INTO payments (customer_id, amount, status, invoice_id)
     VALUES (?, ?, 'pending', ?)
   `).run(customer.id, 500, invoice.invoiceId);
 
   await bot.sendMessage(
     q.from.id,
     `Оплатите по ссылке:\n${invoice.pageUrl}`
   );
 });
 
 
 bot.on('chat_join_request', async (req) => {
   const userId = req.from.id;
   const chatId = req.chat.id;
 
   const access = db.prepare(`
     SELECT access.*
     FROM access
     JOIN customers ON customers.id = access.customer_id
     WHERE customers.telegram_user_id = ?
       AND access.expires_at > datetime('now')
   `).get(userId);
 
   if (!access) {
     console.log('⛔ join denied (no active access):', userId);
     return;
   }
 
   await bot.approveChatJoinRequest(chatId, userId);
   console.log('✅ user approved:', userId);
 });
 
 console.log('🤖 Бот запущен...');