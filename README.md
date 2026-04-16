# Naija Exit - Japa Score Calculator

Calculate your readiness to relocate from Nigeria based on savings, FX rates, political risk, and crypto sentiment.

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file in the root directory with the following keys:

```
VITE_GROQ_API_KEY=your_groq_api_key
VITE_BAYSE_PUBLIC_KEY=your_bayse_public_key
VITE_BAYSE_PRIVATE_KEY=your_bayse_private_key
VITE_EXCHANGE_API_KEY=your_exchangerate_api_key
```

**Where to get keys:**

- **Groq API**: https://console.groq.com (for AI chat)
- **Bayse API**: https://bayse.markets (for political & crypto data)
- **Exchange Rate API**: https://exchangerate-api.com (for FX rates)

## Running

```bash
npm run dev
```

The app will start at `http://localhost:5173`
