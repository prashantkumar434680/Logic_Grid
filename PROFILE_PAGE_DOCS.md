# Profile Page - Complete Documentation

## Overview
This is **Phase 1** of the LogicGrid profile page - a minimal, modern, dark-themed developer dashboard built with React, Tailwind CSS, and DaisyUI.

## Architecture

```
Profile System
├── Profile.jsx (Main container)
├── Navbar.jsx (Top navigation)
├── ProfileSidebar.jsx (User info, languages, skills)
├── StatsCards.jsx (Problem statistics)
└── RecentProblems.jsx (Recently solved problems list)
```

## Components

### 1. **Navbar.jsx**
- **Purpose**: Top navigation bar with links, search, and profile dropdown
- **Features**:
  - Sticky positioning
  - Responsive design (mobile hamburger menu)
  - Profile dropdown with sign-out option
  - Search bar
  - Navigation links (Problems, Contest, Discuss)
- **Styling**: Gradient background with glassmorphism effects
- **Icons Used**: Lucide React

**Usage**:
```jsx
import Navbar from './components/Profile/Navbar';
<Navbar />
```

**Customization**:
- Edit `navLinks` array to add/remove navigation items
- Modify `profileMenu` for dropdown options
- Update gradient colors in className

---

### 2. **ProfileSidebar.jsx**
- **Purpose**: Left sidebar displaying user profile information
- **Features**:
  - User avatar with online status indicator
  - Name, handle, and user ID
  - Rank badge with color gradient
  - Edit Profile button
  - Bio/About section
  - Social media links (GitHub, LinkedIn, Email)
  - Languages showcase (badges)
  - Skills section (tag-style)
- **Styling**: Card-based design with hover effects

**Usage**:
```jsx
import { ProfileSidebar } from './components/Profile';
<ProfileSidebar />
```

**Props**: None (uses Redux state)

**Mock Data Structure** (in component):
```javascript
profileData = {
  name: string,
  handle: string,
  userId: string,
  rank: string,
  rankColor: string (tailwind gradient),
  bio: string,
  languages: string[],
  skills: string[],
  social: {
    github: url,
    linkedin: url,
    email: url
  }
}
```

---

### 3. **StatsCards.jsx**
- **Purpose**: Display problem-solving statistics
- **Features**:
  - 4 stat cards: Total, Easy, Medium, Hard
  - Color-coded difficulties:
    - Easy: Green
    - Medium: Yellow
    - Hard: Red
  - Trending indicator
  - Responsive grid layout
  - Hover animations with scale effect

**Usage**:
```jsx
import { StatsCards } from './components/Profile';
<StatsCards />
```

**Stat Card Structure**:
```javascript
{
  label: string,
  value: number,
  icon: string,
  bgGradient: string (tailwind gradient),
  borderColor: string (tailwind border color),
  textColor: string (tailwind text color),
  hoverBg: string (tailwind hover gradient)
}
```

---

### 4. **RecentProblems.jsx**
- **Purpose**: List recently solved problems
- **Features**:
  - Problem name with hover effects
  - Difficulty badges (color-coded)
  - Solved timestamp
  - Check mark icon
  - Smooth animations
  - Load More button
  - "View All" link

**Usage**:
```jsx
import { RecentProblems } from './components/Profile';
<RecentProblems />
```

**Problem Object Structure**:
```javascript
{
  id: number,
  title: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  difficultyColor: string (tailwind styles),
  solvedTime: string,
  icon: string
}
```

---

### 5. **Profile.jsx** (Main Page)
- **Purpose**: Container component that combines all sections
- **Layout**: 
  - Sidebar on left (responsive)
  - Main content on right
  - Full-page dark background
  - Professional footer

**Usage**:
```jsx
import Profile from './pages/Profile';
// Add to Routes:
<Route path="/profile" element={<Profile />} />
```

---

## Styling & Design

### Color Palette
```
Background:
- Primary: slate-900 to slate-950 (very dark)
- Secondary: slate-800
- Accents: cyan-400, blue-500

Text:
- Primary: slate-100 (bright)
- Secondary: slate-300
- Tertiary: slate-400
- Muted: slate-600

Difficulty Colors:
- Easy: green-400 / green-500
- Medium: yellow-400 / amber-500
- Hard: red-400 / red-500
```

### Design Tokens
- **Border Radius**: Rounded-lg, rounded-xl, rounded-2xl
- **Shadows**: shadow-lg, shadow-xl with cyan glow on hover
- **Spacing**: Standard Tailwind spacing (4px = 1 unit)
- **Transitions**: 200-300ms duration for smooth animations

