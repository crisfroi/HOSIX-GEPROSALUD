# Sermed Logistic Theme Documentation

## Overview

This application has been completely rebranded to **Sermed Logistic** with an updated visual identity featuring:
- Primary Color: Blue (#0066CC)
- Secondary Color: Green (#00B050)
- Professional medical UI components
- Enhanced data visualization with Tremor charts

## Color Palette

### Primary Colors
- **Sermed Blue**: `hsl(218 91% 41%)` → #0066CC
  - Dark: `hsl(218 91% 25%)` → #002966
  - Light: `hsl(218 91% 50%)`

- **Sermed Green**: `hsl(128 68% 35%)` → #00B050
  - Light: `hsl(128 68% 65%)`

### Status Colors
- **Success**: #00B050 (Sermed Green)
- **Warning**: #FFC107 (Yellow)
- **Error/Critical**: #FF6B6B (Red)
- **Info**: #0066CC (Sermed Blue)

## Key Changes

### 1. Design System
- Updated `src/index.css` with Sermed color variables
- Updated `tailwind.config.ts` with new color utilities
- Created `src/config/theme.ts` for centralized theme configuration

### 2. New Components
#### Medical Components (`src/components/`)
- **SermedLogo**: SVG-based Sermed logo component
- **MedicalCard**: KPI metric cards with trend indicators
- **PatientStatusBadge**: Status indicators for patients
- **MedicalStats**: Statistical display for key metrics
- **MedicalAlert**: Medical alert notifications (critical, warning, info, success)
- **PatientCard**: Enhanced patient information card

### 3. Updated Pages
- **HosixDashboard**: 
  - New header with logo
  - Tremor charts (LineChart for trends, PieChart for distribution)
  - Enhanced KPI cards with trend arrows
  - Department distribution visualization
  - Key metrics section with colored backgrounds

- **HosixLogin**:
  - Sermed branding and logo
  - Updated gradient background
  - New color scheme for form elements
  - Updated footer text

- **HosixSidebar**:
  - Gradient background (Sermed Blue)
  - New logo component
  - Updated active state colors (Sermed Green)
  - Improved hover states

- **HosixHeader**:
  - Updated search input styling
  - New notification indicator color
  - Sermed-themed button states

## Usage Examples

### Using Medical Components

```tsx
import { MedicalCard, PatientStatusBadge, MedicalAlert } from '@/components/medical';

// Medical Card
<MedicalCard
  title="Pacientes Activos"
  value="245"
  icon={Users}
  trend="+12.5%"
  trendPositive={true}
  backgroundColor="bg-sermed-blue"
/>

// Patient Status Badge
<PatientStatusBadge status="active" size="md" showIcon={true} />

// Medical Alert
<MedicalAlert
  type="critical"
  title="Paciente Crítico"
  description="Juan López requiere atención inmediata"
  actionLabel="Atender"
  onAction={handleAction}
/>
```

### Using Theme Configuration

```tsx
import { theme } from '@/config/theme';

// Access brand colors
const primaryColor = theme.colors.primary.main; // hsl(218 91% 41%)

// Access medical specialties
const specialties = theme.medicalSpecialties;

// Access patient statuses
const statusColor = theme.patientStatuses.critical.color;
```

### Using Tremor Charts

```tsx
import { LineChart, Line, BarChart, Bar, PieChart, Pie } from 'recharts';

// Example data
const data = [
  { name: 'Ene', value: 400 },
  { name: 'Feb', value: 450 },
];

<LineChart data={data}>
  <Line type="monotone" dataKey="value" stroke="#0066CC" />
</LineChart>
```

## Tailwind Utilities

### New Color Utilities

```tailwind
/* Background colors */
.bg-sermed-blue        /* Primary blue */
.bg-sermed-blue-dark   /* Dark blue */
.bg-sermed-green       /* Primary green */
.bg-sermed-green-light /* Light green */

/* Text colors */
.text-sermed-blue
.text-sermed-green

/* Border colors */
.border-sermed-blue
.border-sermed-green
```

## Font & Typography

The design uses consistent typography:
- **Headings**: Bold (font-bold) in Sermed Blue
- **Subheadings**: Medium (font-semibold) in Sermed Blue
- **Body Text**: Regular text in gray
- **Status Text**: Medium (font-medium) in appropriate status color

## Responsive Design

All components are fully responsive:
- **Mobile**: Single column layouts, stacked cards
- **Tablet**: 2-3 column grids
- **Desktop**: Full multi-column layouts with charts

## Dark Mode Support

The theme supports dark mode with:
- Adjusted primary color: `hsl(218 91% 50%)`
- Adjusted secondary color: `hsl(128 68% 45%)`
- Proper contrast ratios maintained

## Accessibility

All components follow WCAG 2.1 AA standards:
- Proper color contrast ratios (minimum 4.5:1 for text)
- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Customizations

To customize the theme further:

1. **Update Colors**: Edit `src/index.css` CSS variables
2. **Add New Colors**: Update both `src/index.css` and `tailwind.config.ts`
3. **Update Branding**: Modify `src/components/SermedLogo.tsx`
4. **Update Theme Config**: Modify `src/config/theme.ts`

## Component Imports

```tsx
// Import individual components
import { SermedLogo } from '@/components/SermedLogo';
import { MedicalCard } from '@/components/MedicalCard';

// Or import from medical barrel
import { SermedLogo, MedicalCard, PatientStatusBadge } from '@/components/medical';
```

## Dependencies

- **@tremor/react**: ^3.18.7 - Data visualization
- **recharts**: ^3.1.2 - Advanced charting
- **lucide-react**: ^0.462.0 - Icons
- **@radix-ui**: Various - Accessible components
- **tailwindcss**: ^3.4.11 - Styling
