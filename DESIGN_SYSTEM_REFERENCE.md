# 🎨 Profile Page - Design System & Visual Reference

## Color Palette

### Primary Colors
```
Background Gradient:
from-slate-950 to slate-900 (very dark)

Primary Background:
bg-slate-800, bg-slate-900

Text Primary:
text-slate-100 (bright white)

Text Secondary:
text-slate-300 (light gray)

Text Tertiary:
text-slate-400 (medium gray)

Text Muted:
text-slate-600 (dark gray)
```

### Accent Colors
```
Cyan (Primary Accent):
- Border: border-cyan-400, border-cyan-500
- Text: text-cyan-400
- Background: bg-cyan-500, bg-cyan-400
- Glow: shadow-cyan-500/10
- Light BG: bg-cyan-500/10, from-cyan-500/10

Blue (Secondary Accent):
- Border: border-blue-500
- Text: text-blue-500
- Gradient: to-blue-500
- Background: to-blue-500/10

Examples:
- Primary Button: from-cyan-500 to-blue-500
- Hover Glow: shadow-cyan-500/10
```

### Difficulty Colors
```
Easy (Green):
- Background: bg-green-500/10
- Text: text-green-400
- Border: border-green-500/30
- Hover: hover:bg-green-500/20 hover:border-green-400

Medium (Yellow/Amber):
- Background: bg-yellow-500/10
- Text: text-yellow-400
- Border: border-yellow-500/30
- Hover: hover:bg-yellow-500/20 hover:border-yellow-400

Hard (Red):
- Background: bg-red-500/10
- Text: text-red-400
- Border: border-red-500/30
- Hover: hover:bg-red-500/20 hover:border-red-400
```

---

## Typography

### Font Sizes & Weights
```
Page Title:
className="text-4xl md:text-5xl font-bold"

Section Title:
className="text-2xl font-bold"

Card Title:
className="text-lg font-bold"

Body Text:
className="text-base font-normal"

Label:
className="text-sm font-medium"

Small Text:
className="text-xs font-normal"

Metadata:
className="text-xs text-slate-400"
```

### Font Usage
- **Headings**: font-bold
- **Labels**: font-semibold, font-bold
- **Body**: font-normal
- **Metadata**: font-normal (lighter color)

---

## Spacing System

### Gaps (Between Elements)
```
Large Sections: gap-8 (32px)
Component Groups: gap-4 (16px)
Inline Elements: gap-2 (8px)
Tight Elements: gap-1 (4px)
```

### Padding
```
Large Card: p-6 (24px)
Regular Card: p-4 (16px)
Button: px-4 py-2, px-3 py-1
Icon Button: p-3, p-2
Toolbar: px-4, py-2
```

### Margins
```
Between Sections: mb-8, mt-8
After Title: mb-6, mb-4
Subtle Spacing: mb-3, mb-2
Line Spacing: mt-2
```

### Border Radius
```
Subtle: rounded-lg (0.5rem)
Default: rounded-lg (0.5rem)
Large: rounded-xl (0.75rem)
Extra Large: rounded-2xl (1rem)

Avatar: rounded-full
Icon Buttons: rounded-lg
Cards: rounded-xl, rounded-2xl
```

---

## Shadows & Effects

### Shadow Levels
```
Base: shadow-lg
Hover: shadow-xl
Focus: shadow-2xl

Glow Effect:
shadow-cyan-500/10 (with cyan glow)

Multiple Shadows:
shadow-lg hover:shadow-xl hover:shadow-cyan-500/10 transition-shadow duration-200
```

### Borders
```
Standard: border border-slate-700
Hover: hover:border-cyan-500/50, hover:border-cyan-400
Focus: focus:border-cyan-400

Thin: border (1px)
No border: border-0

Color Options:
- border-slate-600, border-slate-700
- border-cyan-400, border-cyan-500
- border-green-500, border-yellow-500, border-red-500
```

---

## Components & Patterns

### Buttons

#### Primary Button
```jsx
<button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
  Click Me
</button>
```

#### Secondary Button
```jsx
<button className="px-3 py-1 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600 transition-colors duration-200">
  Secondary
</button>
```

#### Danger Button
```jsx
<button className="text-red-400 hover:bg-red-900/20 transition-colors duration-200">
  Delete
</button>
```

### Cards

#### Default Card
```jsx
<div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg">
  Content
</div>
```

#### Card with Hover Effect
```jsx
<div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300">
  Content
</div>
```

#### Gradient Background Card
```jsx
<div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/30">
  Content
</div>
```

### Badges

#### Difficulty Badge (Easy)
```jsx
<div className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/30">
  Easy
</div>
```

#### Skill Tag
```jsx
<span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 text-xs font-medium rounded-full border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-200">
  React
</span>
```

### Avatar
```jsx
<div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
  J
</div>
```

### Icon Button
```jsx
<button className="p-3 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-cyan-400 transition-colors duration-200 hover:scale-110 transform">
  <Icon className="w-5 h-5" />
</button>
```

---

## Hover Effects

### Scale Hover
```jsx
className="transform hover:scale-105 transition-transform duration-200"
```