### Responsive Breakpoints
- **Mobile**: Full width (no sidebar)
- **Tablet**: Single column with adjustments
- **Desktop**: 3-column grid (sidebar + content)
- Breakpoint: `lg` (1024px)

---

## Integration Steps

1. **Import in App.jsx**:
```jsx
import Profile from './pages/Profile';
```

2. **Add Route**:
```jsx
<Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
```

3. **Link from Navbar/Menu**:
```jsx
// In Navbar or menu component
<a href="/profile">My Profile</a>
```

---

## Customization Guide

### Change User Data Source
**Current**: Uses `useSelector` from Redux (`state.auth.user`)
**To customize**:
1. Replace `profileData` object in `ProfileSidebar.jsx`
2. Fetch from API: 
```jsx
useEffect(() => {
  const fetchProfile = async () => {
    const data = await axios.get('/api/user/profile');
    setProfileData(data);
  };
  fetchProfile();
}, []);
```

### Add New Stats
Edit `StatsCards.jsx` - add to `stats` array:
```javascript
{
  label: 'Acceptance Rate',
  value: '78%',
  icon: '📊',
  bgGradient: 'from-purple-500/10 to-pink-500/10',
  borderColor: 'border-purple-500/30',
  textColor: 'text-purple-400',
  hoverBg: 'hover:from-purple-500/20 hover:to-pink-500/20',
}
```

### Change Difficulty Badges
Edit the color classes in `RecentProblems.jsx`:
```jsx
// Easy
difficultyColor: 'bg-green-500/10 text-green-400 border-green-500/30'

// Medium
difficultyColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'

// Hard
difficultyColor: 'bg-red-500/10 text-red-400 border-red-500/30'
```

### Add New Sections
Simply create new components and import them in `Profile.jsx`:
```jsx
import NewSection from './NewSection';

// In Profile.jsx
<div className="lg:col-span-2 space-y-8">
  <StatsCards />
  <RecentProblems />
  <NewSection /> {/* New section */}
</div>
```

---

## Future Expansions (Phase 2+)

This foundation supports:
- **Heatmap** (calendar activity grid)
- **Badges/Achievements** (separate card)
- **Contest Ratings** (new stats row)
- **Followers/Following** (expandable cards)
- **Discussion Stats** (new section)
- **Submission Analytics** (chart section)
- **Learning Paths** (new section)
- **Custom Themes** (appearance settings)

---

## Performance Optimization

### Current Optimizations
- Modular component structure
- Lazy loading via React Routes
- Tailwind CSS purging in production

### For Production
```javascript
// Add pagination for problems
const [page, setPage] = useState(1);
const itemsPerPage = 6;

// Add caching
const { data, loading } = useQuery(GET_PROFILE_DATA, {
  variables: { userId },
  fetchPolicy: 'cache-and-network'
});
```

---

## Troubleshooting

### Profile not loading?
- Check Redux auth state is available
- Verify route is added to App.jsx
- Check console for import errors

### Styling not applying?
- Ensure Tailwind CSS is configured correctly
- Check if DaisyUI is installed (`npm install daisyui`)
- Verify dark mode is enabled in `tailwind.config.js`

### Mobile menu not working?
- Check `useState` is imported from React
- Verify mobile breakpoints use `md` or `lg`

---

## Dependencies
- **React 19.2.0**: Core framework
- **React Router 7.13.1**: Routing
- **Redux Toolkit 2.11.2**: State management
- **Tailwind CSS 4.2.1**: Styling
- **DaisyUI 5.5.19**: UI components
- **Lucide React 1.7.0**: Icons

---

## File Structure
```
src/
├── components/
│   └── Profile/
│       ├── Navbar.jsx
│       ├── ProfileSidebar.jsx
│       ├── StatsCards.jsx
│       ├── RecentProblems.jsx
│       └── index.js
├── pages/
│   └── Profile.jsx
└── App.jsx
```

---

## Best Practices Applied

✅ **Component Modularity**: Each section is independent and reusable
✅ **Responsive Design**: Mobile-first approach with progressive enhancement
✅ **Accessibility**: Semantic HTML, proper contrast ratios
✅ **Performance**: Lazy loading, optimized renders
✅ **Maintainability**: Clear file structure, inline documentation
✅ **Scalability**: Easy to add new features without breaking existing code
✅ **Dark Theme**: Professional developer-focused aesthetics

---

## Next Steps

1. **Connect Backend**: Replace mock data with API calls
2. **Add Authentication**: Verify user is viewing their own profile
3. **Implement Edit Profile**: Create form for editing profile info
4. **Add Notifications**: Toast alerts for actions
5. **Create Analytics**: Add charts for problem-solving trends
6. **Social Features**: Follow/message functionality

---

**Built with ❤️ for LogicGrid**
