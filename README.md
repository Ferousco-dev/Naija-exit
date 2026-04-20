# 🌍 Naija Exit - Japa Readiness Planner

> Your daily companion for planning emigration from Nigeria. Calculate savings goals, track FX rates, and get AI-powered action plans.

## ✨ Features

### 💰 Financial Signals

- **Savings Progress**: Track your total savings vs target
- **Velocity Score**: Monitor how fast you're saving (₦/month trend)
- **FX Trend Score**: See which currencies are improving
- **Bayse Market Sentiment**: AI prediction markets insights

### 📊 Dashboard

- Real-time Japa Score (0-100)
- Score breakdown by signal
- Monthly savings progress
- Target country relocation costs
- Estimated months to reach goal

### 📈 FX Rate Management

- **Live Rates**: USD, GBP, CAD, EUR, AUD (₦ per unit)
- **Rate History**: 30-day trend charts by currency
- **Direction Indicators**: ↑ Green (improving) / ↓ Red (declining)
- **Rate Alerts**: Set target rates, get notified when reached
- **Daily Updates**: Automatic refresh at 2 AM UTC from ConvertAPI

### 🤖 AI Assistant

- Context-aware chatbot (floating widget)
- Action plan generation for reaching goals
- Quick-reply buttons for common questions
- Full Japa context in conversations

### 💾 Data Management

- localStorage for offline access
- Supabase database for FX rate history
- Score snapshots with monthly trends
- FX alert persistence

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier OK)
- ConvertAPI key (free tier available)
- Groq API key (free tier available)

### Setup

```bash
# Clone and install
git clone <repo>
cd naija-exit
npm install

# Add environment variables
cp .env.example .env.local
# Edit .env.local with your keys:
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_CONVERTAPI_SECRET=your_secret
VITE_GROQ_API_KEY=your_groq_key

# Start dev server
npm run dev

# Visit http://localhost:5174
```

### Setting Up FX Rate Automation

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed steps:

1. Create Supabase database table
2. Deploy Edge Function (`fetch-fx-rates`)
3. Enable scheduled execution (2 AM UTC daily)
4. Verify data flow

## 📁 Project Structure

```
naija-exit/
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx          # Main dashboard
│   │   ├── FXRatesPage.jsx        # FX rate dashboard
│   │   ├── Landing.jsx            # Onboarding
│   │   └── Onboarding.jsx         # User setup
│   ├── components/
│   │   ├── Topbar.jsx             # Header
│   │   ├── Sidebar.jsx            # Right sidebar
│   │   ├── ScoreGauge.jsx         # Japa Score
│   │   ├── SignalCards.jsx        # Signal breakdown
│   │   ├── Ticker.jsx             # Bottom ticker
│   │   ├── AIInsight.jsx          # Action plans
│   │   ├── ScoreHistory.jsx       # 30-day chart
│   │   ├── FloatingChatBot.jsx    # AI assistant
│   │   ├── FXAlerts.jsx           # Alert modal
│   │   └── FXRateHistory.jsx      # Rate history chart
│   ├── services/
│   │   ├── exchangerate.js        # FX rates (Supabase priority)
│   │   ├── supabase.js            # Supabase client
│   │   ├── bayse.js               # Prediction markets
│   │   └── costEstimator.js       # Relocation costs
│   ├── hooks/
│   │   └── useJapaScore.js        # Score calculation
│   └── utils/
│       ├── scoreEngine.js         # Algorithms
│       ├── storage.js             # localStorage wrapper
│       └── historyManager.js      # History tracking
├── supabase/functions/fetch-fx-rates/    # Daily rate fetch
├── .env.example                   # Template
└── SUPABASE_SETUP.md             # Setup guide
```

## 🔑 Environment Variables

Create `.env.local`:

```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# APIs (required)
VITE_CONVERTAPI_SECRET=your_convertapi_secret
VITE_GROQ_API_KEY=your_groq_api_key

# Optional fallbacks
VITE_EXCHANGE_API_KEY=your_exchange_api_key
VITE_BAYSE_PUBLIC_KEY=your_bayse_key
```

## 📊 How FX Rates Work

### Automatic Daily Updates

```
ConvertAPI (live rates)
         ↓
Supabase Edge Function (2 AM UTC daily)
         ↓
Supabase Database (fx_rates table)
         ↓
Frontend (always fresh data)
         ↓
LocalStorage (1-hour cache)
```

### Fallback Chain

1. Supabase DB (daily updated ✅)
2. Browser cache (1 hour)
3. exchangerate-api.com (if key available)
4. exchangerate.host (free, unlimited)
5. Groq LLM (AI fallback)
6. Hardcoded rates (last resort)

## 🧪 Testing

```bash
# Start dev server
npm run dev

# Test Edge Function locally
supabase functions serve

# In another terminal
curl -X POST http://localhost:54321/functions/v1/fetch-fx-rates
```

## 📚 Documentation

- [**SUPABASE_SETUP.md**](./SUPABASE_SETUP.md) - Complete setup guide for database & automation
- [**.env.example**](./.env.example) - Environment variables template
- [Supabase Docs](https://supabase.com/docs)
- [ConvertAPI Docs](https://www.convertapi.com/doc)
- [Groq Docs](https://console.groq.com/docs)

## 🚀 Deployment

### Vercel

```bash
vercel --prod
# Set all env vars in Vercel dashboard
```

### Netlify

```bash
netlify deploy --prod
# Add VITE_-prefixed vars in Netlify settings
```

## 🐛 Troubleshooting

**Rates showing as stale?**

- Clear localStorage: DevTools → Application → Storage → Clear All
- Check if Edge Function ran: Supabase Dashboard → Functions → fetch-fx-rates → Logs

**ConvertAPI errors?**

- Verify API secret in .env.local
- Test: `curl "https://api.convertapi.com/convert?api_secret=KEY&from=NGN&to=USD&value=1"`

**Supabase connection issues?**

- Verify credentials in .env.local
- Check `VITE_SUPABASE_URL` format
- Run SQL setup from SUPABASE_SETUP.md

## 🎉 What's Next?

- [ ] Mobile app (React Native)
- [ ] Email notifications for rate changes
- [ ] SMS alerts
- [ ] Export savings plan as PDF
- [ ] Collaborative accounts
- [ ] Integration with Nigerian fintech

---

**Built with ❤️ for Nigerians planning their Japa journey** 🇳🇬 ✈️
npm run dev

````

The app will start at `http://localhost:5173`

## Build

```bash
npm run build
````
