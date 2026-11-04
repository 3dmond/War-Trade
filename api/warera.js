export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    // Extract endpoint by stripping /api/warera/ or /api/
    const endpoint = url.pathname.replace(/^\/api\/(warera\/)?/, '');
    const queryString = url.search;
    const targetUrl = `https://api2.warera.io/trpc/${endpoint}${queryString}`;

    const apiKey = req.headers['x-api-key'] || process.env.WARERA_API_KEY || 'wae_7152c6d478d157069e449cf27f377458bafc5133686f8c222252af4b8828f09e';

    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'x-api-key': apiKey
      }
    });

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (error) {
    console.error('[API Proxy Error]:', error);
    return res.status(500).json({ error: error.message || 'Internal proxy error' });
  }
}
