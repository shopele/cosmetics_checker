export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// ── レート制限（IPベース・インメモリ） ─────────────────────────
// 注意: Vercel のサーバーレス環境ではインスタンスごとに Map が独立するため
// 厳密なグローバル制限ではないが、暴走的なリクエストの抑制には有効。
const ipRequestCounts = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function getRateLimitInfo(ip) {
  const now = Date.now();
  const info = ipRequestCounts.get(ip);
  if (!info || now > info.resetAt) {
    const newInfo = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    ipRequestCounts.set(ip, newInfo);
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: newInfo.resetAt };
  }
  info.count++;
  return {
    allowed: info.count <= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - info.count),
    resetAt: info.resetAt,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  // レート制限チェック
  const ip = getClientIp(req);
  const rl = getRateLimitInfo(ip);
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
  if (rl.resetAt) {
    res.setHeader('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)));
  }
  if (!rl.allowed) {
    const retryAfterSec = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      error: { message: '送信回数の制限に達しました。しばらく待ってから再試行してください。' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY が設定されていません' } });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
