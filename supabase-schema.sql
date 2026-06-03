-- HAUSHALT Budget App - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  student_id TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('student_hostel', 'student_private', 'professional', 'sharing_roommates')),
  location TEXT NOT NULL CHECK (location IN ('kitwe', 'lusaka', 'other')),
  household_size INTEGER DEFAULT 1,
  monthly_income DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups Table (must be created before expenses)
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Categories Table
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  planned_amount DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  color TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Table (now can reference groups table)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  merchant TEXT NOT NULL,
  date DATE NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group Expenses Table
CREATE TABLE IF NOT EXISTS group_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  paid_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  split_between UUID[] NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settlements Table
CREATE TABLE IF NOT EXISTS settlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  from_user UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Grocery Items Table
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('grains', 'oils', 'vegetables', 'proteins', 'dairy', 'household', 'other')),
  unit TEXT NOT NULL,
  baseline_price DECIMAL(10,2) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grocery Trips Table
CREATE TABLE IF NOT EXISTS grocery_trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store TEXT NOT NULL,
  location TEXT NOT NULL,
  estimated_total DECIMAL(10,2) NOT NULL,
  actual_total DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'shopping', 'completed')),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grocery Trip Items Table
CREATE TABLE IF NOT EXISTS grocery_trip_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES grocery_trips(id) ON DELETE CASCADE,
  item_id UUID REFERENCES grocery_items(id) ON DELETE CASCADE,
  suggested_price DECIMAL(10,2) NOT NULL,
  actual_price DECIMAL(10,2),
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price Records Table
CREATE TABLE IF NOT EXISTS price_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES grocery_items(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  store TEXT NOT NULL,
  location TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low'))
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  default_location TEXT NOT NULL,
  default_store TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'dark',
  language TEXT NOT NULL DEFAULT 'en',
  budget_reminders BOOLEAN DEFAULT TRUE,
  price_alerts BOOLEAN DEFAULT TRUE,
  group_updates BOOLEAN DEFAULT TRUE,
  currency TEXT NOT NULL DEFAULT 'ZMW',
  budget_alerts BOOLEAN DEFAULT TRUE,
  auto_categorize BOOLEAN DEFAULT TRUE,
  monthly_budget DECIMAL(10,2) DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User Feedback Table (for help screen)
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feedback TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_user_id_month_year ON budget_categories(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_expenses_group_id ON group_expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_user ON settlements(from_user);
CREATE INDEX IF NOT EXISTS idx_settlements_to_user ON settlements(to_user);
CREATE INDEX IF NOT EXISTS idx_grocery_trips_user_id ON grocery_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_trip_items_trip_id ON grocery_trip_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_price_records_item_location ON price_records(item_id, location, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_trip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own data
-- Drop existing policies first, then recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can insert own budget categories" ON budget_categories;
DROP POLICY IF EXISTS "Users can update own budget categories" ON budget_categories;

DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

DROP POLICY IF EXISTS "Users can view own groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;

DROP POLICY IF EXISTS "Group members can view group membership" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Group members can update their membership" ON group_members;
DROP POLICY IF EXISTS "Group admins can update memberships" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;

DROP POLICY IF EXISTS "Group members can view group expenses" ON group_expenses;
DROP POLICY IF EXISTS "Group members can create group expenses" ON group_expenses;
DROP POLICY IF EXISTS "Expense creators can update expenses" ON group_expenses;

DROP POLICY IF EXISTS "Group members can view settlements" ON settlements;
DROP POLICY IF EXISTS "Users can create settlements" ON settlements;
DROP POLICY IF EXISTS "Settlement participants can update" ON settlements;

DROP POLICY IF EXISTS "Users can view grocery items" ON grocery_items;
DROP POLICY IF EXISTS "Users can insert grocery items" ON grocery_items;

DROP POLICY IF EXISTS "Users can view own grocery trips" ON grocery_trips;
DROP POLICY IF EXISTS "Users can create own grocery trips" ON grocery_trips;
DROP POLICY IF EXISTS "Users can update own grocery trips" ON grocery_trips;

DROP POLICY IF EXISTS "Users can view grocery trip items" ON grocery_trip_items;
DROP POLICY IF EXISTS "Users can manage grocery trip items" ON grocery_trip_items;

DROP POLICY IF EXISTS "Users can view price records" ON price_records;
DROP POLICY IF EXISTS "Users can insert price records" ON price_records;

DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

DROP POLICY IF EXISTS "Users can view own feedback" ON user_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON user_feedback;

-- Now create the policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own budget categories" ON budget_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budget categories" ON budget_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budget categories" ON budget_categories FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own groups" ON groups FOR SELECT USING (created_by = auth.uid() OR id IN (
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
));
CREATE POLICY "Users can create groups" ON groups FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own groups" ON groups FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own groups" ON groups FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Group members can view groups" ON groups FOR SELECT USING (id IN (
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
));

CREATE POLICY "Group members can view group membership" ON group_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own membership" ON group_members FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Group admins can manage memberships" ON group_members FOR ALL USING (
  user_id = auth.uid() AND 
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Group members can view group expenses" ON group_expenses FOR SELECT USING (group_id IN (
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
));
CREATE POLICY "Group members can create group expenses" ON group_expenses FOR INSERT WITH CHECK (group_id IN (
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
));
CREATE POLICY "Expense creators can update expenses" ON group_expenses FOR UPDATE USING (paid_by = auth.uid());

