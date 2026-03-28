const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const STORE_ID = process.env.PRINTFUL_STORE_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { recipient, items } = req.body;

    const pfRes = await fetch('https://api.printful.com/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'X-PF-Store-Id': STORE_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient, items }),
    });

    const data = await pfRes.json();

    if (!pfRes.ok) {
      return res.status(pfRes.status).json({ error: data.error?.message || 'Order failed' });
    }

    res.status(200).json({ orderId: data.result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
}
