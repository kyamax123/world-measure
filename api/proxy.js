export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker is required' });

  const t = decodeURIComponent(ticker);

  try {
    if (t === 'BTC-USD') {
      const r = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=3650&interval=monthly', {
        headers: { 'Accept': 'application/json' }
      });
      const json = await r.json();
      const timestamps = json.prices.map(p => Math.floor(p[0] / 1000));
      const closes = json.prices.map(p => p[1]);
      return res.status(200).json({ chart: { result: [{ timestamp: timestamps, indicators: { quote: [{ close: closes }] } }] } });
    }

    if (t === 'JPY') {
      const r = await fetch('https://api.coingecko.com/api/v3/coins/usd-coin/market_chart?vs_currency=jpy&days=3650&interval=monthly', {
        headers: { 'Accept': 'application/json' }
      });
      const json = await r.json();
      const timestamps = json.prices.map(p => Math.floor(p[0] / 1000));
      const closes = json.prices.map(p => p[1]);
      return res.status(200).json({ chart: { result: [{ timestamp: timestamps, indicators: { quote: [{ close: closes }] } }] } });
    }

    const url = 'https://query2.finance.yahoo.com/v8/finance/chart/' + t + '?interval=1mo&range=max&corsDomain=finance.yahoo.com';
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      }
    });
    const json = await r.json();
    if (!json.chart?.result?.[0]) return res.status(404).json({ error: 'no data' });
    return res.status(200).json(json);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
