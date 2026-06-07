export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { ticker } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: 'ticker is required' });
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1mo&range=10y`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      }
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'fetch failed' });
  }
}
