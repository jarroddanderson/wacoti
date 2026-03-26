const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const STORE_ID = process.env.PRINTFUL_STORE_ID;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    // Fetch product list
    const listRes = await fetch('https://api.printful.com/store/products?limit=50', {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'X-PF-Store-Id': STORE_ID,
      },
    });
    const listData = await listRes.json();
    const summaries = listData.result || [];

    // Fetch full details for each product
    const detailed = await Promise.all(
      summaries.map(async (p) => {
        const r = await fetch(`https://api.printful.com/store/products/${p.id}`, {
          headers: {
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
            'X-PF-Store-Id': STORE_ID,
          },
        });
        const d = await r.json();
        return d.result || null;
      })
    );

    const products = detailed.filter(Boolean).map((d) => ({
      id: d.sync_product.id,
      title: d.sync_product.name,
      thumbnail: d.sync_product.thumbnail_url,
      variants: d.sync_variants.map((v) => ({
        id: v.id,
        title: v.name,
        size: v.size,
        color: v.color,
        price: parseFloat(v.retail_price) * 100,
        is_enabled: v.is_enabled,
        preview: v.files?.find((f) => f.type === 'preview')?.preview_url || null,
        product_image: v.product?.image || null,
      })),
    }));

    res.status(200).json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}
