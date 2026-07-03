# 🛡️ OpenAPI Sentinel

**Lightweight OpenAPI validation & governance tool** — a faster, leaner alternative to Stoplight.

## Features

| Feature | Description |
|:---|:---|
| ✅ **OpenAPI 3.0/3.1 Linting** | Powered by Redocly — deep validation with 50+ built-in rules, running entirely in your browser |
| ✅ **Real-time Editor** | Monaco Editor with YAML/JSON auto-detection, syntax highlighting, and virtual scroll syncing |
| ✅ **Visual Schema Editor** | Powerful Form View for easy Models/Schemas CRUD without writing YAML by hand |
| ✅ **AST-Based Scroll Sync** | Seamless two-way binding: scrolling the visual form perfectly aligns the YAML editor to the exact AST node |
| ✅ **API Documentation** | Instant preview with Scalar API Reference |
| ✅ **Rule Management** | Configure linting severity per-rule with preset modes |
| ✅ **Export** | Stream download export for zero-friction spec saving |

## Why Sentinel?

| | Stoplight Studio | OpenAPI Sentinel |
|:---|:---|:---|
| Memory | ~500MB (Electron) | ~80MB (Browser) |
| Install Size | ~300MB | ~50MB |
| Startup | 5-10s | <2s |
| CPU (idle) | 3-8% | <1% |
| Architecture | Desktop App | 100% Pure Client-Side SPA |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

## Tech Stack

- **Frontend**: Vite + Vanilla JS + Monaco Editor
- **AST Manipulation**: `yaml`
- **Linting**: `@redocly/openapi-core` (bundled via `vite-plugin-node-polyfills`)
- **Docs**: Scalar API Reference

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                      Browser (SPA)                     │
│  ┌────────┐ ┌─────────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Monaco │ │ Form Editor │ │ Scalar   │ │ Rule     │  │
│  │ Editor │ │ (Visual)    │ │ Docs     │ │ Panel    │  │
│  └────┬───┘ └──────┬──────┘ └────┬─────┘ └─────┬────┘  │
│       │            │             │             │       │
│  ┌────▼────────────▼─────────────▼─────────────▼────┐  │
│  │               State Management & AST             │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          │                             │
│  ┌───────────────────────▼──────────────────────────┐  │
│  │      Redocly OpenAPI Core (Running in-browser)   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

> **Note:** Sentinel has evolved to be 100% client-side. The previous Hono backend dependency has been entirely removed to ensure maximum performance, offline capability, and zero-latency linting via Web Workers.

## License

MIT
