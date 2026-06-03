import { supabase } from '../supabase';

// Define types locally to avoid circular dependencies
type BudgetCategory = {
  id: string;
  user_id: string;
  name: string;
  planned_amount: number;
  spent_amount: number;
  color: string;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
};

type BudgetCategoryInsert = {
  user_id: string;
  name: string;
  planned_amount: number;
  spent_amount: number;
  color: string;
  month: number;
  year: number;
};

type BudgetCategoryUpdate = {
  name?: string;
  planned_amount?: number;
  spent_amount?: number;
  color?: string;
};

export class BudgetService {
  // Get budget categories for a user for a specific month
  static async getBudgetCategories(
    userId: string, 
    month: number, 
    year: number
  ): Promise<{ success: boolean; data?: BudgetCategory[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get budget categories error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get budget categories' 
      };
    }
  }

  // Create or update budget categories
  static async upsertBudgetCategory(
    categoryData: BudgetCategoryInsert
  ): Promise<{ success: boolean; data?: BudgetCategory; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .upsert({
          ...categoryData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Upsert budget category error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to save budget category' 
      };
    }
  }

  // Update budget category
  static async updateBudgetCategory(
    categoryId: string, 
    updates: BudgetCategoryUpdate
  ): Promise<{ success: boolean; data?: BudgetCategory; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Update budget category error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update budget category' 
      };
    }
  }

  // Delete budget category
  static async deleteBudgetCategory(
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('budget_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Delete budget category error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete budget category' 
      };
    }
  }

  // Update spent amount for a budget category
  static async updateSpentAmount(
    categoryId: string, 
    spentAmount: number
  ): Promise<{ success: boolean; data?: BudgetCategory; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .update({
          spent_amount: spentAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Update spent amount error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update spent amount' 
      };
    }
  }

  // Get budget overview for a month
  static async getBudgetOverview(
    userId: string, 
    month: number, 
    year: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: categories, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year);

      if (error) {
        throw error;
      }

      const totalBudget = categories?.reduce((sum, cat) => sum + cat.planned_amount, 0) || 0;
      const totalSpent = categories?.reduce((sum, cat) => sum + cat.spent_amount, 0) || 0;
      const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      const overview = {
        totalBudget,
        totalSpent,
        totalPercentage: Math.round(totalPercentage * 10) / 10,
        isOverBudget: totalPercentage > 100,
        categories: categories || [],
        riskCategories: categories?.filter(cat => {
          const percentage = cat.planned_amount > 0 ? (cat.spent_amount / cat.planned_amount) * 100 : 0;
          return percentage > 80;
        }) || [],
      };

      return { success: true, data: overview };
    } catch (error: any) {
      console.error('Get budget overview error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get budget overview' 
      };
    }
  }

  // Initialize budget categories for a new month
  static async initializeMonthlyBudget(
    userId: string, 
    month: number, 
    year: number, 
    budgetAllocations: { name: string; amount: number; color: string }[]
  ): Promise<{ success: boolean; data?: BudgetCategory[]; error?: string }> {
    try {
      const categories: BudgetCategoryInsert[] = budgetAllocations.map(allocation => ({
        user_id: userId,
        name: allocation.name,
        planned_amount: allocation.amount,
        spent_amount: 0,
        color: allocation.color,
        month,
        year,
      }));

      const { data, error } = await supabase
        .from('budget_categories')
        .insert(categories)
        .select();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Initialize monthly budget error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to initialize monthly budget' 
      };
    }
  }

  // Save budget settings
  static async upsertBudgetSettings(
    userId: string, 
    settings: { user_id: string; monthly_income: number; currency: string; budget_alerts: boolean; auto_categorize: boolean }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('budget_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Upsert budget settings error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to save budget settings' 
      };
    }
  }

  // Get user preferences (used for budget settings)
  static async getUserPreferences(
    userId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no preferences found, return default values
        if (error.code === 'PGRST116') {
          return { 
            success: true, 
            data: {
              currency: 'ZMW',
              budget_alerts: true,
              auto_categorize: true,
              monthly_income: 0
            }
          };
        }
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get user preferences error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get user preferences' 
      };
    }
  }

  // Save user preferences (used for budget settings)
  static async upsertUserPreferences(
    userId: string,
    settings: Record<string, any>
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Upsert user preferences error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to save user preferences' 
      };
    }
  }

  // Subscribe to budget category changes
  static subscribeToBudgetCategories(
    userId: string, 
    month: number, 
    year: number, 
    callback: (category: BudgetCategory) => void
  ) {
    return supabase
      .channel(`budget_${userId}_${month}_${year}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_categories',
          filter: `user_id=eq.${userId}&month=eq.${month}&year=eq.${year}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload.new as BudgetCategory);
          } else if (payload.eventType === 'DELETE') {
            callback(payload.old as BudgetCategory);
          }
        }
      )
      .subscribe();
  }
}
