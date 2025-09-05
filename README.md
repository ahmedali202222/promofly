# Promofly - Promotional Content Management Platform

A modern web application for managing promotional content with photo/video capture, admin approval workflow, and real-time status tracking.

## 🏗️ Project Structure

```
src/
├── pages/                    # Page components
│   ├── Home.jsx             # Landing page
│   ├── Login.jsx            # User login
│   ├── Submit.jsx           # Content submission with camera
│   ├── Dashboard.jsx        # User dashboard
│   └── admin/               # Admin pages
│       ├── AdminLogin.jsx   # Admin login
│       ├── AdminDashboard.jsx # Pending content list
│       └── AdminPromoDetail.jsx # Content review
├── components/              # Reusable components
│   ├── guards/              # Route protection
│   │   ├── ProtectedRoute.jsx
│   │   └── AdminRoute.jsx
│   ├── shared/              # Shared components
│   │   └── Navbar.jsx
│   └── Modal.jsx            # Modal component
├── camera/                  # Camera functionality
│   ├── CameraStudio.jsx     # Main camera component
│   ├── StickerCanvas.jsx    # Sticker overlay system
│   ├── StickerTray.jsx      # Sticker selection UI
│   └── index.js             # Camera exports
├── contexts/                # React contexts
│   └── AuthContext.jsx      # Authentication context
├── hooks/                   # Custom hooks
│   └── useAuth.js           # Auth hook re-export
├── utils/                   # Utility functions
│   └── adminUtils.js        # Admin management utilities
├── firebase.js              # Firebase configuration
├── App.jsx                  # Main app component
└── main.jsx                 # App entry point
```

## 🚀 Features

### User Features
- **Photo/Video Capture**: Built-in camera with stickers and filters
- **Content Submission**: Upload media with title and description
- **Dashboard**: View submitted content with status tracking
- **Real-time Updates**: Live status updates via Firestore

### Admin Features
- **Content Review**: Review pending promotional content
- **Approve/Reject**: Manage content approval workflow
- **Admin Dashboard**: Overview of all pending content
- **Secure Access**: Admin-only routes with custom claims

### Technical Features
- **React Router v6**: Modern routing with route guards
- **Firebase Integration**: Authentication, Storage, and Firestore
- **Real-time Data**: Live updates with Firestore listeners
- **Responsive Design**: Mobile-friendly Tailwind CSS
- **Type Safety**: Clean component structure

## 🔐 Authentication & Authorization

- **Firebase Auth**: Email/password authentication
- **Custom Claims**: Admin status via Firebase custom claims
- **Route Guards**: Protected and admin-only routes
- **Secure Rules**: Firestore security rules

## 📱 Camera System

- **Photo Mode**: Capture photos with stickers and filters
- **Video Mode**: Record videos with MediaRecorder API
- **Sticker System**: Drag, resize, and rotate stickers
- **Object-Cover**: No black bars, full-screen preview
- **Performance**: Optimized for mobile devices

## 🗄️ Database Schema

### Promos Collection
```javascript
{
  title: string,
  description: string,
  fileUrl: string,
  fileName: string,
  fileType: string,
  userId: string,
  userEmail: string,
  status: 'pending' | 'approved' | 'rejected',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Set up Firebase project
   - Add configuration to `src/firebase.js`
   - Deploy Firestore rules from `firestore.rules`

3. **Set Admin Claims**
   - Use Firebase Admin SDK to set custom claims
   - Example: `{ admin: true }` for admin users

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Firebase Setup
- Authentication: Email/Password enabled
- Firestore: Rules deployed from `firestore.rules`
- Storage: Rules for file uploads
- Custom Claims: Admin status management

### Environment Variables
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎯 Roadmap

- [ ] Email notifications for status changes
- [ ] Bulk admin actions
- [ ] Content analytics dashboard
- [ ] Advanced filtering and search
- [ ] Mobile app (React Native)

## 📄 License

MIT License - see LICENSE file for details