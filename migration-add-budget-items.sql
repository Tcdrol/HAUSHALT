-- Add status column to budget_categories if it doesn't exist
ALTER TABLE budget_categories 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ready' CHECK (status IN ('ready', 'in_progress', 'completed'));

-- Budget Items Table
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  budget_category_id UUID REFERENCES budget_categories(id) ON DELETE CASCADE,
  grocery_item_id UUID REFERENCES grocery_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  estimated_price DECIMAL(10,2) DEFAULT 0,
  actual_price DECIMAL(10,2),
  store TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for budget_items
CREATE INDEX IF NOT EXISTS idx_budget_items_category_id ON budget_items(budget_category_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_grocery_item_id ON budget_items(grocery_item_id);

-- Enable RLS for budget_items
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budget_items
DROP POLICY IF EXISTS "Users can view own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can insert own budget items" ON budget_items;
DROP POLICY IF EXISTS "Users can update own budget items" ON budget_items;

CREATE POLICY "Users can view own budget items" ON budget_items FOR SELECT USING (
  budget_category_id IN (
    SELECT id FROM budget_categories WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own budget items" ON budget_items FOR INSERT WITH CHECK (
  budget_category_id IN (
    SELECT id FROM budget_categories WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own budget items" ON budget_items FOR UPDATE USING (
  budget_category_id IN (
    SELECT id FROM budget_categories WHERE user_id = auth.uid()
  )
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_budget_items_updated_at ON budget_items;
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
