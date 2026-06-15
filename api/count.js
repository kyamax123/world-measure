export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url  = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return res.status(500).json({ error: 'KV not configured' });

  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };

  // GET /api/count → 全物差しのカウントを返す
  if (req.method === 'GET') {
    const r = await fetch(url + '/hgetall/den_counts', { headers });
    const json = await r.json();
    // Upstash hgetall は ["key","val","key","val",...] の配列で返す
    const result = {};
    const arr = json.result || [];
    for (let i = 0; i < arr.length; i += 2) {
      result[arr[i]] = parseInt(arr[i + 1], 10);
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(result);
  }

  // POST /api/count  body: { den: "GLD" } → 指定物差しを+1
  if (req.method === 'POST') {
    let den;
    try { den = JSON.parse(req.body).den; } catch { den = req.body?.den; }
    if (!den) return res.status(400).json({ error: 'den is required' });

    // 許可されたティッカーのみ受け付ける（不正入力防止）
    const ALLOWED = ['VT','GLD','SPY','BTC-USD','SLV','UUP','JPY','TLT','QQQ'];
    if (!ALLOWED.includes(den)) return res.status(400).json({ error: 'invalid den' });

    await fetch(url + '/hincrby/den_counts/' + encodeURIComponent(den) + '/1', {
      method: 'POST', headers
    });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
