# 🛡️ Sentinel

A modern phishing detection platform built to protect users from malicious URLs through real-time scanning, browser extension integration, and an intuitive analytics dashboard.

![Sentinel Dashboard](https://sentinel-zeta-pied.vercel.app)

## 📋 Overview

Sentinel is a comprehensive cybersecurity solution that combines a Next.js web application with a Firefox browser extension to provide multi-layered phishing protection. The platform uses advanced URL analysis techniques to classify links as **Safe**, **Suspicious**, or **Unsafe**, helping users navigate the web securely.

## ✨ Features

### Web Dashboard
- **Real-time URL Scanner** — Manual URL input with instant classification
- **Threat Analytics** — Visual metrics and charts showing detection statistics
- **Activity Logs** — Complete history of all scanned URLs and classifications with filtering and pagination
- **Threat Database** — Browse and manage detected phishing attempts with add/delete functionality
- **User Authentication** — Secure login system
- **Responsive Design** — Optimized for all device sizes

### Firefox Extension
- **Automatic URL Capture** — Monitors visited websites in real-time
- **Instant Blocking** — Prevents access to confirmed phishing sites before they load
- **Visual Indicators** — Color-coded badge showing site safety status
- **Smart Cache** — 5-minute cache to reduce API calls
- **Whitelist Support** — Temporarily allow trusted sites
- **Seamless Integration** — Communicates directly with the Sentinel API

## 🏗️ Architecture

```
sentinel/
├── app/                    # Next.js application (App Router)
│   ├── api/               # API endpoints
│   │   ├── auth/          # Authentication routes
│   │   ├── logs/          # Activity logging API with filtering
│   │   ├── scan-url/      # URL scanning engine
│   │   ├── stats/         # Dashboard metrics
│   │   ├── threat-trend/  # Weekly threat data for charts
│   │   └── threats/       # Threat management (CRUD)
│   ├── login/             # Authentication page
│   ├── logs/              # Detection logs page with table view
│   ├── threats/           # Threats database page with management
│   ├── settings/          # User settings page
│   ├── ui/                # Reusable UI components
│   │   ├── charts.tsx     # Threat trend bar chart
│   │   └── nav.tsx        # Navigation component
│   ├── globals.css        # Global styles with CSS variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard (home)
├── extension/             # Firefox browser extension
│   ├── manifest.json      # Extension configuration
│   ├── background.js      # Core scanning & blocking logic
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup functionality
│   ├── blocked.html       # Blocked warning page
│   └── icons/             # Extension icons (16/32/48/128px)
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Prisma database client
│   ├── scanner.ts        # URL scanning algorithms
│   ├── punycode-polyfill.ts # Punycode support
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema & migrations
│   ├── schema.prisma     # Database models
│   └── seed.ts           # Seed data
└── public/               # Static assets
```

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma |
| **Auth** | Custom JWT implementation |
| **Charts** | Recharts |
| **Animation** | Framer Motion |
| **Deployment** | Vercel |
| **Extension** | Firefox WebExtension API (Manifest V2) |

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- pnpm (package manager)
- PostgreSQL database (Neon recommended)
- Firefox browser (for extension testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sentinel
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   ```env
   DATABASE_URL="postgresql://user:password@neon-host/dbname"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Initialize database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Run development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Firefox Extension Setup

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select the `extension/manifest.json` file from the project directory
4. The extension icon will appear in your toolbar

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth` | POST | User authentication |
| `/api/scan-url` | POST | Scan URL for phishing |
| `/api/logs` | GET | Fetch detection logs with filters (severity, date range, search) |
| `/api/threat-trend` | GET | Weekly threat statistics for charts |
| `/api/threats` | GET/POST/DELETE | Threat pattern management |
| `/api/stats` | GET | Dashboard statistics |

## 🔍 URL Scanning Methodology

The `scanner.ts` engine analyzes URLs using multiple heuristics:

- **Domain reputation** checks
- **URL structure** analysis (suspicious patterns, encoding)
- **Punycode** detection (homograph attacks)
- **SSL certificate** validation
- **Blacklist** cross-referencing
- **Machine learning** classification (optional enhancement)

Classification results:
- 🟢 **Safe** — No threats detected
- 🟡 **Suspicious** — Some risk factors present
- 🔴 **Unsafe** — Confirmed phishing attempt

## 🎨 Theme System

Sentinel uses a custom dark theme with CSS variables:

```css
--color-bg-primary: #0c1324;    /* Deep navy background */
--color-bg-muted: #0c1324f9;    /* Slightly transparent */
--color-bg-card: #191f31;       /* Card backgrounds */
--color-bg-hover: #1c2337;      /* Hover states */
--color-accent-blue: #b7c4ff;   /* Primary accent */
--color-accent-rose: #ffb4ab;   /* Danger/critical */
--color-accent-amber: #dec29a;  /* Warning/suspicious */
--color-text-primary: #dce1fb;  /* Primary text */
--color-text-muted: #c6c6cd;    /* Secondary text */
--color-danger: #f2a7a0;        /* Error states */
--color-warning: #e6c38a;       /* Warning states */
--color-success: #8fd4b2;       /* Success/safe states */
```

## 🚢 Deployment

### Web Application (Vercel)

```bash
pnpm build
vercel --prod
```

### Database (Neon)

1. Create project on [Neon](https://neon.tech)
2. Connect using connection string in environment variables
3. Run migrations: `npx prisma migrate deploy`

### Extension Distribution

1. Package extension: `cd extension && zip -r sentinel-extension.zip *`
2. Submit to [Firefox Add-ons](https://addons.mozilla.org/developers/)

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | JWT encryption secret | Yes |
| `NEXTAUTH_URL` | Application base URL | Yes |
| `API_RATE_LIMIT` | Requests per minute (default: 100) | No |
| `EXTENSION_ID` | Firefox extension ID for CORS | No |

## 🤝 Contributing

This is a final year group project. Team members should:

1. Create feature branches: `git checkout -b feature/description`
2. Follow existing code style (ESLint/Prettier configured)
3. Write meaningful commit messages
4. Open pull requests for review
5. Ensure tests pass before merging

## 🧩 Project Structure Details

### Dashboard (`app/page.tsx`)
- Hero section with URL scanner input
- Real-time statistics cards
- Threat trend chart
- Recent activity feed

### Logs Page (`app/logs/page.tsx`)
- Professional table layout with sorting
- Filter tabs (All Activity, Safe, Suspicious, Unsafe)
- Date range filtering
- CSV export functionality
- Pagination (15 items per page)
- Score visualization with progress bars

### Threats Page (`app/threats/page.tsx`)
- Add threat form (pattern, regex checkbox, severity, notes)
- Table view with all threat patterns
- Delete functionality
- Severity badges (Critical, High, Medium, Low)
- "Surveillance Module" header styling

### Charts (`app/ui/charts.tsx`)
- Recharts bar chart for weekly threat data
- Color-coded bars (blue for normal, rose for high threshold)
- Responsive container
- Loading and error states

## 📄 Documentation Files

- `AGENTS.md` — AI agent configuration and prompts
- `CLAUDE.md` — Claude-specific development notes
- `README.md` — This file

## 🎓 Academic Context

**Project Type:** Final Year Group Project  
**Institution:** [Your University]  
**Course:** [Course Name/Code]  
**Team Size:** [Number] members  
**Live Demo:** https://sentinel-zeta-pied.vercel.app

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- SQL injection protection via Prisma
- XSS protection via React escaping
- CORS configuration for extension
- Rate limiting on API endpoints
- Input validation on all forms

## 🐛 Troubleshooting

### Extension not blocking sites?
- Check if protection is enabled (click icon → toggle)
- Verify API is responding: check browser console for errors
- Ensure `webRequestBlocking` permission is granted

### Database connection errors?
- Verify `DATABASE_URL` is set in Vercel environment variables
- Check Prisma schema is pushed: `npx prisma db push`
- Ensure Neon database is active (not paused)

### Charts not loading?
- Check `/api/threat-trend` returns valid JSON
- Verify Recharts is installed: `npm install recharts`
- Check browser console for errors

## 📜 License

[MIT License](LICENSE) — Academic use permitted with attribution.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Database by [Neon](https://neon.tech)
- Hosted on [Vercel](https://vercel.com)
- Icons by [Lucide](https://lucide.dev)

---

Built with ❤️ by the Sentinel Team
