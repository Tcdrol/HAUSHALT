# HAUSHALT - Budget Management App

A React Native + Expo mobile application for budget tracking, expense management, and group expense sharing. Built with Supabase backend.

## Recent Updates
- **Infrastructure fixes**: Resolved routing errors, import issues, and service configuration problems
- **Code quality**: Fixed TypeScript errors, reduced lint warnings from 41 to 33 (0 errors)
- **Service improvements**: Added missing service functions and fixed AsyncStorage configuration
- **Navigation**: Fixed route structure and removed invalid route references
- **Schema fixes**: Added missing budget fields to user_preferences table, created migration script

## Features

### Core Features (Working ✅)
- **Authentication** - Sign up/in with email/password (Supabase Auth)
- **Dashboard** - View budget overview, recent expenses, spending insights
- **Profile** - View and manage user profile
- **Budget** - View budget categories with real data from Supabase
- **Onboarding Flow** - Welcome → Sign Up → Basic Info → Dashboard
- **Suggested Budget** - AI-powered budget recommendations based on profile

### Features In Progress (Needs Connection 🔧)
- **Grocery Shopping** - UI complete, needs major state management refactoring to connect to GroceryService

### Features Not Started
- **Notifications** - Framework ready, not implemented
- **Help & Feedback** - UI complete, needs backend
- **Account Deletion** - UI complete, needs implementation

## Tech Stack

- **Frontend**: React Native + Expo + TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: Custom components with ThemedText, ThemedView, Card, Button, Input
- **State**: React Context (AppProvider)
- **Icons**: IconSymbol (SF Symbols)

## Project Structure

```
myApp/
├── app/                        # Main application code
│   ├── (auth)/                 # Auth screens (sign-in, sign-up)
│   ├── (onboarding)/           # Onboarding flow (welcome, basic-info, suggested-budget)
│   ├── (tabs)/                 # Main app tabs (dashboard, budget, groups, grocery, profile)
│   ├── _layout.tsx             # Root layout with navigation
│   ├── index.tsx               # Root redirect
│   └── *.tsx                   # Modal screens (add-expense, budget-settings, etc.)
├── components/                 # Reusable UI components
│   ├── ui/                     # UI primitives (Button, Card, Input, IconSymbol)
│   └── *.tsx                   # ThemedText, ThemedView, HapticTab
├── contexts/                   # React Context providers
│   └── app-context.tsx         # Auth + App state management
├── lib/                        # Backend services
│   ├── auth.ts                 # Supabase auth service
│   ├── supabase.ts             # Supabase client + realtime
│   ├── database-types.ts       # TypeScript types
│   └── services/               # Data services
│       ├── profile-service.ts  # User profile CRUD
│       ├── budget-service.ts   # Budget categories CRUD
│       ├── expense-service.ts  # Expenses CRUD
│       ├── group-service.ts    # Groups & members CRUD
│       └── grocery-service.ts  # Grocery & shopping CRUD
├── utils/                      # Utility functions
│   ├── budgetCalculations.ts   # Budget math
│   ├── expenseCategorization.ts # Auto-categorization
│   ├── groceryData.ts          # Grocery price data
│   ├── groupCalculations.ts    # Split calculations
│   ├── priceSuggestions.ts     # Price suggestions
│   ├── validation.ts           # Input validation
└── supabase-schema.sql         # Database schema (run in Supabase)
```

## Database Schema

### Tables
- `auth.users` - Supabase managed users
- `user_profiles` - Extended user info (name, type, location, income)
- `budget_categories` - Monthly budget categories
- `user_preferences` - App settings
- `expenses` - User expenses
- `groups` - Expense sharing groups
- `group_members` - Group membership
- `group_expenses` - Shared expenses
- `settlements` - Payment settlements
- `grocery_items` - Product catalog
- `grocery_trips` - Shopping trips
- `price_records` - Historical prices

### Setup
Run `supabase-schema.sql` in your Supabase SQL Editor to create all tables and policies.

