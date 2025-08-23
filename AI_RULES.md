# 🤖 AI_RULES.md

## Tech Stack Overview

- **Framework:** React (with TypeScript)
- **Routing:** React Router (routes in `src/App.tsx`)
- **Styling:** Tailwind CSS for all custom styles
- **UI Components:** shadcn/ui (Radix UI-based) for all reusable UI elements
- **Icons:** lucide-react for all iconography
- **State Management:** React's built-in state/hooks (no Redux, Zustand, etc.)
- **Backend/Database:** Supabase (Postgres, Realtime, Auth)
- **AI/ML:** Integrate with OpenAI, Anthropic, or self-hosted endpoints as needed
- **Payments:** Stripe for contributor tiers
- **Deployment:** Vercel

## Library Usage Rules

1. **UI Components:**  
   - Always use shadcn/ui components for buttons, dialogs, forms, etc.  
   - If customization is needed, wrap shadcn/ui components in your own components in `src/components/`.

2. **Styling:**  
   - Use Tailwind CSS utility classes for all layout, spacing, color, and responsive design.  
   - Do not use CSS modules, styled-components, or plain CSS files.

3. **Icons:**  
   - Use lucide-react for all icons.  
   - Do not import SVGs directly or use other icon libraries.

4. **Routing:**  
   - Use React Router for all navigation.  
   - Define all routes in `src/App.tsx`.

5. **State Management:**  
   - Use React's built-in state and context.  
   - Do not add external state management libraries.

6. **Backend & Auth:**  
   - Use Supabase for all database, authentication, and real-time features.  
   - Do not use Firebase, MongoDB, or other backend services.

7. **AI Integrations:**  
   - Use OpenAI, Anthropic, or self-hosted endpoints for AI features.  
   - Do not call AI APIs directly from the client; use serverless functions or Supabase edge functions.

8. **Payments:**  
   - Use Stripe for all payment and subscription features.

9. **Component Organization:**  
   - Place all pages in `src/pages/` and all reusable components in `src/components/`.

10. **Third-Party Packages:**  
    - Only add new dependencies if absolutely necessary and not covered by the above stack.

---
*Follow these rules to ensure consistency, maintainability, and a great developer experience!*