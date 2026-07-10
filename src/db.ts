import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import type { CollectionReference, DocumentData } from 'firebase/firestore';
import { db as firestoreDb } from './firebase';

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

// Export Firestore instance as db to minimize import changes
export const db = firestoreDb;

const createCollection = <T = DocumentData>(path: string) => {
  return collection(db, path) as CollectionReference<T>;
};

// Collection helpers with typed refs
export const collections = {
  users: createCollection<User>('users'),
  households: createCollection<Household>('households'),
  accounts: createCollection<Account>('accounts'),
  categories: createCollection<Category>('categories'),
  transactions: createCollection<Transaction>('transactions'),
  recurringRules: createCollection<RecurringRule>('recurringRules'),
  bills: createCollection<Bill>('bills'),
  debts: createCollection<Debt>('debts'),
  notifications: createCollection<NotificationMsg>('notifications'),
};

export async function seedMockData() {
  // Check if users collection has data by attempting to fetch a known mock user
  const u1Ref = doc(db, 'users', 'u1');
  const u1Snap = await getDoc(u1Ref);
  if (u1Snap.exists()) return; // already seeded

  const now = Date.now();
  const userId = 'u1';
  const householdId = 'h1';

  await setDoc(doc(db, 'users', 'u1'), {
    id: 'u1',
    name: 'Juan Dela Cruz',
    email: 'juan@example.com',
    password: 'password123',
    hasPin: true,
    pin: '1234'
  });
  
  await setDoc(doc(db, 'users', 'u2'), {
    id: 'u2',
    name: 'Maria Dela Cruz',
    email: 'maria@example.com',
    password: 'password123',
    hasPin: true,
    pin: '5678'
  });

  await setDoc(doc(db, 'households', householdId), {
    id: householdId,
    name: 'Dela Cruz Family',
    type: 'partner',
    memberIds: ['u1', 'u2'] 
  });

  const account1 = 'acc_gcash';
  const account2 = 'acc_bpi';
  const account3 = 'acc_cash';

  await setDoc(doc(db, 'accounts', account1), {
    id: account1,
    householdId,
    ownerId: userId,
    name: 'GCash',
    type: 'ewallet',
    institution: 'GCash',
    balance: 8230,
    color: '#0052FF',
    icon: 'smartphone'
  });
  
  await setDoc(doc(db, 'accounts', account2), {
    id: account2,
    householdId,
    ownerId: userId,
    name: 'BPI Savings',
    type: 'bank',
    institution: 'BPI',
    balance: 45000,
    color: '#B22222',
    icon: 'landmark'
  });
  
  await setDoc(doc(db, 'accounts', account3), {
    id: account3,
    householdId,
    ownerId: null,
    name: 'Cash on Hand',
    type: 'cash',
    institution: 'Cash',
    balance: 1500,
    color: '#228B22',
    icon: 'wallet'
  });

  const catFoodId = 'cat_food';
  const catSalaryId = 'cat_salary';
  const catTranspoId = 'cat_transpo';
  const catBillsId = 'cat_bills';
  const catTransferId = 'cat_transfer';

  await setDoc(doc(db, 'categories', catFoodId), { id: catFoodId, name: 'Food', icon: 'utensils', type: 'expense', color: '#F59E0B' });
  await setDoc(doc(db, 'categories', catTranspoId), { id: catTranspoId, name: 'Transport', icon: 'bus', type: 'expense', color: '#3B82F6' });
  await setDoc(doc(db, 'categories', catBillsId), { id: catBillsId, name: 'Bills', icon: 'receipt', type: 'expense', color: '#EF4444' });
  await setDoc(doc(db, 'categories', catSalaryId), { id: catSalaryId, name: 'Salary', icon: 'briefcase', type: 'income', color: '#10B981' });
  await setDoc(doc(db, 'categories', catTransferId), { id: catTransferId, name: 'Transfer', icon: 'arrow-right-left', type: 'transfer', color: '#818CF8' });

  await setDoc(doc(db, 'transactions', 'tx_1'), {
    id: 'tx_1',
    accountId: account2,
    categoryId: catSalaryId,
    amount: 25000,
    type: 'income',
    note: 'Quincena Salary',
    date: now - 5 * 86400000 
  });
  
  await setDoc(doc(db, 'transactions', 'tx_2'), {
    id: 'tx_2',
    accountId: account1,
    categoryId: catFoodId,
    amount: 350,
    type: 'expense',
    note: 'Groceries',
    date: now - 2 * 86400000
  });
  
  await setDoc(doc(db, 'transactions', 'tx_3'), {
    id: 'tx_3',
    accountId: account3,
    categoryId: catTranspoId,
    amount: 50,
    type: 'expense',
    note: 'Jeepney',
    date: now - 86400000
  });

  await setDoc(doc(db, 'bills', 'bill_meralco'), {
    id: 'bill_meralco',
    name: 'Meralco',
    accountId: account1,
    amount: 1800,
    dueDay: new Date().getDate() + 3 > 30 ? 5 : new Date().getDate() + 3,
    status: 'upcoming'
  });

  await setDoc(doc(db, 'debts', 'debt_gcredit'), {
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

// Ensures the system Transfer category always exists
export async function ensureTransferCategory() {
  const ref = doc(db, 'categories', 'cat_transfer');
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      id: 'cat_transfer',
      name: 'Transfer',
      icon: 'arrow-right-left',
      type: 'transfer',
      color: '#818CF8'
    });
  }
}
