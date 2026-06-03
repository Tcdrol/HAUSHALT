export interface GroupMember {
  id: string;
  name: string;
  isCurrentUser: boolean;
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmount: number;
  date: Date;
  category: string;
}

export interface Balance {
  userId: string;
  userName: string;
  amount: number;
  isOwed: boolean; // true if user owes money, false if user is owed money
}

export function calculateSplitAmount(totalAmount: number, numberOfMembers: number): number {
  return Math.round((totalAmount / numberOfMembers) * 100) / 100; // Round to 2 decimal places
}

export function calculateBalances(
  expenses: GroupExpense[], 
  members: GroupMember[]
): Balance[] {
  const balances: { [userId: string]: number } = {};
  
  // Initialize all members with 0 balance
  members.forEach(member => {
    balances[member.id] = 0;
  });
  
  // Calculate balances from expenses
  expenses.forEach(expense => {
    const splitAmount = expense.splitAmount;
    
    // Person who paid gets credit
    balances[expense.paidBy] += (expense.amount - splitAmount);
    
    // Everyone else owes their share
    members.forEach(member => {
      if (member.id !== expense.paidBy) {
        balances[member.id] -= splitAmount;
      }
    });
  });
  
  // Convert to Balance objects
  return members.map(member => ({
    userId: member.id,
    userName: member.name,
    amount: Math.abs(balances[member.id]),
    isOwed: balances[member.id] < 0
  })).filter(balance => balance.amount > 0.01); // Only show non-zero balances
}

export function suggestSettlements(balances: Balance[]): Array<{
  from: string;
  to: string;
  amount: number;
}> {
  const settlements: Array<{ from: string; to: string; amount: number }> = [];
  const debtors = balances.filter(b => b.isOwed);
  const creditors = balances.filter(b => !b.isOwed);
  
  // Simple settlement algorithm
  let debtorIndex = 0;
  let creditorIndex = 0;
  
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    
    const settlementAmount = Math.min(debtor.amount, creditor.amount);
    
    settlements.push({
      from: debtor.userName,
      to: creditor.userName,
      amount: settlementAmount
    });
    
    debtor.amount -= settlementAmount;
    creditor.amount -= settlementAmount;
    
    if (debtor.amount <= 0.01) debtorIndex++;
    if (creditor.amount <= 0.01) creditorIndex++;
  }
  
  return settlements;
}

export function formatCurrency(amount: number): string {
  return `K${amount.toFixed(2)}`;
}

export function validateGroupData(
  name: string,
  members: string[]
): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Group name is required' };
  }
  
  if (members.length < 1) {
    return { isValid: false, error: 'At least 1 member is required (excluding yourself)' };
  }
  
  const uniqueMembers = new Set(members.map(m => m.toLowerCase().trim()));
  if (uniqueMembers.size !== members.length) {
    return { isValid: false, error: 'Duplicate member names are not allowed' };
  }
  
  return { isValid: true };
}

export function validateGroupDataWithUsers(
  name: string,
  members: any[]
): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Group name is required' };
  }
  
  if (members.length < 1) {
    return { isValid: false, error: 'At least 1 member is required (excluding yourself)' };
  }
  
  const uniqueIds = new Set(members.map(m => m.user_id));
  if (uniqueIds.size !== members.length) {
    return { isValid: false, error: 'Duplicate members are not allowed' };
  }
  
  return { isValid: true };
}
