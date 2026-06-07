export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { ticker } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'ticker is required' });
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1mo&range=max`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'ja-JP,ja;q=0.9',
        'Referer': 'https://finance.yahoo.com',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo Finance error: ${response.status}` });
    }

    const data = await response.json();

    if (!data.chart?.result?.[0]) {
      return res.status(404).json({ error: 'No data found', ticker });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'fetch failed', message: e.message });
  }
}
