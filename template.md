# PRD — Event Hub: Home Page Layout & Content

## 1. Scope & Architecture
This template contains the complete **Home Page** structure inside `views/home.ejs`, including the Header, Main Content, and Footer in a single file so that partials can be separated later as needed.

## 2. Tech & Style
| Item | Detail |
|---|---|
| Styling | Tailwind CSS |
| Layout | Container max-width, responsive grid (mobile-first) |
| Language | English (UI Text) |

### Color Palette
| Color | Hex | Role |
|---|---|---|
| Primary | `#3368A0` | Main buttons, active states, active links |
| Secondary | `#66A3BF` | Hover states, secondary accents |
| Accent | `#C8DFDB` | Badge/tag background, subtle borders |
| Background | `#F2EFE7` | Page and section background |

## 3. Structure in `views/home.ejs`
- **Header**: Logo & title (left), Navigation links: Home, Events, User dropdown (right)
- **Main Content**:
  - Search & Filter Bar
  - Section: Popular Categories
  - Section: Explore by City (City Tabs above Latest Events)
  - Section: Latest Events (1 sample card for fallback template preview)
  - Section: Upcoming Events (1 sample card for fallback template preview)
- **Footer**: Brand & copyright footer note

## 4. Component Details

### 4.1 Search & Filter Bar
Located at the top of the main content:
1. **Search Form**:
   - Input text with magnifying glass icon, placeholder: `"Search events..."`
   - Submit button (`"Search"`)
2. **Filter by Category**:
   - Pill / button group format (scrollable on mobile)
   - State: active (`#3368A0` Primary) vs default (`#C8DFDB` Accent)
   - Categories: All Categories, Music, Seminar, Sports, Exhibition, Community, Others
3. **Filter by City**:
   - Pill / button group format (scrollable on mobile)
   - Cities: All Cities, Jakarta, Bandung, Surabaya, Yogyakarta, Bali

### 4.2 Section: Popular Categories
- Section Title: `"Popular Categories"`
- Grid layout (`grid-cols-2` mobile → `sm:grid-cols-3` → `md:grid-cols-4` → `lg:grid-cols-6` desktop)
- Displays category cards with icons and category names (supports dynamic `categories` array with static fallback)

### 4.3 Section: Explore by City (City Tabs)
- Section Title: `"Explore by City"`
- Horizontal scrollable tab pills format with location pin icons
- Displays cities dynamically from `cities` array (with static fallback)

### 4.4 Section: Latest Events
- Section Title: `"Latest Events"`
- Grid layout (`grid-cols-1` mobile → `sm:grid-cols-2` tablet → `lg:grid-cols-3` desktop)
- 1 sample dummy card for template view fallback

### 4.3 Section: Upcoming Events
- Section Title: `"Upcoming Events"`
- Grid layout (`grid-cols-1` mobile → `sm:grid-cols-2` tablet → `lg:grid-cols-3` desktop)
- 1 sample dummy card for template view fallback

### 4.4 Component: Event Card
Structure (top → bottom):
- Image / Thumbnail (16:9 aspect ratio)
- Category Badge (Accent background `#C8DFDB`)
- Event Name (Title, line-clamp-2)
- Date (Format: e.g. `12 Sep 2026` + Calendar icon)
- Venue & City (Location pin icon)

## 5. Interactions & State
- Category & City filter pills: Client-side visual active/inactive toggle state
- Search form: Search input markup + placeholder
- Template fallback: 1 sample dummy event card per section if database array is empty