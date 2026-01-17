# App Flow & Core Logic (af.md)

This document details the core business logic, algorithms, and data flows for the CodeKrafts Android Application.

## 1. Authentication & Session Management

### 1.1. Session Persistence
*   **Library:** `@supabase/supabase-js`, `expo-secure-store`.
*   **Mechanism:**
    *   Supabase tokens (Access & Refresh) are stored in the device's secure keychain/keystore.
    *   **Auto-Refresh:** The Supabase client automatically handles token refreshing using the persisted refresh token.
*   **App Launch Flow:**
    1.  App starts -> Splash Screen.
    2.  `useEffect` checks `SecureStore` for a valid session.
    3.  **If Valid:** Navigate to `MainTabNavigator`.
        *   *Check:* Trigger `automationService.js` to check for incomplete profile prompts.
    4.  **If Null/Expired:** Navigate to `AuthStack` (Login/Signup).

### 1.2. Access Guards
*   **Email Verification:**
    *   Even with a valid session, the app checks `session.user.email_confirmed_at`.
    *   If `null`, the user is forced to the `VerifyEmail` screen.
    *   **App.jsx equivalent:** `RequireAuth` wrapper ensures no protected routes are accessed without verification.

---

## 2. Core Feature Algorithms

### 2.1. The Feed (`get_posts_with_stats`)
*   **Data Source:** Supabase RPC function `get_posts_with_stats`.
*   **Logic:**
    *   Fetches posts joined with:
        *   User Profiles (Author details).
        *   Like Counts & Comment Counts.
        *   "Liked by Current User" boolean status.
*   **Pagination:**
    *   **Strategy:** Infinite Scroll (Limit/Offset or Cursor-based).
    *   **Batch Size:** 10 posts per fetch.
    *   **Trigger:** `onEndReached` in FlatList.

### 2.2. Trending Algorithm
*   **Logic:** Calculated server-side via SQL view or RPC, typically:
    ```sql
    Score = (Likes * 1.0) + (Comments * 2.0) + (Shares * 3.0)
    Decay = 1 / (TimeSincePost_Hours + 2)^1.5
    ```
*   **Client Side:** Simply fetches `get_trending_posts()` view.
*   **Display:** Top 5-10 posts shown in the horizontal carousel at the top of the feed.

### 2.3. Search Logic
*   **Debouncing:** Input is debounced by ~500ms to prevent excessive API calls.
*   **Queries:**
    *   **Users:** `select * from profiles where username ilike '%query%' or full_name ilike '%query%'`
    *   **Posts:** `select * from posts where content ilike '%query%'` (or Full Text Search vectors if implemented).

### 2.4. File Upload Pipeline
*   **Components:** `expo-image-picker` -> Supabase Storage.
*   **Flow:**
    1.  User selects image/video from gallery.
    2.  App receives `file://` URI.
    3.  Convert URI to `Blob` / `FormData`.
    4.  Generate unique path: `userId/timestamp_filename.jpg`.
    5.  Upload to `meme-uploads`, `profile-pictures`, or `banner-images` bucket.
    6.  Get Public URL.
    7.  Save URL to the respective DB table (`posts` or `profiles`).

---

## 3. Realtime & Interactions

### 3.1. Optimistic Updates
*   **Likes:**
    *   When user taps "Like":
    *   **Immediate:** UI turns heart red, increments count (+1).
    *   **Background:** API call `rpc('handle_post_like')` sent.
    *   **Rollback:** If API fails, revert UI changes.

### 3.2. Notifications
*   **System:** Using `user_prompts` table.
*   **Logic:**
    *   Fetch active prompts where `is_dismissed = false`.
    *   Display as in-app notifications or modal popups.
*   **Future:** Push Notifications (FCM/APNS) integration via Expo Notifications.

---

## 4. State Management (Client Side)

*   **Global Context (`FeatureProvider`):**
    *   Stores `session` object.
    *   Stores `userProfile` (cached detailed profile).
    *   Stores `featureFlags` (Admin-controlled toggles for beta features).
*   **Local State:**
    *   Screen-specific data (e.g., form inputs, current feed list).

---

## 5. Security & Corrections

*   **RLS (Row Level Security):** All database access is protected by Postgres RLS policies (e.g., "Users can only update their own profile").
*   **Input Sanitization:** React Native auto-escapes, but SQL injections prevented by using parameterized RPCs and Supabase client methods.
