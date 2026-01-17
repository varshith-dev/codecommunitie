# Android UI/UX - CodeKrafts Mobile App

## 1. Design System

### 1.1. Color Palette
Derived from the existing web application (`tailwind.config.js`), ensuring brand consistency.

*   **Primary Brand Colors:**
    *   Primary 500: `#3b82f6` (Main Blue)
    *   Primary 600: `#2563eb` (Interactive Elements)
    *   Primary 700: `#1d4ed8` (Active States)
    *   Background: `#fafafa` (Light Gray - Main Background) / `#ffffff` (Cards/Modals)
    *   Text: `#111827` (Gray 900 - Headings), `#374151` (Gray 700 - Body)

### 1.2. Typography
*   **Font Family:** System Default (San Francisco on iOS, Roboto on Android) to provide a native feel while mirroring the web's `font-sans`.
*   **Headings:** Bold, high contrast.
*   **Body:** Legible size (16sp), good line height (1.5).

### 1.3. UI Components
*   **Glassmorphism:** Used sparingly on overlay elements (e.g., bottom tab bar background, floating action buttons) to match the web's `backdrop-blur`.
*   **Cards:** Clean, white background with subtle shadow (`shadow-sm` or `shadow-md`), rounded corners (`rounded-2xl`).
*   **Avatars:** Circular, consistent sizes (Small: 32dp, Medium: 40dp, Large: 80dp).
*   **Buttons:**
    *   Primary: Blue background, white text, rounded-lg.
    *   Secondary: Transparent/Outline, gray text.
    *   FAB: Floating action button for "Create Post" (Main Call-to-Action).

---

## 2. App Navigation Structure

The app uses a hybrid navigation approach matching standard mobile patterns.

### 2.1. Root Navigator (Stack)
Handles the switch between Authentication and Main App states.
*   **Splash Screen:** Logo animation while checking `SecureStore` for session.
*   **Auth Stack:** Login, Signup, Verification.
*   **Main App:** Tab Navigator.

### 2.2. Main Tab Navigator (Bottom Bar)
The primary way to navigate the authenticated experience.
1.  **Feed (Home):** The core content stream.
2.  **Search:** Discovery and user lookup.
3.  **Create (FAB):** Central floating action button for creating posts.
4.  **Notifications:** Activity feed (Likes, Comments, Follows).
5.  **Profile:** Current user's profile and settings.

---

## 3. User Flows & Interaction Design

### 3.1. Onboarding & Authentication
*   **Goal:** Frictionless entry.
*   **Welcome Screen:** Clean landing with "Login" and "Create Account" options.
*   **Login:**
    *   Email & Password input or Magic Link.
    *   "Forgot Password" flow (OTP verification).
*   **Signup:**
    *   Username, Email, Password.
    *   **Email Verification:** Critical step. Users cannot access the main app until email is confirmed.
    *   *Mobile UX:* Auto-focus OTP fields, auto-submit on fill.

### 3.2. Home Feed
*   **Layout:** Infinite scroll vertical list (FlatList).
*   **Trending Carousel:** Horizontal scroll at the top showing top-performing posts.
*   **Post Card:**
    *   Header: User Avatar + Username + Time Ago.
    *   Content: Text (with syntax highlighting) + Media (Images/Videos).
    *   Actions: Like, Comment, Share.
    *   *Interaction:* Double-tap to like, tap Avatar to visit profile.

### 3.3. Create Post
*   **Interface:** Minimalist text editor.
*   **Features:**
    *   Code Block insertion (language selector).
    *   Media picker (Gallery/Camera).
    *   Live Preview toggle.
*   **Feedback:** Toast notification on success.

### 3.4. Search & Discovery
*   **Search Bar:** Sticky top bar.
*   **Tabs:** "Posts" vs "People".
*   **Suggestions:** "Who to follow" list.
*   **Tags:** Trending topic pills.

### 3.5. User Profile
*   **Header:** Parallax banner image + Profile Picture.
*   **Stats:** Followers/Following counts.
*   **Tabs:** User's Posts, About, Saved Bookmarks.
*   **Edit:** Modal to update profile details.

### 3.6. Notifications
*   **List View:** Chronological list.
*   **Types:** Follows, Likes, Comments, System messages.
*   **Indicators:** Red dot badge on tab icon.

### 3.7. Settings
*   **Account:** Email/Password management.
*   **Appearance:** Dark/Light mode.
*   **Legal:** TOS, Privacy.
*   **Logout:** Clear session.

---

## 4. Specialized Features

### 4.1. Advertiser Dashboard (Mobile View)
*   **Focus:** Quick stats (Impressions, CTR).
*   **Action:** Simple campaign creation.

### 4.2. Admin Features
*   **Strategy:** Redirect to web or provide limited view.
*   **Core:** User moderation, content removal.

---

## 5. Technical UI Considerations
*   **Safe Area:** All screens wrapped in `SafeAreaView`.
*   **Gestures:** Swipe-to-back enabled.
*   **Loading:** Skeleton screens for perceived performance.
*   **Feedback:** Haptic feedback on interactions (Likes, Refresh).
