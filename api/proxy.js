export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker is required' });

  const decodedTicker = decodeURIComponent(ticker);

  const urls = [
    `https://query2.finance.yahoo.com/v8/finance/chart/${decodedTicker}?interval=1mo&range=max`,
    `https://query1.finance.yahoo.com/v8/finance/chart/${decodedTicker}?interval=1mo&range=max`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://finance.yahoo.com',
    'Referer': 'https://finance.yahoo.com/',
  };

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) continue;
      const data = await response.json();
      if (!data.chart?.result?.[0]) continue;
      return res.status(200).json(data);
    } catch (e) {
      continue;
    }
  }

  return res.status(500).json({ error: 'fetch failed', ticker: decodedTicker });
}
