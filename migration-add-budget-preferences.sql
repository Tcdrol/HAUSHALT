-- Migration: Add Budget-Specific Fields to user_preferences Table
-- Run this if you already have the schema installed and need to add the new fields

-- Add missing budget-specific fields
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ZMW',
ADD COLUMN IF NOT EXISTS budget_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS auto_categorize BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS monthly_budget DECIMAL(10,2) DEFAULT 2000;

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND column_name IN ('currency', 'budget_alerts', 'auto_categorize', 'monthly_budget')
ORDER BY column_name;
