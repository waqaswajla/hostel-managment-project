# HostelPro — Smart Hostel Management System

> Full-stack web application · Three.js 3D animated scene · Chart.js analytics · Glassmorphism UI · LocalStorage persistence

---

## Live Features

| Module | Description |
|--------|-------------|
| **3D Hero Scene** | Interactive Three.js building — orbiting camera, glowing room windows, floating particles, responds to mouse |
| **Dashboard** | KPI cards (students, occupancy, revenue, fees) + 3 animated Chart.js charts |
| **Student Management** | Profile card grid with search, fee-status filter, room-type filter |
| **Room Grid** | 10×10 visual grid — green (available) / red (occupied), click to manage |
| **Fee Tracking** | Full & partial payment support, real-time outstanding balance |
| **Notifications** | Auto-generated alerts for overdue fees, unassigned rooms, low availability |
| **Add / Remove Students** | Form validation, duplicate ID detection, instant UI refresh |
| **Room Allocation** | Visual room picker modal, one-click allocation |
| **LocalStorage** | All data persists across page reloads — no backend required |

---

## Screenshots

| Hero (3D Scene) | Dashboard | Rooms Grid |
|:---:|:---:|:---:|
| Three.js rotating hostel building | KPI cards + 3 live charts | 10×10 colour-coded room grid |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| 3D Graphics | Three.js r0.158 |
| Charts | Chart.js 4.4 |
| Styling | Vanilla CSS — glassmorphism, CSS variables, animations |
| Logic | Vanilla JavaScript (ES6+) |
| Fonts | Inter · Space Grotesk (Google Fonts) |
| Persistence | browser localStorage |
| Deployment | GitHub Pages (zero config) |

---

## Project Structure

```
hostel-managment-project/
├── index.html                       # SPA entry point
├── css/
│   └── style.css                    # Dark glassmorphism theme
├── js/
│   ├── data.js                      # State, demo data, localStorage, mutations
│   ├── scene.js                     # Three.js 3D hostel building scene
│   ├── charts.js                    # Chart.js occupancy, room type, revenue charts
│   └── app.js                       # UI rendering, events, modals, search
├── c++ hostel managment project.cpp # Original C++ console application
└── README.md
```

---

## Quick Start

No build tools required — just open `index.html` in any modern browser.

```bash
git clone https://github.com/waqaswajla/hostel-managment-project.git
cd hostel-managment-project
# Open index.html in your browser
```

Or serve with any static server:
```bash
npx serve .
# OR
python -m http.server 8080
```

---

## Demo Data

On first load the app seeds **15 pre-built student profiles** across all room types:

| Room Range | Type | Rooms |
|------------|------|-------|
| R1 – R25   | 1-Seater (Premium) | 25 |
| R26 – R60  | 2-Seater (Standard) | 35 |
| R61 – R100 | 4-Seater (Economy) | 40 |

Click **Reset Demo Data** on the dashboard to restore the original state at any time.

---

## Hostel Features (from original C++ app — now fully web-enabled)

- **Student Registration** — ID, name, check-in date, phone, fees due
- **Room Allocation** — visual picker grid, room type shown, instant feedback
- **Fee Payment** — full or partial payment, change calculation
- **Room Availability** — real-time 10×10 grid with colour coding
- **Student Display** — searchable card grid with profile details

---

## Author

**Waqas Ahmed** — [GitHub](https://github.com/waqaswajla)
