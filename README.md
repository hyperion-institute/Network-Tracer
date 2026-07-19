<div align="center">
<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,100:1e293b&height=120&section=header&text=NETWORK%20TRACER&fontSize=32&fontColor=00ffcc&fontAlignY=55&desc=trace%20%7C%20geolocate%20%7C%20visualize&descAlignY=80&descSize=14&descColor=94a3b8" width="100%"/>
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&duration=3000&pause=1000&color=00FFCC&center=true&vCenter=true&width=600&lines=trace+the+path+your+traffic+takes;every+hop%2C+geolocated+and+mapped;built+with+Node.js+%2B+Leaflet.js" alt="Typing SVG" />

![status](https://img.shields.io/badge/status-active-brightgreen)
![license](https://img.shields.io/badge/license-MIT-blue)
![node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
</div>

A small website that traces the network route to a domain or IP address and visualizes each hop on a map.

## How it works

1. You enter a domain or IP in the browser.
2. The backend runs the system `traceroute` command against that target.
3. Each hop's IP is looked up via a free GeoIP API to get its approximate location.
4. The frontend displays a table of hops and plots the route on a Leaflet map.

> **Note: ** **Run this on the machine/network you actually want to trace from.** `traceroute` shows the path *from wherever the backend is running* — not a generic path to the target. Running it on your own computer traces your own connection. Deploying it to a VPS in another country traces from that VPS's network instead, which is a different (and equally valid) use case, but not "your" route anymore. This project is designed to be cloned and run locally by each person who wants to trace their own connection, rather than hosted as one shared public instance.

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

## License

[MIT](LICENSE)
