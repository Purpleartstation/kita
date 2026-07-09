import Dexie, { type EntityTable } from 'dexie';

export type AccountType = 'bank' | 'ewallet' | 'cash';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type RuleFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'custom';
export type BillStatus = 'upcoming' | 'due-soon' | 'overdue' | 'paid';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  hasPin: boolean;
  pin?: string;
  email?: string;
  password?: string;
}

export interface Household {
  id: string;
  name: string;
  type: 'solo' | 'partner' | 'family';
  memberIds: string[];
}

export interface Account {
  id: string;
  householdId: string;
  ownerId: string | null; // null if shared
  name: string;
  type: AccountType;
  institution: string;
  balance: number;
  color: string;
  icon?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense' | 'transfer';
  color?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId?: string;
  amount: number;
  type: TransactionType;
  note: string;
  date: number; // timestamp
  recurringRuleId?: string;
  targetAccountId?: string; // for transfers
}

export interface RecurringRule {
  id: string;
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  amount: number;
  frequency: RuleFrequency;
  nextRunDate: number;
  variableAmountFlag: boolean;
  note: string;
  targetAccountId?: string; // for transfers
}

export interface Bill {
  id: string;
  name: string;
  accountId: string;
  amount: number;
  dueDay: number; // 1-31 — used for monthly mode
  dueType?: 'monthly' | 'specific'; // monthly = auto-recur on same day, specific = custom list of dates
  specificDates?: number[]; // list of timestamps; used when dueType === 'specific'
  status: BillStatus;
  recurringRuleId?: string;
  lastPaidDate?: number;
  timesRecurred?: number;
}

export interface Debt {
  id: string;
  name: string;
  lender: string;
  originalAmount: number;
  remainingBalance: number;
  interestRate?: number;
  installmentAmount: number;
  dueDay: number; // 1-31
  payoffStrategy: 'snowball' | 'avalanche';
}

export interface NotificationMsg {
  id: string;
  userId: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: number;
}

export const db = new Dexie('KitaDB') as Dexie & {
  users: EntityTable<User, 'id'>;
  households: EntityTable<Household, 'id'>;
  accounts: EntityTable<Account, 'id'>;
  categories: EntityTable<Category, 'id'>;
  transactions: EntityTable<Transaction, 'id'>;
  recurringRules: EntityTable<RecurringRule, 'id'>;
  bills: EntityTable<Bill, 'id'>;
  debts: EntityTable<Debt, 'id'>;
  notifications: EntityTable<NotificationMsg, 'id'>;
};

db.version(1).stores({
  users: 'id',
  households: 'id',
  accounts: 'id, householdId, ownerId, type',
  categories: 'id, type',
  transactions: 'id, accountId, categoryId, date, type',
  recurringRules: 'id, accountId, nextRunDate',
  bills: 'id, accountId, status',
  debts: 'id',
  notifications: 'id, userId, read, createdAt'
});

export async function seedMockData() {
  const usersCount = await db.users.count();
  if (usersCount > 0) return; // already seeded

  const now = Date.now();
  const userId = 'u1';
  const householdId = 'h1';

  await db.users.bulkAdd([
    {
      id: 'u1',
      name: 'Juan Dela Cruz',
      email: 'juan@example.com',
      password: 'password123',
      hasPin: true,
      pin: '1234'
    },
    {
      id: 'u2',
      name: 'Maria Dela Cruz',
      email: 'maria@example.com',
      password: 'password123',
      hasPin: true,
      pin: '5678'
    }
  ]);

  await db.households.add({
    id: householdId,
    name: 'Dela Cruz Family',
    type: 'partner',
    memberIds: ['u1', 'u2'] // connected by default in mock data so they see it live
  });

  const account1 = 'acc_gcash';
  const account2 = 'acc_bpi';
  const account3 = 'acc_cash';

  await db.accounts.bulkAdd([
    {
      id: account1,
      householdId,
      ownerId: userId,
      name: 'GCash',
      type: 'ewallet',
      institution: 'GCash',
      balance: 8230,
      color: '#0052FF',
      icon: 'smartphone'
    },
    {
      id: account2,
      householdId,
      ownerId: userId,
      name: 'BPI Savings',
      type: 'bank',
      institution: 'BPI',
      balance: 45000,
      color: '#B22222',
      icon: 'landmark'
    },
    {
      id: account3,
      householdId,
      ownerId: null, // shared
      name: 'Cash on Hand',
      type: 'cash',
      institution: 'Cash',
      balance: 1500,
      color: '#228B22',
      icon: 'wallet'
    }
  ]);

  const catFoodId = 'cat_food';
  const catSalaryId = 'cat_salary';
  const catTranspoId = 'cat_transpo';
  const catBillsId = 'cat_bills';
  const catTransferId = 'cat_transfer';

  await db.categories.bulkAdd([
    { id: catFoodId, name: 'Food', icon: 'utensils', type: 'expense', color: '#F59E0B' },
    { id: catTranspoId, name: 'Transport', icon: 'bus', type: 'expense', color: '#3B82F6' },
    { id: catBillsId, name: 'Bills', icon: 'receipt', type: 'expense', color: '#EF4444' },
    { id: catSalaryId, name: 'Salary', icon: 'briefcase', type: 'income', color: '#10B981' },
    { id: catTransferId, name: 'Transfer', icon: 'arrow-right-left', type: 'transfer', color: '#818CF8' }
  ]);

  await db.transactions.bulkAdd([
    {
      id: 'tx_1',
      accountId: account2,
      categoryId: catSalaryId,
      amount: 25000,
      type: 'income',
      note: 'Quincena Salary',
      date: now - 5 * 86400000 // 5 days ago
    },
    {
      id: 'tx_2',
      accountId: account1,
      categoryId: catFoodId,
      amount: 350,
      type: 'expense',
      note: 'Groceries',
      date: now - 2 * 86400000
    },
    {
      id: 'tx_3',
      accountId: account3,
      categoryId: catTranspoId,
      amount: 50,
      type: 'expense',
      note: 'Jeepney',
      date: now - 86400000
    }
  ]);

  await db.bills.add({
    id: 'bill_meralco',
    name: 'Meralco',
    accountId: account1,
    amount: 1800,
    dueDay: new Date().getDate() + 3 > 30 ? 5 : new Date().getDate() + 3, // Due in 3 days roughly
    status: 'upcoming'
  });

  await db.debts.add({
    id: 'debt_gcredit',
    name: 'GCredit',
    lender: 'GCash',
    originalAmount: 5000,
    remainingBalance: 2500,
    interestRate: 5,
    installmentAmount: 500,
    dueDay: 15,
    payoffStrategy: 'snowball'
  });
}

// Ensures the system Transfer category always exists (safe to call on every app start)
export async function ensureTransferCategory() {
  const exists = await db.categories.get('cat_transfer');
  if (!exists) {
    await db.categories.add({
      id: 'cat_transfer',
      name: 'Transfer',
      icon: 'arrow-right-left',
      type: 'transfer',
      color: '#818CF8'
    });
  }
}