### Color Hover
```jsx
className="text-slate-300 hover:text-cyan-400 transition-colors duration-200"
```

### Background Hover
```jsx
className="bg-slate-700 hover:bg-slate-600 transition-colors duration-200"
```

### Shadow Hover
```jsx
className="shadow-lg hover:shadow-xl hover:shadow-cyan-500/10 transition-shadow duration-200"
```

### Combined Effects
```jsx
className="group bg-slate-800 rounded-xl p-4 border border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-500/50 hover:from-slate-700 hover:to-slate-800 cursor-pointer transform hover:scale-105"
```

---

## Responsive Patterns

### Grid Layouts
```jsx
// 1 column on mobile, 2 on tablet, 4 on desktop
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"

// Sidebar layout
className="grid grid-cols-1 lg:grid-cols-3 gap-8"

// Full width on mobile, 2/3 width on desktop
className="lg:col-span-2"
```

### Display/Hide
```jsx
// Hide on mobile, show on desktop
className="hidden md:flex"

// Show on mobile, hide on desktop
className="md:hidden"

// Show at breakpoint
className="hidden lg:block"
```

### Responsive Text
```jsx
className="text-4xl md:text-5xl"
className="text-base md:text-lg"
```

### Responsive Padding/Margin
```jsx
className="px-4 sm:px-6 lg:px-8"
className="py-4 md:py-8"
```

---

## Animation & Transition

### Duration Standards
```
Fast: duration-200 (200ms) - Most interactions
Medium: duration-300 (300ms) - Complex animations
Slow: duration-500 (500ms) - Page transitions
```

### Transition Properties
```jsx
// All properties
className="transition-all duration-300"

// Specific properties
className="transition-colors duration-200"
className="transition-shadow duration-200"
className="transition-transform duration-200"
className="transition-opacity duration-200"
```

### Transform Effects
```jsx
// Scale
className="transform hover:scale-105"

// Translate
className="transform hover:translate-x-1"

// Rotate
className="transform hover:rotate-1"
```

### Opacity Effects
```jsx
// Fade in/out
className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"

// Partial opacity
className="opacity-50"
```

---

## State Indicators

### Disabled State
```jsx
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

### Active State
```jsx
className={`${isActive ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'}`}
```

### Loading State
```jsx
<span className="loading loading-spinner loading-lg"></span>
```

### Focus State
```jsx
className="focus:outline-none focus:border-cyan-400"
```

---

## Dark Mode Guidelines

✅ Use slate colors for backgrounds (slate-800, slate-900)
✅ Use bright colors for text (slate-100, slate-300)
✅ Use cyan/blue for accents and interactive elements
✅ Use opacity for depth (e.g., bg-cyan-500/10)
✅ Avoid pure white text (use slate-100 instead)
✅ Avoid pure black backgrounds (use slate-900 instead)
✅ Use semi-transparent overlays (e.g., bg-black/50)

---

## Accessibility

### Color Contrast
- Text on dark: slate-100 on slate-900 ✅
- Text on colored: white on cyan-500 ✅
- Links: cyan-400 with underline ✅

### Focus States
- All interactive elements have focus styles
- Use outline or border change
- Maintain visibility (not pure styling)

### Semantic HTML
```jsx
<button>       // For clickable actions
<a href="">    // For navigation
<span>         // For non-interactive content
<nav>          // For navigation sections
<footer>       // For footer
```

---

## Common Patterns

### Navbar Styling
```jsx
className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-lg"
```

### Section Heading
```jsx
className="text-2xl font-bold text-slate-100 mb-6"
```

### Interactive List Item
```jsx
className="bg-slate-800 rounded-xl p-4 border border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-500/50 cursor-pointer group"
```

### Stat Card
```jsx
className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30 shadow-lg transition-all duration-300 hover:from-cyan-500/20 hover:to-blue-500/20 hover:shadow-xl"
```

---

## Best Practices

✅ Use consistent spacing throughout
✅ Keep transition duration consistent (200-300ms)
✅ Use color-coded difficulty badges
✅ Maintain dark theme consistency
✅ Add hover states to all interactive elements
✅ Use gradients for visual interest
✅ Respect white space and breathing room
✅ Test color contrast for accessibility
✅ Use semantic color meanings (red=danger, green=success)
✅ Layer cards with subtle shadows

---

## Color Reference Chart

```
Palette Combinations:
1. Cyan/Blue (Primary)     - from-cyan-400 to-blue-500
2. Green/Emerald (Easy)    - from-green-400 to-emerald-500
3. Yellow/Amber (Medium)   - from-yellow-400 to-amber-500
4. Red/Pink (Hard)         - from-red-400 to-pink-500
5. Purple/Violet (Alt)     - from-purple-400 to-violet-500
6. Slate (Neutral)         - from-slate-800 to-slate-900

Hover Patterns:
- Always add lighter shade on hover
- Always add glow effect: shadow-{color}-500/10
- Always add transition: transition-all duration-300
```

---

This design system ensures consistency, accessibility, and professional aesthetics throughout the profile page!
