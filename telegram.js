import 'dotenv/config';
 import TelegramBot from 'node-telegram-bot-api';
 
 export const bot = new TelegramBot(process.env.BOT_TOKEN, {
   polling: false
 });
 
 export async function sendPaidMessage(userId) {
   try {
     
     const inviteLink = await bot.createChatInviteLink(process.env.PRIVATE_CHAT_ID, {
       member_limit: 1,
       expire_date: Math.floor(Date.now() / 1000) + 86400 
     });
 
     await bot.sendMessage(
       userId,
       `🎉 Оплата прошла успешно!\n\n` +
       `Вот ваша персональная ссылка для входа в закрытое сообщество:\n\n` +
       `🔗 ${inviteLink.invite_link}\n\n` +
       `⚠️ Ссылка действительна 24 часа и только для одного использования.\n` +
       `Доступ активен 30 дней.`
     );
 
     console.log('✅ Invite link sent to user:', userId);
   } catch (err) {
     console.error('❌ Failed to create invite link:', userId, err.message);
     
     
     await bot.sendMessage(
       userId,
       '✅ Оплата получена! Свяжитесь с администратором для получения доступа.'
     );
   }
 }