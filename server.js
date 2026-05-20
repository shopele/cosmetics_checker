import 'dotenv/config';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const API_MODEL = process.env.ANTHROPIC_MODEL;

if (!API_KEY) {
  console.error('エラー: .env ファイルに ANTHROPIC_API_KEY が設定されていません');
  process.exit(1);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.static(join(__dirname)));

app.post('/api/check', async (req, res) => {
  try {
    const body = { ...req.body };
    if (API_MODEL) {
      body.model = API_MODEL;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

app.listen(PORT, () => {
  console.log(`サーバー起動中: http://localhost:${PORT}`);
});
