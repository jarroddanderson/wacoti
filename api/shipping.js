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

    if (!recipient || !items?.length) {
      return res.status(400).json({ error: 'Missing recipient or items' });
    }

    const pfRes = await fetch('https://api.printful.com/shipping/rates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'X-PF-Store-Id': STORE_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: {
          address1: recipient.address1,
          city: recipient.city,
          state_code: recipient.state_code,
          country_code: recipient.country_code || 'US',
          zip: recipient.zip,
        },
        items: items.map(item => ({
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
      }),
    });

    const data = await pfRes.json();

    if (!pfRes.ok) {
      return res.status(pfRes.status).json({ error: data.error?.message || 'Failed to get rates' });
    }

    const rates = (data.result || []).map(rate => ({
      id: rate.id,
      name: rate.name,
      rate: parseFloat(rate.rate),
      minDeliveryDays: rate.minDeliveryDays,
      maxDeliveryDays: rate.maxDeliveryDays,
    }));

    res.status(200).json({ rates });
  } catch (err) {
    console.error('Shipping error:', err);
    res.status(500).json({ error: 'Failed to calculate shipping' });
  }
}
