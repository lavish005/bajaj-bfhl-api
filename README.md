# Bajaj BFHL REST API

## Endpoints

### `GET /health`
Returns health check status.

### `POST /bfhl`
Accepts exactly one of the following keys:

| Key | Input | Output |
|-----|-------|--------|
| `fibonacci` | Integer | Fibonacci series |
| `prime` | Integer array | Filtered prime numbers |
| `lcm` | Integer array | LCM value |
| `hcf` | Integer array | HCF value |
| `AI` | Question string | Single-word AI response |

## Local Development

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`

## Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

Set environment variable `GEMINI_API_KEY` in Vercel project settings.

## Tech Stack
- Node.js + Express
- Google Gemini AI
- Helmet (security headers)
- CORS enabled
- Rate limiting
