# MOOVED Ghana E-Bike Market Survey

A multi-model electric vehicle market research survey for Ghana, deployed on GitHub Pages with data stored in GitHub.

## 🌐 Live Demo

**Survey URL**: https://leo520-dev.github.io/mooved-ebike-survey/

## 📋 Features

- Multi-model vehicle survey (add multiple models per submission)
- Region and district tracking
- Admin dashboard with statistics
- Export data as JSON or CSV
- Mobile-friendly design
- Dark theme UI

## 🚀 Deployment

This project uses GitHub Pages for hosting:

1. Go to repository Settings > Pages
2. Set Source to "Deploy from a branch"
3. Select `main` branch and `/ (root)` folder
4. Click Save

The site will be available at `https://<username>.github.io/<repo-name>/`

## 📊 Data Storage

Data is stored in `data/survey-data.json` file within the repository. Each submission includes:
- Salesperson name
- Region (Ghana regions)
- District/City
- Multiple vehicle models with specifications

## 🔐 Admin Access

Admin Panel password: `mooved2026`

## 📁 Project Structure

```
├── index.html          # Main survey application
├── data/               # Data storage directory
│   └── survey-data.json  # Survey submissions (auto-generated)
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

## 🛠️ Development

No build process required - it's a single HTML file with embedded CSS and JavaScript.

## 📝 License

MIT License
