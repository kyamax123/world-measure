export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');

  const { ticker, range } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker is required' });

  const t = decodeURIComponent(ticker);
  const r = range || 'max';

  try {
    // 円は長期データのあるUSDJPY=Xを使う
    const symbol = t === 'JPY' ? 'USDJPY=X' : t;
    
    const url = 'https://query2.finance.yahoo.com/v8/finance/chart/' + symbol + '?interval=1mo&range=' + r + '&corsDomain=finance.yahoo.com';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) return res.status(response.status).json({ error: 'yahoo error' });
    const json = await response.json();
    if (!json.chart?.result?.[0]) return res.status(404).json({ error: 'no data' });

    // 円の場合は逆数にする（「円の価値」として表示するため）
    if (t === 'JPY') {
      const result = json.chart.result[0];
      const closes = result.indicators.quote[0].close;
      result.indicators.quote[0].close = closes.map(function(v) {
        return v ? 1 / v : null;
      });
    }

    return res.status(200).json(json);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
