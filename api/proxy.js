export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Cache-Control は成功時のみ設定する（エラーレスポンスをCDNにキャッシュさせない）

  const { ticker, range } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker is required' });

  const t = decodeURIComponent(ticker);

  // FREDで取得すべき系列の定義
  // invert: true の場合は逆数を返す（ドル円→円の価値に変換）
  const FRED_SERIES = {
    // LBMA金価格（AM fix）: https://fred.stlouisfed.org/series/GOLDAMGBD228NLBM
    // 注: LBMAシリーズはアクセス制限の可能性あり。要確認。
    'GLD': { series: 'GOLDAMGBD228NLBM', invert: false },
    'JPY': { series: 'DEXJPUS',          invert: true  },
  };

  try {
    if (FRED_SERIES[t]) {
      return await handleFred(req, res, t, FRED_SERIES[t]);
    } else {
      return await handleYahoo(req, res, t, range || 'max');
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// ── FRED ────────────────────────────────────────────────────────────────────

async function handleFred(req, res, ticker, { series, invert }) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'FRED_API_KEY not configured' });

  const url = 'https://api.stlouisfed.org/fred/series/observations'
    + '?series_id=' + series
    + '&api_key=' + apiKey
    + '&file_type=json'
    + '&frequency=m'
    + '&observation_start=1960-01-01';
    // aggregation_method は省略（系列によってはeop非対応で400になるため）

  const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('FRED error', response.status, body);
    return res.status(response.status).json({ error: 'FRED error: ' + response.status, detail: body });
  }

  const json = await response.json();
  if (!json.observations) return res.status(404).json({ error: 'no FRED data' });

  // FREDレスポンス → Yahoo Finance chart形式に変換してフロント側を共通化する
  const timestamps = [];
  const closes     = [];

  for (const obs of json.observations) {
    if (obs.value === '.') continue;   // 欠損値はスキップ
    const v = parseFloat(obs.value);
    if (isNaN(v) || v <= 0) continue;

    // "2024-01-01" → Unix秒（月初）
    timestamps.push(Math.floor(new Date(obs.date).getTime() / 1000));
    closes.push(invert ? 1 / v : v);
  }

  // 成功時のみキャッシュ（1時間）
  res.setHeader('Cache-Control', 's-maxage=3600');
  return res.status(200).json({
    chart: {
      result: [{
        timestamp: timestamps,
        indicators: { quote: [{ close: closes }] }
      }]
    }
  });
}

// ── Yahoo Finance ────────────────────────────────────────────────────────────

async function handleYahoo(req, res, ticker, range) {
  const symbol = ticker;

  const url = 'https://query2.finance.yahoo.com/v8/finance/chart/'
    + symbol + '?interval=1mo&range=' + range + '&corsDomain=finance.yahoo.com';

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
  });

  if (!response.ok) return res.status(response.status).json({ error: 'yahoo error' });
  const json = await response.json();
  if (!json.chart?.result?.[0]) return res.status(404).json({ error: 'no data' });

  res.setHeader('Cache-Control', 's-maxage=3600');
  return res.status(200).json(json);
}