CREATE POLICY "Group members can view settlements" ON settlements FOR SELECT USING (group_id IN (
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
));
CREATE POLICY "Users can create settlements" ON settlements FOR INSERT WITH CHECK (from_user = auth.uid() OR to_user = auth.uid());
CREATE POLICY "Settlement participants can update" ON settlements FOR UPDATE USING (from_user = auth.uid() OR to_user = auth.uid());

CREATE POLICY "Users can view grocery items" ON grocery_items FOR SELECT USING (true);
CREATE POLICY "Users can insert grocery items" ON grocery_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own grocery trips" ON grocery_trips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own grocery trips" ON grocery_trips FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own grocery trips" ON grocery_trips FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view grocery trip items" ON grocery_trip_items FOR SELECT USING (trip_id IN (
  SELECT id FROM grocery_trips WHERE user_id = auth.uid()
));
CREATE POLICY "Users can manage grocery trip items" ON grocery_trip_items FOR ALL USING (trip_id IN (
  SELECT id FROM grocery_trips WHERE user_id = auth.uid()
));

CREATE POLICY "Users can view price records" ON price_records FOR SELECT USING (true);
CREATE POLICY "Users can insert price records" ON price_records FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers first, then recreate them
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_budget_categories_updated_at ON budget_categories;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_grocery_trips_updated_at ON grocery_trips;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON budget_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grocery_trips_updated_at BEFORE UPDATE ON grocery_trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: Email confirmation is disabled separately using disable-email-confirmation.sql
-- This prevents permission issues during schema setup

-- Insert initial grocery items data
INSERT INTO grocery_items (name, category, unit, baseline_price) VALUES
-- Grains
('Mealie meal', 'grains', '25kg bag', 180.00),
('Breakfast meal', 'grains', '10kg bag', 120.00),
('Rice', 'grains', '5kg bag', 85.00),
('Bread', 'grains', 'loaf', 20.00),
('Rolls', 'grains', '6 pack', 15.00),

-- Oils
('Cooking oil', 'oils', '2L bottle', 85.00),
('Margarine', 'oils', '500g', 25.00),
('Chibuku', 'oils', '1L', 15.00),

-- Vegetables
('Tomatoes', 'vegetables', 'kg', 25.00),
('Onions', 'vegetables', 'kg', 20.00),
('Potatoes', 'vegetables', 'kg', 15.00),
('Rape', 'vegetables', 'bunch', 10.00),
('Kalembula', 'vegetables', 'bunch', 8.00),

-- Proteins
('Kapenta', 'proteins', 'small bucket', 45.00),
('Chicken', 'proteins', 'whole', 65.00),
('Beef', 'proteins', 'kg', 120.00),
('Eggs', 'proteins', '30 pack', 35.00),
('Dried fish', 'proteins', 'kg', 150.00),

-- Dairy
('Milk', 'dairy', '1L', 18.00),
('Yoghurt', 'dairy', '500ml', 12.00),
('Cheese', 'dairy', '200g', 45.00),

-- Household
('Sugar', 'household', '2kg', 65.00),
('Salt', 'household', '1kg', 8.00),
('Soap', 'household', 'bar', 10.00),
('Toilet paper', 'household', '12 rolls', 55.00),
('Matches', 'household', 'box', 5.00),

-- Other
('Fanta', 'other', '2L', 22.00),
('Coke', 'other', '2L', 25.00),
('Juice', 'other', '1L', 18.00),
('Biscuits', 'other', 'pack', 12.00)

ON CONFLICT (name) DO NOTHING;
