# 🎨 CLive Frontend (React + Vite)

Real-time user interface for the **CLive** chat application, featuring Material UI components, form validations, and a clean API service layer.

---

## 🚀 Tech Stack
- **React 18**
- **Vite** (Build Tool)
- **Material UI (MUI)** (Component Library)
- **ESLint** (Code Quality)
- **Socket.IO Client** (Upcoming)

---

## 📁 File Structure

```text
front_end/
├── src/
│   ├── pages/
│   │   ├── Auth.jsx          # Login & Sign Up form with state toggle and MUI components
│   │   └── Dashboard.jsx     # Dashboard landing page
│   ├── styles/
│   │   └── auth.css          # Centering and container styling for Auth page
│   └── utils/
│       ├── constant.js       # API base URL and endpoints (/api/signup, /api/login)
│       ├── validation.js     # Form validation logic (Email, Indian Phone, Password)
│       └── api.js            # Universal API request helper (apiPost) with error handling
├── package.json
└── vite.config.js


# Navigate to frontend folder
cd front_end

# Install dependencies
npm install

# Start development server
npm run dev