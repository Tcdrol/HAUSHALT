import { supabase } from '../supabase';

// Define types locally to avoid circular dependencies
type BudgetItem = {
  id: string;
  budget_category_id: string;
  grocery_item_id: string | null;
  name: string;
  quantity: number;
  estimated_price: number;
  actual_price: number | null;
  store: string | null;
  created_at: string;
  updated_at: string;
};

type BudgetItemInsert = {
  budget_category_id: string;
  grocery_item_id?: string | null;
  name: string;
  quantity?: number;
  estimated_price?: number;
  actual_price?: number | null;
  store?: string | null;
};

type BudgetItemUpdate = {
  grocery_item_id?: string | null;
  name?: string;
  quantity?: number;
  estimated_price?: number;
  actual_price?: number | null;
  store?: string | null;
};

export class BudgetItemService {
  // Get budget items by category
  static async getBudgetItemsByCategory(
    categoryId: string
  ): Promise<{ success: boolean; data?: BudgetItem[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('budget_category_id', categoryId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get budget items by category error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get budget items' 
      };
    }
  }

  // Get budget items by user for a specific month
  static async getBudgetItemsByUser(
    userId: string,
    month: number,
    year: number
  ): Promise<{ success: boolean; data?: BudgetItem[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select(`
          *,
          budget_categories!inner(
            user_id,
            month,
            year
          )
        `)
        .eq('budget_categories.user_id', userId)
        .eq('budget_categories.month', month)
        .eq('budget_categories.year', year)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get budget items by user error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get budget items' 
      };
    }
  }

  // Create budget item
  static async createBudgetItem(
    itemData: BudgetItemInsert
  ): Promise<{ success: boolean; data?: BudgetItem; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .insert(itemData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Create budget item error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create budget item' 
      };
    }
  }

  // Update budget item
  static async updateBudgetItem(
    itemId: string,
    updates: BudgetItemUpdate
  ): Promise<{ success: boolean; data?: BudgetItem; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Update budget item error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update budget item' 
      };
    }
  }

  // Update actual price for budget item
  static async updateActualPrice(
    itemId: string,
    actualPrice: number
  ): Promise<{ success: boolean; data?: BudgetItem; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .update({
          actual_price: actualPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Update actual price error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update actual price' 
      };
    }
  }

  // Delete budget item
  static async deleteBudgetItem(
    itemId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Delete budget item error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete budget item' 
      };
    }
  }

  // Calculate category total from budget items
  static async calculateCategoryTotal(
    categoryId: string
  ): Promise<{ success: boolean; data?: { totalEstimated: number; totalActual: number }; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('estimated_price, actual_price, quantity')
        .eq('budget_category_id', categoryId);

      if (error) {
        throw error;
      }

      const totalEstimated = data?.reduce((sum, item) => {
        return sum + (item.estimated_price * (item.quantity || 1));
      }, 0) || 0;

      const totalActual = data?.reduce((sum, item) => {
        return sum + ((item.actual_price || 0) * (item.quantity || 1));
      }, 0) || 0;

      return { 
        success: true, 
        data: { 
          totalEstimated: Math.round(totalEstimated * 100) / 100,
          totalActual: Math.round(totalActual * 100) / 100
        } 
      };
    } catch (error: any) {
      console.error('Calculate category total error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to calculate category total' 
      };
    }
  }

  // Get budget item with grocery item details
  static async getBudgetItemWithGroceryDetails(
    itemId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select(`
          *,
          grocery_items(
            id,
            name,
            category,
            unit,
            baseline_price
          )
        `)
        .eq('id', itemId)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get budget item with grocery details error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get budget item details' 
      };
    }
  }
}
