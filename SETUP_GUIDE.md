# Setup Guide - Haushalt App

## Overview
This guide will help you set up and configure the Haushalt budget management app with all the recent improvements.

## Recent Changes Made

### 1. Database Connection ✅
- **Added AsyncStorage** for persistent user session state
- **Configured Supabase client** with proper auth storage
- **Created .env file** for environment configuration
- **Added connection test script** (test-connection.js)

### 2. User Authentication & State Management ✅
- **Persistent login** - Users stay logged in across app restarts
- **Auto profile creation** - User profiles are automatically created on sign-up
- **Enhanced auth context** - Better state management and profile refresh

### 3. User Search Functionality ✅
- **Email/username search** - Search for other users by email or name
- **Profile service** - Added search, get-by-email, and get-by-IDs functions
- **User discovery** - Easy way to find and add people to groups

### 4. Group Management Improvements ✅
- **User-based groups** - Groups now use actual user IDs instead of names
- **Member search UI** - Real-time search when adding group members
- **Multiple member addition** - Add several members at once
- **Enhanced group service** - Better member management functions

### 5. Expense Sharing Algorithm ✅
- **Verified calculations** - Split amounts, balances, and settlements are correct
- **Enhanced validation** - Better group data validation with user objects
- **Individual expense records** - Each member gets their own expense record

### 6. Expense Reflection Across Accounts ✅
- **Group expenses sync** - When a group expense is added, it reflects in all member accounts
- **Individual tracking** - Each member sees their share and what they owe
- **Proper categorization** - Group expenses marked as shared in individual accounts
- **Balance calculations** - Accurate tracking of who owes whom

### 7. Group Detail Screen Enhancement ✅
- **Real data fetching** - Now loads actual group data from Supabase
- **Dynamic members list** - Shows actual group members with roles
- **Live expense tracking** - Real-time expense updates and balance calculations
- **Loading/error states** - Proper UI feedback during data loading

### 8. User Profile Automation ✅
- **Auto profile creation** - Profiles created automatically on sign-up
- **Profile refresh** - Context automatically fetches and updates user profiles
- **Fallback creation** - Creates profile if missing during authentication

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Supabase

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Sign up/log in and create a new project
   - Wait for the project to be ready (2-3 minutes)

2. **Get Your Credentials**
   - Go to Project Settings → API
   - Copy your Project URL and Anon Key

3. **Update .env File**
   ```bash
   # Edit the .env file in your project root
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 3: Set Up Database Schema

1. **Run the Schema SQL**
   - Go to Supabase Dashboard → SQL Editor
   - Open `supabase-schema.sql` from this project
   - Paste and run the entire SQL script

2. **Fix RLS Policies** (Important for Groups)
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

3. **Disable Email Confirmation** (For Development)
   - Run the `disable-email-confirmation.sql` script in SQL Editor
   - This allows immediate sign-up without email verification

### Step 4: Test Database Connection

```bash
# Install dotenv if not already installed
npm install dotenv

# Run the connection test
node test-connection.js
```

### Step 5: Start the App

```bash
# Start the development server
npx expo start

# Or with cleared cache if you encounter issues
npx expo start --clear
```

### Step 6: Test the App

1. **Create a Test Account**
   - Sign up with email and password
   - Complete the onboarding flow
   - Verify your profile is created automatically

2. **Test Group Features**
   - Create a new group
   - Search for users (you'll need another account)
   - Add members to the group
   - Add a shared expense
   - Verify it appears in all member accounts

3. **Test Expense Sharing**
   - Create multiple group expenses
   - Check balance calculations
   - Verify individual expense records

## Feature Verification Checklist

- [ ] Database connection working
- [ ] User can sign up and sign in
- [ ] User session persists after app restart
- [ ] User profile created automatically on sign-up
- [ ] User search functionality works
- [ ] Groups can be created with real users
- [ ] Group members can be added via search
- [ ] Group expenses reflect in all member accounts
- [ ] Balance calculations are accurate
- [ ] Group detail screen shows real data

## Troubleshooting

### Connection Issues
- Ensure your .env file has correct Supabase credentials
- Check that Supabase project is active and not paused
- Verify the SQL schema was run successfully

### Authentication Issues
- Make sure email confirmation is disabled for development
- Check RLS policies allow proper access
- Verify AsyncStorage is working correctly

### Group Issues
- Ensure the RLS policy fix SQL was run
- Check that user profiles exist for all group members
- Verify group_members table is accessible

### Expense Issues
- Check that expenses table has proper RLS policies
- Verify group_expenses table is set up correctly
- Ensure user IDs are valid and correspond to real users

## Next Steps

1. **Test thoroughly** with multiple user accounts
2. **Add production-ready features** like email verification
3. **Implement notifications** for expense updates
4. **Add more expense categories** and budget templates
5. **Enhance the grocery shopping** feature with real prices

## Support

For issues or questions:
- Check the README.md for general information
- Review the SQL schema files for database structure
- Examine the service files for API usage examples
- Run test-connection.js to diagnose database issues

---

**Note**: This app is designed for development purposes. For production deployment, additional security measures and configuration will be needed.