# Network Tracer

![status](https://img.shields.io/badge/status-active-brightgreen)
![license](https://img.shields.io/badge/license-MIT-blue)
![node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)

A small website that traces the network route to a domain or IP address and visualizes each hop on a map.

## How it works

1. You enter a domain or IP in the browser.
2. The backend runs the system `traceroute` command against that target.
3. Each hop's IP is looked up via a free GeoIP API to get its approximate location.
4. The frontend displays a table of hops and plots the route on a Leaflet map.

## Requirements

- Node.js 18+ (uses the built-in `fetch`)
- The `traceroute` command available on the machine running the server
  - Linux: `sudo apt install traceroute` (Debian/Ubuntu) or `sudo yum install traceroute` (RHEL/CentOS)
  - macOS: included by default
  - Windows: not supported by this version (it uses `tracert`, a different output format)

## Setup

```bash
npm install
cp .env.example .env
npm start
```

Then open `http://localhost:3000` in your browser.

For development with auto-restart on file changes:
```bash
npm run dev
```

## Project structure

```
network-tracer/
├── public/
│   └── index.html          # Frontend: form, hop table, Leaflet map
├── routes/
│   └── trace.js            # POST /api/trace — validation, rate limiting, response
├── services/
│   ├── traceroute.js       # Runs the system traceroute command and parses output
│   └── geoip.js            # Looks up lat/lng + ISP for each hop's IP
├── LICENSE
├── README.md
├── package.json
└── server.js               # Express app entry point
```

## Notes on security

- Requests are rate-limited (5 per minute per client IP by default — see `routes/trace.js`).
- Tracing to private/internal IP ranges (10.x, 172.16–31.x, 192.168.x, 127.x, etc.) is blocked to prevent the server being used to scan its own internal network.
- Target input is restricted to characters valid in a domain/IP before being passed to the traceroute command, to prevent shell injection.

If you plan to deploy this publicly, consider adding:
- A stricter/global rate limiter (e.g. `express-rate-limit` + a reverse proxy limit)
- A CAPTCHA on the form to deter automated abuse
- A queue so only one traceroute runs at a time per server

## Roadmap

- [x] Real traceroute + hop table
- [x] GeoIP lookup per hop
- [x] Map visualization
- [ ] Stream hops to the frontend as they arrive (Server-Sent Events) instead of waiting for the full trace
- [ ] Swap the free `ip-api.com` lookup for a local MaxMind GeoLite2 database (no rate limits, works offline)
- [ ] Add ASN/BGP lookups for more network detail per hop
- [ ] Dockerize for easier deployment (the container needs the `traceroute` package installed and, in some environments, the `NET_RAW` capability)

## License

MIT
