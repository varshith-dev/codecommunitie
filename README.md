# 🚀 CodeKrafts

> A social platform for developers to share code snippets, memes, and ideas. Built with React, Supabase, and Tailwind CSS.

![CodeKrafts Banner](https://via.placeholder.com/1200x400/0f172a/38bdf8?text=CodeKrafts+-+Social+Network+for+Developers)

## 🔗 Live Demo
**[Visit CodeKrafts Live](https://codeskrafts.vercel.app)**

---

## 🌟 Features

### 🔐 Authentication & Profiles
* **Magic Link Login:** Passwordless, secure login via email (powered by Supabase Auth)
* **Rich User Profiles:** Custom bio, website links, profile pictures, and banner images
* **Edit Profile:** Real-time profile updates with image uploads
* **Follow System:** Follow/unfollow other developers and track your network

### 📝 Smart Feed
* **Syntax Highlighting:** Beautiful, VS Code-style formatting for shared code snippets
* **Media Support:** Upload and view developer memes and videos
* **Real Avatars:** See actual user profile pictures throughout the app
* **Time Ago Display:** See when posts were created (e.g., "2 hours ago")
* **Engagement Metrics:** View like and comment counts on every post
* **Responsive Design:**
    * **Desktop:** Full-width layout with glassmorphism navbar
    * **Mobile:** Native app-style bottom navigation bar

### 💬 Social Interactions
* **Likes System:** Real-time like/unlike functionality with counts
* **Comments:** Discuss code and memes with threaded comments
* **Follow Users:** Build your developer network
* **Delete Posts:** Manage your own content easily

### 📊 Admin Dashboard
* **Platform Analytics:** Track total users, posts, likes, and comments
* **Post Insights:** Detailed analytics for each post including:
  * View counts and unique viewers
  * Likes and comments
  * Engagement rate calculations
* **Top Posts:** See which posts are performing best
* **Recent Activity:** Monitor platform activity in real-time

### 🎨 Professional UI/UX
* **Glassmorphism Effects:** Modern frosted glass design on navbar
* **Smooth Animations:** Fade-ins, slide-ups, and scale transitions
* **Loading Skeletons:** Beautiful placeholder content while loading
* **Gradient Backgrounds:** Subtle, elegant color transitions
* **Responsive Grid Layouts:** Optimized for all screen sizes

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Tailwind CSS
* **Backend / Database:** Supabase (PostgreSQL)
* **Storage:** Supabase Storage (for images/videos)
* **Icons:** Lucide React
* **Notifications:** React Hot Toast
* **Syntax Highlighting:** React Syntax Highlighter
* **Date Formatting:** date-fns
* **Routing:** React Router DOM
* **Deployment:** Vercel

---

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### 1. Prerequisites
* Node.js 16+ and npm
* A Supabase account ([sign up free](https://supabase.com))

### 2. Clone the repository
```bash
git clone https://github.com/your-username/codekrafts.git
cd codekrafts
```

### 3. Install dependencies
```bash
npm install
```

### 4. Set up Supabase

#### Create a new Supabase project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details

#### Run the database schema
1. Open the SQL Editor in your Supabase project
2. Copy the contents of `database_complete.sql`
3. Paste and run the SQL to create all tables, functions, and policies

#### Create storage buckets
In your Supabase project, create these storage buckets and make them **public**:
1. `meme-uploads` - for post images/videos
2. `profile-pictures` - for user avatars
3. `banner-images` - for profile banners

### 5. Configure environment variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

Then edit `.env.local` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project settings under **API**.

### 6. Run the development server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 7. (Optional) Set up admin access
To access the admin dashboard:
1. Create an account via the app
2. Go to your Supabase project's Table Editor
3. Find your user in the `profiles` table
4. Set `is_admin` to `true` for that user

---

## 📁 Project Structure

```
codekrafts/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Avatar.jsx     # Avatar with fallback to initials
│   │   ├── CommentSection.jsx
│   │   ├── FollowButton.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Navbar.jsx
│   │   └── SkeletonLoader.jsx
│   ├── pages/             # Main pages
│   │   ├── AdminDashboard.jsx
│   │   ├── Auth.jsx
│   │   ├── CreatePost.jsx
│   │   ├── Feed.jsx
│   │   ├── PublicProfile.jsx
│   │   └── UserProfile.jsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useFollow.js
│   │   └── usePostAnalytics.js
│   ├── services/          # API services
│   │   └── uploadService.js
│   ├── utils/             # Utility functions
│   │   └── timeAgo.js
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # React entry point
│   ├── supabaseClient.js  # Supabase configuration
│   └── index.css          # Global styles
├── public/                # Static assets
├── database_complete.sql  # Complete database schema
├── .env.example          # Environment variables template
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🎨 Key Features Explained

### Profile & Banner Upload
Users can upload custom profile pictures and banner images. Images are stored in Supabase Storage and automatically optimized.

### Follow System
- Follow/unfollow other developers
- Follower and following counts auto-update via database triggers
- See who you follow and who follows you

### Post Analytics
Every post tracks:
- View count and unique viewers
- Like and comment engagement
- Calculated engagement rate
- Admins can view detailed insights

### Time Ago Display
All timestamps show relative time (e.g., "2 hours ago", "3 days ago") using the `date-fns` library.

### Skeleton Loaders
Beautiful animated placeholders display while content loads, improving perceived performance.

---

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🐛 Troubleshooting

### Database Connection Errors
- Verify your `.env.local` file has correct Supabase credentials
- Check that you've run the `database_complete.sql` schema

### Image Upload Fails
- Ensure storage buckets are created and set to **public**
- Check bucket names match: `meme-uploads`, `profile-pictures`, `banner-images`

### Admin Dashboard Shows Empty
- Ensure you've set `is_admin = true` in the profiles table
- Log out and log back in after changing admin status

### Magic Link Not Receiving
- Check your spam/junk folder
- Verify email settings in Supabase Auth settings

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 💡 Future Features

- [ ] Real-time notifications
- [ ] Direct messaging between users
- [ ] Code syntax validation
- [ ] Post bookmarking/saving
- [ ] Advanced search and filtering
- [ ] Dark mode toggle
- [ ] Post sharing to other platforms
- [ ] User reputation/karma system

---

## 👨‍💻 Author

Built with ❤️ by developers, for developers.

**CodeKrafts** - Where code meets community.

---

## 🙏 Acknowledgments

* [Supabase](https://supabase.com) - Backend and database
* [Tailwind CSS](https://tailwindcss.com) - Styling
* [Lucide Icons](https://lucide.dev) - Beautiful icons
* [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) - Code highlighting
* [date-fns](https://date-fns.org) - Date manipulation