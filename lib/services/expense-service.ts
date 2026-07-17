import { supabase } from '../supabase';
import { BudgetService } from './budget-service';

// Define types locally to avoid circular dependencies
type Expense = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  is_shared: boolean;
  group_id: string | null;
  created_at: string;
  updated_at: string;
};

type ExpenseInsert = {
  user_id: string;
  description: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  is_shared?: boolean;
  group_id?: string | null;
};

type ExpenseUpdate = {
  description?: string;
  amount?: number;
  category?: string;
  merchant?: string;
  date?: string;
  is_shared?: boolean;
  group_id?: string | null;
};

export class ExpenseService {
  // Get all expenses for a user
  static async getExpenses(
    userId: string, 
    limit: number = 50,
    offset: number = 0
  ): Promise<{ success: boolean; data?: Expense[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get expenses error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get expenses' 
      };
    }
  }

  // Get expenses for a specific month/year
  static async getExpensesByMonth(
    userId: string, 
    month: number, 
    year: number
  ): Promise<{ success: boolean; data?: Expense[]; error?: string }> {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get expenses by month error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get expenses for month' 
      };
    }
  }

  // Add a new expense
  static async addExpense(
    expenseData: ExpenseInsert
  ): Promise<{ success: boolean; data?: Expense; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update budget spent amount automatically
      const expenseDate = new Date(expenseData.date);
      const month = expenseDate.getMonth() + 1;
      const year = expenseDate.getFullYear();

      await BudgetService.addExpenseToBudget(
        expenseData.user_id,
        expenseData.category,
        expenseData.amount,
        month,
        year
      );

      return { success: true, data };
    } catch (error: any) {
      console.error('Add expense error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add expense' 
      };
    }
  }

  // Update an expense
  static async updateExpense(
    expenseId: string,
    updates: ExpenseUpdate
  ): Promise<{ success: boolean; data?: Expense; error?: string }> {
    try {
      // Get the old expense first so we know what to adjust in the budget
      const { data: oldExpense, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (fetchError) throw fetchError;

      const oldCategory = oldExpense.category;
      const oldAmount = oldExpense.amount;
      const oldDate = new Date(oldExpense.date);
      const oldMonth = oldDate.getMonth() + 1;
      const oldYear = oldDate.getFullYear();

      // Update the expense
      const { data, error } = await supabase
        .from('expenses')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', expenseId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newCategory = updates.category || oldCategory;
      const newAmount = updates.amount ?? oldAmount;
      const newDate = updates.date ? new Date(updates.date) : oldDate;
      const newMonth = newDate.getMonth() + 1;
      const newYear = newDate.getFullYear();

      // Always recalculate the old category spending
      await BudgetService.recalculateCategorySpending(
        oldExpense.user_id, oldCategory, oldMonth, oldYear
      );

      // If category, amount, or date changed, recalculate the new category too
      const categoryChanged = newCategory !== oldCategory;
      const amountChanged = updates.amount !== undefined && updates.amount !== oldAmount;
      const dateChanged = updates.date && updates.date !== oldExpense.date;

      if (categoryChanged || amountChanged || dateChanged) {
        await BudgetService.recalculateCategorySpending(
          oldExpense.user_id, newCategory, newMonth, newYear
        );
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Update expense error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update expense'
      };
    }
  }

  // Delete an expense
  static async deleteExpense(
    expenseId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the expense first so we know what to adjust in the budget
      const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        throw error;
      }

      // Recalculate the category spending to reflect the deletion
      const expenseDate = new Date(expense.date);
      const month = expenseDate.getMonth() + 1;
      const year = expenseDate.getFullYear();

      await BudgetService.recalculateCategorySpending(
        expense.user_id, expense.category, month, year
      );

      return { success: true };
    } catch (error: any) {
      console.error('Delete expense error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete expense'
      };
    }
  }

  // Get expense statistics
  static async getExpenseStats(
    userId: string, 
    month: number, 
    year: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('expenses')
        .select('amount, category')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        throw error;
      }

      // Calculate statistics
      const stats = {
        totalSpent: data?.reduce((sum, expense) => sum + expense.amount, 0) || 0,
        transactionCount: data?.length || 0,
        categoryBreakdown: data?.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {} as Record<string, number>) || {},
      };

      return { success: true, data: stats };
    } catch (error: any) {
      console.error('Get expense stats error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get expense statistics' 
      };
    }
  }

  // Subscribe to expense changes
  static subscribeToExpenses(
    userId: string, 
    callback: (expense: Expense) => void
  ) {
    return supabase
      .channel(`expenses_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload.new as Expense);
          } else if (payload.eventType === 'DELETE') {
            callback(payload.old as Expense);
          }
        }
      )
      .subscribe();
  }

  // Get recent expenses (last 10)
  static async getRecentExpenses(
    userId: string
  ): Promise<{ success: boolean; data?: Expense[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get recent expenses error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get recent expenses' 
      };
    }
  }

  // Add a group expense and reflect it across all member accounts
  static async addGroupExpenseForAll(
    groupExpenseData: {
      group_id: string;
      expense_id: string;
      paid_by: string;
      split_between: string[];
      amount: number;
      description: string;
      date: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // First, add the group expense record
      const groupExpenseResult = await supabase
        .from('group_expenses')
        .insert(groupExpenseData)
        .select()
        .single();

      if (groupExpenseResult.error) {
        throw groupExpenseResult.error;
      }

      // Calculate each person's share
      const splitAmount = groupExpenseData.amount / groupExpenseData.split_between.length;

      // Create individual expense records for each member
      const expensePromises = groupExpenseData.split_between.map(async (userId) => {
        const isPayer = userId === groupExpenseData.paid_by;
        
        const expenseData: ExpenseInsert = {
          user_id: userId,
          description: `${groupExpenseData.description} (Group Expense)`,
          amount: isPayer ? groupExpenseData.amount : splitAmount,
          category: 'shared',
          merchant: 'Group Expense',
          date: groupExpenseData.date,
          is_shared: true,
          group_id: groupExpenseData.group_id,
        };

        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) {
          console.error(`Failed to create expense for user ${userId}:`, error);
          return null;
        }

        // Recalculate the shared category spending for this user
        const expenseDate = new Date(expenseData.date);
        const month = expenseDate.getMonth() + 1;
        const year = expenseDate.getFullYear();

        await BudgetService.recalculateCategorySpending(
          userId,
          expenseData.category,
          month,
          year
        );

        return { userId, success: true };
      });

      const results = await Promise.all(expensePromises);

      return {
        success: true, 
        data: {
          groupExpense: groupExpenseResult.data,
          individualExpenses: results
        }
      };
    } catch (error: any) {
      console.error('Add group expense for all error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add group expense' 
      };
    }
  }

  // Get expenses for a specific group
  static async getGroupExpenses(
    groupId: string
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get group expenses error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get group expenses' 
      };
    }
  }

  // Get shared expenses for a user (expenses from groups they're part of)
  static async getSharedExpenses(
    userId: string
  ): Promise<{ success: boolean; data?: Expense[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_shared', true)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get shared expenses error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get shared expenses' 
      };
    }
  }
}
