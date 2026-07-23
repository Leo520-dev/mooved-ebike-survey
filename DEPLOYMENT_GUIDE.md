# MOOVED E-Bike Survey - Deployment Guide

## 📋 Overview

This is a market survey system for collecting e-bike data from sales teams in Ghana. It consists of:

1. **Frontend**: Static HTML/CSS/JS (deployed to GitHub Pages)
2. **Backend**: Flask API with SQLite database (runs on local server)

## 🔗 Live Survey Link

**https://leo520-dev.github.io/mooved-ebike-survey/**

---

## 🚀 How to Use

### For Sales Team (Ghana):
1. Open the link above on their mobile phone browser (Chrome/Safari)
2. Fill in their name and select their region
3. Add e-bike models with photos, specs (range, charging time, weight), and prices
4. Click "Submit Survey" — data is saved immediately

### For Admin (You):
1. Go to the same link
2. Click "Admin Panel" tab
3. Enter password: `mooved2026`
4. View statistics, export data (JSON/CSV), edit or delete submissions

---

## ⚠️ Important Note

The **frontend** is deployed to GitHub Pages and can be accessed by anyone with the link.

However, the **backend API** (Flask + SQLite) needs to run on a server to store data. Currently, it's running on your local machine at `http://localhost:5000`.

### To make the backend accessible:

#### Option 1: Run locally (for testing)
```bash
cd "D:\桌面\Hermes 中文社区版\4.个人工作辅助\加纳电动车调研"
python server.py
```
Then access the survey at: http://localhost:5000

#### Option 2: Deploy to a cloud server (recommended for production)
1. Set up a VPS (e.g., AWS EC2, DigitalOcean, Railway, Render)
2. Clone the repo and install dependencies:
   ```bash
   pip install flask
   ```
3. Run the server:
   ```bash
   python server.py
   ```
4. Update the frontend to point to the new backend URL

#### Option 3: Use a platform like Railway/Render
1. Create a new project on Railway or Render
2. Connect your GitHub repository
3. Set the build command to `pip install flask`
4. Set the start command to `python server.py`
5. The platform will automatically deploy both frontend and backend

---

## 📊 What Data Is Collected

| Field | Description |
|-------|-------------|
| Salesperson | Name of the person submitting |
| Region | Ghana region (Greater Accra, Ashanti, Western, etc.) |
| District/City | Specific city or district |
| Vehicle Photo | Image of the e-bike |
| Range (km) | Battery range in kilometers |
| Charging Time (hours) | Full charge time |
| Weight (kg) | Total bike weight |
| Price (GHS) | Selling price in Ghana Cedis |
| Notes | Brand, model, dealer info, etc. |

---

## 🛠️ Quick Start

```bash
# Clone the repo
git clone https://github.com/Leo520-dev/mooved-ebike-survey.git

# Run locally (requires Python 3.8+)
cd mooved-ebike-survey
python server.py

# Open http://localhost:5000
```

---

*Powered by Hermes Agent · MOOVED Solar*
