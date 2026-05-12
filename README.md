# 🌱 Farm2Door - Fresh from Farm to Your Hand

A full-stack MERN production app for farm produce delivery — similar to BigBasket/Blinkit.

---

## 🗂 Project Structure

```
farm2door/
├── client/          # React (Vite) frontend
├── server/          # Express.js + MongoDB backend
│   ├── config/      # DB, logger
│   ├── controllers/ # Auth, product, order, admin, cart
│   ├── middleware/  # Auth JWT, validation, errorHandler
│   ├── models/      # User, Farmer, Product, Order, Cart, Payment...
│   ├── routes/      # All API routes
│   ├── seed/        # Database seeder
│   └── services/    # Pricing engine, AI agents (cron)
├── .env.example
└── README.md
```

---

## 🚀 Tech Stack

- **MongoDB** + Mongoose (NoSQL)
- **Express.js** REST API
- **React.js** (Vite) + Tailwind CSS
- **Node.js** runtime
- **JWT** auth + bcrypt
- **React Query** for server state
- **Recharts** for analytics charts
- **node-cron** for AI agent scheduling

---

## 👥 Roles & Dashboards

| Role | Dashboard | URL |
|------|-----------|-----|
| Admin | Full control panel | `/admin` |
| Farmer | Product & order management | `/farmer` |
| Customer | Shop, cart, orders | `/` |
| Delivery | Accept & track deliveries | `/delivery` |

---

## 🧠 AI Agent System

Six autonomous agents run on cron schedules:

| Agent | Schedule | Function |
|-------|----------|----------|
| PricingAgent | Every hour | Adjusts prices based on demand/supply |
| DemandForecastAgent | Every 6 hours | Predicts product demand trends |
| LogisticsAgent | Every 30 min | Auto-assigns packed orders to delivery partners |
| WasteReductionAgent | Twice daily | Flags expiring products for auto-discount |
| RecommendationAgent | Daily midnight | Updates trending product list |
| FarmerAdvisoryAgent | On demand | Sends market tips to farmers |

---

## 💰 Smart Pricing Engine

```
IF demand > supply → increase price (within ceiling)
IF supply > demand → decrease price (above base)
IF days_to_expiry ≤ 3 → auto 25% discount
IF stock < 15 → anti-hoarding limits applied
```

---

## 📧 Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | admin@farm2door.com | Password@123 |
| 🛒 Customer | customer@farm2door.com | Password@123 |
| 🌾 Farmer | ramesh@farm2door.com | Password@123 |
| 🚚 Delivery | delivery@farm2door.com | Password@123 |

---

## 🌐 Features

- ✅ JWT Authentication + Role-based access
- ✅ Smart cart with +/– buttons and badge
- ✅ Real-time pricing engine
- ✅ Pre-order & subscription baskets
- ✅ Anti-hoarding limits
- ✅ Live delivery tracking simulation
- ✅ Payment simulation (COD / UPI / Card)
- ✅ Multi-language: English + Telugu
- ✅ Product recommendations, bestsellers, trending
- ✅ Admin analytics dashboard with charts
- ✅ 6 Agentic AI systems
- ✅ 25+ seed products, 5 farmers, 12 orders
- ✅ Mobile responsive UI

---

## 🏃 Running the Project

See **HOW TO RUN** section below.
