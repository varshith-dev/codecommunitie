# CodeKrafts Mobile App Development Guide

This document outlines the architecture, algorithms, and implementation details for building the mobile version of CodeKrafts.

## 1. Recommended Tech Stack
Since the web app is built with **React**, the most efficient path is **React Native with Expo**.
*   **Framework**: [Expo](https://expo.dev/) (Managed Workflow)
*   **Language**: JavaScript / TypeScript
*   **Backend**: Supabase (Same existing project)
*   **UI Library**: `react-native-paper` or `tamagui` (for styling)
*   **Navigation**: `react-navigation` (Stack + Tabs)

---

## 2. App Structure & Navigation
Map existing web routes to mobile navigation stacks.

### A. Auth Stack (Unauthenticated)
*   **Welcome Screen**: Landing page with "Login" / "Signup" buttons.
*   **Login Screen**: Email/Password + Magic Link options.
*   **Signup Screen**: Registration form.
*   **ForgotPassword Screen**: OTP flow inputs.

### B. Main Tab Navigator (Authenticated)
1.  **Home Tab** (`Feed.jsx`)
    *   *FeedScreen*: Vertical scroll of `PostCard` components.
    *   *PostDetailsScreen*: Comments and full content.
2.  **Search Tab** (`Search.jsx`)
    *   *SearchScreen*: Search bar + Categories + Users list.
3.  **Create Tab** (`CreatePost.jsx`)
    *   *CreatePostScreen*: Image picker + Text input + Preview.
4.  **Notifications Tab** (New)
    *   *ActivityScreen*: List of likes/comments/follows.
5.  **Profile Tab** (`UserProfile.jsx`)
    *   *ProfileScreen*: User stats, bio, and their posts.
    *   *SettingsScreen*: Edit profile (`Settings.jsx`).

### C. Drawer / Modals
*   **Advertiser Dashboard**: specialized hidden section or separate app.
*   **Admin Panel**: Recommend keeping web-only for security/complexity, or a simple "Admin Stats" view.
*   **Chat/Messages**: If implementing chat, use a modal stack.

---

## 3. Core Algorithms & Logic

### A. Authentication & Session Management
*   **Logic**: Use `@supabase/supabase-js` with `expo-secure-store` for token persistence.
*   **Flow**:
    1.  App Launch -> Check `SecureStore` for session.
    2.  If valid -> `MainTabNavigator`.
    3.  If null -> `AuthStack`.
    *   **Crucial**: Implement the same `automationService.js` logic on app open (check prompt automations).

### B. The Feed Algorithm (`get_posts_with_stats`)
The mobile feed should fetch data using the exact same Supabase RPC calls as the web to ensure consistency.
*   **RPC**: `get_posts_with_stats`
*   **Params**: `page`, `page_size`, `current_user_id`
*   **Pagination**: Implement "Infinite Scroll" (FlatList `onEndReached`).
    *   Fetch 10 posts.
    *   When user scrolls to bottom, fetch next 10.

### C. Trending Algorithm
Reuse the backend calculation, do not calculate on client.
*   **Logic**:
    ```sql
    score = (likes * 1) + (comments * 2) + (shares * 3)
    decay = 1 / (hours_since_posted + 2)^1.5
    ```
*   **Mobile View**: A horizontal carousel at the top of the feed showing "Trending Now".

### D. File Uploads (Images/Avatars)
*   **Mobile Specific**: Use `expo-image-picker`.
*   **Process**:
    1.  Pick Image -> Get URI.
    2.  Convert URI to `Blob` or `FormData`.
    3.  `supabase.storage.from('images').upload(...)`
    4.  Get Public URL -> Save to DB table.

---

## 4. API & Database Integration

### Shared Tables (Do NOT create new tables)
Connect directly to these existing tables:
*   `profiles`: User data.
*   `posts`: Content.
*   `post_likes`, `post_comments`: Interactions.
*   `user_prompts`: Notifications/Automations.
*   `advertisements`: Ads injection.

### Key API Calls
| Feature | Supabase Function/Table | Notes |
| :--- | :--- | :--- |
| **Fetch Feed** | `rpc('get_posts_with_stats')` | Pagination is critical for mobile performance. |
| **Post** | `insert into posts` | Handle image compression before upload. |
| **Like** | `rpc('handle_post_like')` | Optimistic UI update (turn heart red instantly). |
| **Prompts** | `select * from user_prompts` | Filter by `is_dismissed = false`. |
| **Ads** | `select * from advertisements` | Inject 1 ad every ~5 posts in the FlatList. |

---

## 5. Development Steps

### Step 1: Initialize Project
```bash
npx create-expo-app CodeKraftsMobile
cd CodeKraftsMobile
npx expo install @supabase/supabase-js @react-navigation/native react-native-paper
```

### Step 2: Setup Supabase Client
Create `lib/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Custom storage adapter for React Native
const ExpoAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(YOUR_URL, YOUR_ANON_KEY, {
  auth: {
    storage: ExpoAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Step 3: Global Theme
Copy the color palette from `index.css` (Web) to a JS theme object so the mobile app feels identical (e.g., `#2563eb` for primary blue).

### Step 4: Build Components
Port these lightweight components first:
1.  `PostCard`: Render image, text, and action buttons.
2.  `Avatar`: Reuse logic but use `<Image>` tag.
3.  `Button`: Standardize styles.
4.  `ScreenWrapper`: A `SafeAreaView` wrapper for all screens.

### Step 5: Implement Feed
Use `FlashList` (from Shopify) or `FlatList` for performance.
```javascript
<FlatList
  data={posts}
  renderItem={({ item }) => <PostCard post={item} />}
  onEndReached={loadMore}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
/>
```