**Important**: If you already have the schema installed, run `migration-add-budget-preferences.sql` to add missing budget-specific fields (`currency`, `budget_alerts`, `auto_categorize`, `monthly_budget`) to the `user_preferences` table.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env.local` in project root:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. Run the SQL from `supabase-schema.sql` in SQL Editor
3. **Fix RLS Policies** - Run this to fix group recursion:
   ```sql
   DO $$
   DECLARE
       pol RECORD;
   BEGIN
       FOR pol IN SELECT policyname FROM pg_policies WHERE tablename IN ('groups', 'group_members')
       LOOP
           EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, 
               CASE WHEN pol.tablename = 'groups' THEN 'groups' ELSE 'group_members' END);
       END LOOP;
   END $$;

   ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
   ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Groups view" ON groups FOR SELECT USING (created_by = auth.uid());
   CREATE POLICY "Groups create" ON groups FOR INSERT WITH CHECK (created_by = auth.uid());
   CREATE POLICY "Groups update" ON groups FOR UPDATE USING (created_by = auth.uid());
   CREATE POLICY "Groups delete" ON groups FOR DELETE USING (created_by = auth.uid());

   CREATE POLICY "Members view" ON group_members FOR SELECT USING (user_id = auth.uid());
   CREATE POLICY "Members insert" ON group_members FOR INSERT WITH CHECK (user_id = auth.uid());
   CREATE POLICY "Members delete" ON group_members FOR DELETE USING (user_id = auth.uid());
   ```

### 4. Start Development Server
```bash
npx expo start
# or with cleared cache (recommended after changes):
npx expo start --clear
# or manually clear cache:
rm -rf node_modules/.cache
npx expo start
```

**Note**: If you encounter routing warnings or bundling errors, clear the Metro bundler cache with `npx expo start --clear`.

## Current Status

### Working ✅
- User authentication (sign up/in)
- Dashboard with budget overview
- Profile viewing and editing (connected to ProfileService)
- Budget categories display
- Budget settings (connected to BudgetService)
- Add expense (connected to ExpenseService)
- Onboarding flow
- Suggested budget generation
- User preferences (connected to BudgetService)
- Shared expenses (connected to GroupService)
- Groups view and management (connected to GroupService)
- Service infrastructure (all CRUD operations implemented)
- Proper navigation structure (routes fixed)

### Recently Fixed 🔧
- **Database Connection Integration**:
  - Add Expense now properly calls ExpenseService.addExpense()
  - Budget Settings now saves to BudgetService.upsertUserPreferences()
  - Edit Profile now saves to ProfileService.upsertProfile()
  - Preferences now saves to BudgetService
  - Shared Expenses now uses GroupService.addGroupExpense()
  - Groups view improved with real database data
- **Infrastructure Issues Resolved**:
  - Fixed routing errors (removed invalid "grocery" route reference)
  - Fixed AsyncStorage configuration (removed problematic dependency)
  - Added missing service functions (`getUserPreferences`, `searchUsers`)
  - Fixed import/export errors across multiple files
  - Resolved TypeScript type errors
  - Added missing React hooks imports (`useEffect`, `useCallback`)
  - Extended icon mapping (added `star.fill` for admin badges)
  - Fixed duplicate variable declarations
- **Schema Issues Resolved**:
  - Added missing budget fields to user_preferences table (`currency`, `budget_alerts`, `auto_categorize`, `monthly_budget`)
  - Created migration script for existing databases
  - Fixed service method signatures to match database operations
- **Lint Status**: 0 errors, 33 warnings (warnings are minor unused variables in other files)

### Needs Database Connection 🔧
The following feature requires major state management overhaul:
1. **Grocery Shopping** - UI complete but uses mock data, requires significant refactoring to connect to GroceryService (shopping list state management, trip creation, price recording, etc.)

### Todo List
Grocery Shopping feature requires major refactoring to implement proper database integration with state management across shopping screens.

## Navigation Flow

```
App Entry
  └── index.tsx → Redirect to /(tabs)/dashboard

Auth (if not logged in)
  └── (auth)/sign-in.tsx or sign-up.tsx

Onboarding (after sign up)
  └── (onboarding)/welcome.tsx → sign-up.tsx → basic-info.tsx → dashboard.tsx

Main App (Tabs)
  └── (tabs)/
      ├── dashboard.tsx (Home)
      ├── groups.tsx
      ├── budget.tsx
      ├── grocery.tsx
      └── profile.tsx

Modals
  └── add-expense.tsx
      add-shared-expense.tsx
      budget-settings.tsx
      create-group.tsx
      edit-profile.tsx
      etc.
```

## Services API

All services return `{ success: boolean, data?: T, error?: string }`:

```typescript
// Profile
ProfileService.getProfile(userId)
ProfileService.upsertProfile(profileData)
ProfileService.searchUsers(query, currentUserId)

// Budget
BudgetService.getBudgetCategories(userId, month, year)
BudgetService.upsertBudgetCategory(categoryData)
BudgetService.getUserPreferences(userId) // ✅ Recently added
BudgetService.upsertUserPreferences(preferences)
BudgetService.getBudgetOverview(userId, month, year)

// Expenses
ExpenseService.getExpenses(userId, limit, offset)
ExpenseService.addExpense(expenseData)
ExpenseService.updateExpense(expenseId, updates)
ExpenseService.deleteExpense(expenseId)

// Groups
GroupService.getUserGroups(userId)
GroupService.getGroupDetails(groupId)
GroupService.createGroup(groupData, userId) // ✅ Fixed to include created_by
GroupService.addGroupMember(groupId, userId, role)
GroupService.addGroupMembers(groupId, userIds, role)
GroupService.createGroupExpense(expenseData)

// Grocery
GroceryService.getGroceryItems()
GroceryService.searchGroceryItems(query)
GroceryService.createTrip(tripData)
GroceryService.getUserTrips(userId)
GroceryService.getTripDetails(tripId)
GroceryService.addItemToTrip(tripId, itemId, price, quantity)
GroceryService.removeItemFromTrip(tripId, itemId)
GroceryService.completeTrip(tripId)
```

## Troubleshooting

### Metro bundler cache issues
If you experience routing warnings, bundling errors, or stale code:
```bash
npx expo start --clear
# or manually:
rm -rf node_modules/.cache
npx expo start
```

### Common errors
- **"No route named 'grocery' exists"** - Clear Metro cache with `npx expo start --clear`
- **"Network request failed"** - Check Supabase URL and anon key in `.env.local`
- **TypeScript/Import errors** - Run `npm run lint` to identify specific issues
- **AsyncStorage errors** - Fixed in recent updates, ensure cache is cleared

### Supabase connection issues
- Check `.env.local` variables
- Verify Supabase project is running
- Check RLS policies are set correctly

### Group loading error (recursion)
Run the SQL fix in Supabase SQL Editor (see Setup section)

### Duplicate profile rows
```sql
DELETE FROM user_profiles 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM user_profiles 
  ORDER BY user_id, created_at DESC
);
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test on both iOS and Android
5. Submit pull request

## License

MIT License - See LICENSE file for details

## Contact

For support, email support@haushalt.app or open an issue on GitHub.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
