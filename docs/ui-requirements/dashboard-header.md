# UI Requirements: DashboardHeader Component

## 1. Objective

Generate a responsive and modern `DashboardHeader` component for the TGeasy application dashboard. This component will display the current page title and provide a container for action buttons or other controls.

## 2. Technical Specifications

- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Dependencies**: `lucide-react` for icons.
- **File Location**: `components/layout/dashboard-header.tsx`
- **Props Interface**: `DashboardHeaderProps`

## 3. Component Props

The component should accept the following props:

- `title` (string, required): The main title to be displayed on the header.
- `children` (React.ReactNode, optional): A slot for action buttons or other components to be displayed on the right side of the header.
- `className` (string, optional): For additional styling.

## 4. Visual Design & Layout

- The component should be a `header` HTML element.
- It should use Flexbox to align items (`flex`, `justify-between`, `items-center`).
- The `title` should be on the left, rendered as an `h1` element with a bold, large font (e.g., `text-2xl font-bold tracking-tight`).
- The `children` (action buttons, etc.) should be on the right side, inside a `div` container that arranges them in a row with spacing (e.g., `flex items-center space-x-2`).
- The header should have horizontal padding (e.g., `px-4` or `px-6`) and vertical padding (e.g., `py-4`).
- It should have a bottom border to separate it from the content below (e.g., `border-b`).

## 5. Example Usage (for context)

```tsx
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const MyPage = () => (
  <div>
    <DashboardHeader title="Мои каналы">
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" />
        Подключить канал
      </Button>
    </DashboardHeader>
    {/* Page content goes here */}
  </div>
);
```

## 6. Final Output

- Create a new file at `components/layout/dashboard-header.tsx`.
- The file should contain the `DashboardHeader` component and its `DashboardHeaderProps` interface.
- The component should be exported using a named export.
- Use the `cn` utility from `lib/utils` for merging class names. 