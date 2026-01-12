# 🎨 TPQ AMANAH - Frontend

Aplikasi frontend untuk sistem manajemen TPQ AMANAH menggunakan **Vue 3**, **Vite**, dan **TailwindCSS**.

---

## 🛠️ Tech Stack

- **Vue.js 3.5** – Composition API
- **Vite 7.x** – Build tool
- **Pinia 3.x** – State management
- **Vue Router 4.x** – Client-side routing
- **Axios** – HTTP client
- **TailwindCSS 3.x** – Utility-first CSS
- **Firebase Auth** – Google OAuth

---

## 📁 Struktur

```
frontend/
├── src/
│   ├── assets/               # Static files
│   ├── components/           # Reusable UI components
│   │   ├── AppFooter.vue
│   │   ├── AppNavbar.vue
│   │   ├── LoadingSpinner.vue
│   │   ├── MascotDialog.vue
│   │   └── ...
│   ├── composables/          # Vue composables
│   │   └── useResponsive.js
│   ├── router/               # Vue Router config
│   │   └── index.js
│   ├── services/             # API service
│   │   └── api.js            # Axios instance
│   ├── stores/               # Pinia stores
│   │   └── auth.js           # Authentication store
│   ├── utils/                # Utility functions
│   ├── views/
│   │   ├── HomeView.vue          # Landing page
│   │   ├── LoginView.vue         # Login page
│   │   ├── NotFoundView.vue      # 404 page
│   │   └── dashboard/
│   │       ├── DashboardLayout.vue
│   │       ├── DashboardHome.vue
│   │       ├── admin/            # Admin pages
│   │       │   ├── UserManagement.vue
│   │       │   ├── TeacherManagement.vue
│   │       │   ├── ContentManagement.vue
│   │       │   ├── AdminAttendanceView.vue
│   │       │   ├── AdminGradingView.vue
│   │       │   └── AdminGradingPeriodView.vue
│   │       └── guru/             # Teacher pages
│   │           ├── AttendanceView.vue
│   │           ├── GradingView.vue
│   │           └── GradingPeriodView.vue
│   ├── App.vue
│   ├── main.js
│   └── style.css             # Global styles
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Buat file `.env`:
```env
VITE_API_URL=http://localhost:5000/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

Hasil build tersedia di folder `dist/`.

```bash
npm run preview  # Preview production build locally
```

---

## 🔀 Routes

### Public Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | HomeView | Landing page |
| `/login` | LoginView | Login page |
| `/:pathMatch(.*)*` | NotFoundView | 404 page |

### Dashboard Routes (Requires Auth)
| Path | Component | Role |
|------|-----------|------|
| `/dashboard` | DashboardHome | All |
| `/dashboard/users` | UserManagement | Admin |
| `/dashboard/teachers` | TeacherManagement | Admin |
| `/dashboard/content` | ContentManagement | Admin |
| `/dashboard/admin-attendance` | AdminAttendanceView | Admin |
| `/dashboard/admin-grading` | AdminGradingView | Admin |
| `/dashboard/admin-grading/:periodId` | AdminGradingPeriodView | Admin |
| `/dashboard/attendance` | AttendanceView | Guru |
| `/dashboard/grading` | GradingView | Guru |
| `/dashboard/grading/:periodId` | GradingPeriodView | Guru |

---

## 🔐 Authentication

### Auth Store (`stores/auth.js`)

```javascript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Check auth state
authStore.isAuthenticated
authStore.isAdmin
authStore.isGuru
authStore.user

// Login methods
await authStore.loginWithCredentials(username, password) // Admin/Guru
await authStore.loginWithGoogle() // Santri

// Logout
await authStore.logout()
```

### Route Guards

Routes dengan `meta.requiresAuth: true` memerlukan login.
Routes dengan `meta.role: 'admin'` atau `meta.role: 'guru'` memerlukan role spesifik.

---

## 🎨 Styling

### TailwindCSS

Konfigurasi tersedia di `tailwind.config.js`. Gunakan utility classes langsung di template:

```vue
<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h1 class="text-2xl font-bold text-gray-800">Title</h1>
  </div>
</template>
```

### Global Styles

Custom styles ada di `src/style.css`.

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API URL |
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase app ID |

---

## 📝 Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 📦 Key Dependencies

| Package | Version | Usage |
|---------|---------|-------|
| vue | ^3.5.24 | UI framework |
| vue-router | ^4.6.4 | Routing |
| pinia | ^3.0.4 | State management |
| axios | ^1.13.2 | HTTP client |
| firebase | ^12.7.0 | Authentication |
| tailwindcss | ^3.4.17 | CSS framework |
| vite | ^7.2.4 | Build tool |

---

## 📄 License

MIT License
