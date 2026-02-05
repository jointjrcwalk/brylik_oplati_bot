import axios from 'axios';

export async function createInvoice(amount) {
  const res = await axios.post(
    'https://api.monobank.ua/api/merchant/invoice/create',
    {
      amount: amount * 100,
      ccy: 980,
      redirectUrl: 'https://t.me/brylik_oplati_bot'
    },
    {
      headers: { 'X-Token': process.env.MONO_TOKEN }
    }
  );

  return res.data;
}