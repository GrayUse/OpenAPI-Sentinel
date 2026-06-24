# 🛡️ OpenAPI Sentinel

**Lightweight OpenAPI validation & governance tool** — a faster, leaner alternative to Stoplight.

## Features

| Feature | Description |
|:---|:---|
| ✅ **OpenAPI 3.0/3.1 Linting** | Powered by Redocly — deep validation with 50+ built-in rules |
| ✅ **Real-time Editor** | Monaco Editor with YAML/JSON auto-detection, syntax highlighting |
| ✅ **API Documentation** | Instant preview with Scalar API Reference |
| ✅ **Mock Server** | One-click mock with auto-generated responses from schemas |
| ✅ **Rule Management** | Configure linting severity per-rule with preset modes |
| ✅ **Import/Export** | Load and save OpenAPI specs (YAML/JSON) |

## Why Sentinel?

| | Stoplight Studio | OpenAPI Sentinel |
|:---|:---|:---|
| Memory | ~500MB (Electron) | ~80MB (Browser) |
| Install Size | ~300MB | ~50MB |
| Startup | 5-10s | <2s |
| CPU (idle) | 3-8% | <1% |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (frontend + backend)
npm run dev
```

Open `http://localhost:5173` in your browser.

## Tech Stack

- **Frontend**: Vite + Vanilla JS + Monaco Editor
- **Backend**: Hono (ultra-lightweight HTTP framework, 12KB)
- **Linting**: Redocly OpenAPI Core
- **Docs**: Scalar API Reference
- **Mock**: Custom schema-based faker (zero heavy deps)

## Architecture

```
┌──────────────────────────────────────┐
│           Browser (SPA)              │
│  ┌────────┐ ┌──────┐ ┌───────────┐  │
│  │ Monaco  │ │Scalar│ │Mock Panel │  │
│  │ Editor  │ │ Docs │ │  + Rules  │  │
│  └────┬───┘ └──────┘ └─────┬─────┘  │
│       │                     │        │
│  ┌────▼─────────────────────▼────┐   │
│  │      Fetch API → /api/*       │   │
│  └───────────────┬───────────────┘   │
└──────────────────┼───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│         Hono Server (:3001)          │
│  ┌──────────┐ ┌────────┐ ┌───────┐  │
│  │ Redocly  │ │  Mock   │ │ File  │  │
│  │ Linter   │ │ Router  │ │Handler│  │
│  └──────────┘ └────────┘ └───────┘  │
└──────────────────────────────────────┘
```

## License

MIT
