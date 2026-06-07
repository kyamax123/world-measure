export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker is required' });

  const t = decodeURIComponent(ticker);

  try {
    if (t === 'BTC-USD') {
      const url = 'https://query2.finance.yahoo.com/v8/finance/chart/BTC-USD?interval=1mo&range=max&corsDomain=finance.yahoo.com';
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
      const json = await r.json();
      if (!json.chart?.result?.[0]) return res.status(404).json({ error: 'no data for BTC' });
      return res.status(200).json(json);
    }

    if (t === 'JPY') {
      const url = 'https://query2.finance.yahoo.com/v8/finance/chart/JPY=X?interval=1mo&range=max&corsDomain=finance.yahoo.com';
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
      const json = await r.json();
      if (!json.chart?.result?.[0]) return res.status(404).json({ error: 'no data for JPY' });
      return res.status(200).json(json);
    }

    const url = 'https://query2.finance.yahoo.com/v8/finance/chart/' + t + '?interval=1mo&range=max&corsDomain=finance.yahoo.com';
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
    const json = await r.json();
    if (!json.chart?.result?.[0]) return res.status(404).json({ error: 'no data' });
    return res.status(200).json(json);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
