# Farm2Door — Complete Setup Guide (macOS)

## Step 1 — Start MongoDB
```bash
brew services start mongodb-community
```
If not installed:
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community
```

## Step 2 — Install Server Dependencies
```bash
cd server
npm install
```

## Step 3 — Install Client Dependencies
Open a new terminal tab, then:
```bash
cd client
npm install
```

## Step 4 — Seed the Database
Back in the server terminal:
```bash
cd server
npm run seed
```
You should see:
```
✅ Connected to MongoDB
✅ Users created  (password for all: Password@123)
✅ Farmers created
✅ 26 Products created — all images verified
✅ 10 sample orders created
✅ Farm2Door Database Seeded Successfully!
```

## Step 5 — Start the Backend
```bash
cd server
npm run dev
```
Server runs at: http://localhost:5000

## Step 6 — Start the Frontend
In a NEW terminal tab:
```bash
cd client
npm run dev
```
Open: **http://localhost:5173**

---

## Demo Accounts (all use password: Password@123)

| Role     | Email                      | Password      |
|----------|---------------------------|---------------|
| Admin    | admin@farm2door.com       | Password@123  |
| Customer | customer@farm2door.com    | Password@123  |
| Farmer   | ramesh@farm2door.com      | Password@123  |
| Delivery | delivery@farm2door.com    | Password@123  |

---

## Troubleshooting

**"nodemon: command not found"**
→ You skipped `npm install` in the server folder. Run:
```bash
cd server && npm install
```

**"Cannot find module 'dotenv'"**
→ Same — run `npm install` first.

**"MongoDB connection error"**
→ MongoDB is not running. Run:
```bash
brew services start mongodb-community
```

**Login not working after reseed**
→ Clear browser localStorage: DevTools → Application → Local Storage → Clear All
→ Then reseed: `cd server && npm run seed`
