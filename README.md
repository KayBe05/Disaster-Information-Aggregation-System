# Disaster-Information-Aggregation-System
a web-based map interface designed to visualize location-based data or context for community-oriented programs. 

DIAS-PROJECT/
├── .env                       # API Keys (USGS, OpenWeather, DB_URI)
├── .gitignore                 # Ignore node_modules, .env, .DS_Store
├── package.json               # Project dependencies (Express, Mongoose, etc.)
├── README.md                  # Documentation
│
├── public/                    # FRONTEND (Served to User)
│   ├── index.html             # Main Dashboard (Map + Live Feed)
│   ├── admin.html             # (New) Command Center for verifying reports
│   ├── settings.html          # (New) User preferences (Alert radius, Theme)
│   ├── preparedness.html      # (New) Offline safety guides & checklists
│   ├── volunteer.html         # Citizen Reporter Portal
│   ├── signup.html            # Authentication (Login/Register)
│   │
│   ├── assets/                # Static Media
│   │   ├── img/               # Images (logo.png, hero-bg.jpg)
│   │   └── icons/             # SVG markers for Map (Quake, Fire, Flood)
│   │
│   ├── css/                   # Stylesheets
│   │   ├── main.css           # Core variables, grid, typography (Renamed from style.css)
│   │   ├── components/        # specific UI components
│   │   │   ├── map.css        # Map-specific styles
│   │   │   └── feed.css       # News ticker styles
│   │   └── pages/             # Page-specific styles
│   │       ├── admin.css      # Styles for the verification dashboard
│   │       ├── settings.css   # Styles for toggles and forms
│   │       ├── safety.css     # Styles for preparedness guides
│   │       └── volunteer.css  #
│   │
│   └── js/                    # Client-side Logic
│       ├── app.js             # Entry point (initializes modules)
│       ├── config.js          # Global config (API endpoints, default map center)
│       │
│       ├── modules/           # Logic Components
│       │   ├── map.js         # Leaflet logic (Markers, Popups)
│       │   ├── feed.js        # Live Ticker logic
│       │   ├── search.js      # Search bar logic
│       │   └── admin.js       # Logic for approving/rejecting reports
│       │
│       ├── services/          # Data Fetching (The "Aggregator" logic)
│       │   ├── api.js         # Generic fetch wrapper
│       │   ├── usgs.js        # Fetches Earthquakes
│       │   ├── meteo.js       # Fetches Weather/Air Quality
│       │   └── auth.js        # Handles Login/Signup
│       │
│       └── pages/             # Page interactions
│           └── volunteer.js   # Form submission logic
│
└── server/                    # BACKEND (Node.js/Express)
    ├── app.js                 # Server entry point
    ├── config/                # Database connection (MongoDB)
    ├── controllers/           # Logic
    │   ├── authController.js  # Login/Register logic
    │   └── reportController.js# Handling citizen reports
    ├── models/                # Database Schemas
    │   ├── User.js            # User profile schema
    │   └── Report.js          # Citizen report schema (Lat, Lng, Type, Image)
    └── routes/                # API Endpoints
        ├── auth.js            # /api/auth/login
        └── reports.js         # /api/reports/submit
