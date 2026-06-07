export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker is required' });

  const t = decodeURIComponent(ticker);

  try {
    // Bitcoin
    if (t === 'BTC-USD') {
      const r = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max&interval=monthly');
      const json = await r.json();
      const prices = json.prices;
      const timestamps = prices.map(p => Math.floor(p[0] / 1000));
      const closes = prices.map(p => p[1]);
      return res.status(200).json({ chart: { result: [{ timestamp: timestamps, indicators: { quote: [{ close: closes }] } }] } });
    }

    // 円（USD/JPY）
    if (t === 'USDJPY=X' || t === 'JPY=X') {
      const start = '2000-01-01';
      const end = new Date().toISOString().slice(0, 10);
      const r = await fetch(`https://api.frankfurter.app/${start}..${end}?from=USD&to=JPY`);
      const json = await r.json();
      const entries = Object.entries(json.rates).filter((_, i) => i % 21 === 0);
      const timestamps = entries.map(([date]) => Math.floor(new Date(date).getTime() / 1000));
      const closes = entries.map(([, v]) => v.JPY);
      return res.status(200).json({ chart: { result: [{ timestamp: timestamps, indicators: { quote: [{ close: closes }] } }] } });
    }

    // 株式・ETF（stooq）
    const stooqMap = {
      'SPY': 'spy.us', 'VT': 'vt.us', 'GLD': 'gld.us', 'QQQ': 'qqq.us',
      'EWJ': 'ewj.us', 'SLV': 'slv.us', 'USO': 'uso.us', 'IYR': 'iyr.us',
      'FXE': 'fxe.us', 'TLT': 'tlt.us'
    };
    const symbol = stooqMap[t] || (t.toLowerCase() + '.us');
    const r = await fetch(`https://stooq.com/q/d/l/?s=${symbol}&i=m`);
    const text = await r.text();
    const lines = text.trim().split('\n').slice(1);
    const timestamps = [], closes = [];
    for (const line of lines) {
      const cols = line.split(',');
      if (cols.length < 5) continue;
      const ts = Math.floor(new Date(cols[0]).getTime() / 1000);
      const close = parseFloat(cols[4]);
      if (!isNaN(ts) && !isNaN(close)) { timestamps.push(ts); closes.push(close); }
    }
    return res.status(200).json({ chart: { result: [{ timestamp: timestamps, indicators: { quote: [{ close: closes }] } }] } });

  } catch (e) {
    return res.status(500).json({ error: 'fetch failed', message: e.message });
  }
}
