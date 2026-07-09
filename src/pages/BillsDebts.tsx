import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatDistanceToNow, isPast } from 'date-fns';
import { useAppStore } from '../store';
import DebtDetailsSheet from '../components/DebtDetailsSheet';
import BillDetailsSheet from '../components/BillDetailsSheet';

export default function BillsDebts() {
  const [activeTab, setActiveTab] = useState<'bills' | 'debts'>('bills');
  const currentHouseholdId = useAppStore((state) => state.currentHouseholdId);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const bills = useLiveQuery(() => db.bills.toArray());
  const debts = useLiveQuery(() => db.debts.toArray());
  const accounts = useLiveQuery(() => db.accounts.where('householdId').equals(currentHouseholdId).toArray(), [currentHouseholdId]);

  const handlePayBill = async (billId: string) => {
    const bill = await db.bills.get(billId);
    if (!bill) return;

    const account = await db.accounts.get(bill.accountId);
    if (!account) {
      alert('Associated payment account not found!');
      return;
    }

    if (account.balance < bill.amount) {
      alert(`Insufficient funds in ${account.name} (Balance: ₱${account.balance.toLocaleString()}) to pay ₱${bill.amount.toLocaleString()}!`);
      return;
    }

    const confirmPay = window.confirm(`Confirm payment of ₱${bill.amount.toLocaleString()} to ${bill.name} using ${account.name}?`);
    if (!confirmPay) return;

    await db.accounts.update(bill.accountId, { balance: account.balance - bill.amount });

    await db.transactions.add({
      id: `tx_${Date.now()}`,
      accountId: bill.accountId,
      categoryId: 'cat_bills',
      amount: bill.amount,
      type: 'expense',
      note: `Paid ${bill.name} Bill`,
      date: Date.now()
    });

    await db.bills.update(billId, {
      status: 'paid',
      lastPaidDate: Date.now(),
      timesRecurred: ((bill as any).timesRecurred || 0) + 1
    });
  };

  const handlePayDebt = async (debtId: string) => {
    const debt = await db.debts.get(debtId);
    if (!debt) return;

    if (!accounts || accounts.length === 0) {
      alert('No accounts available to pay from!');
      return;
    }

    const paymentAmount = Math.min(debt.installmentAmount, debt.remainingBalance);
    const account = accounts.find(a => a.balance >= paymentAmount) || accounts[0];

    if (account.balance < paymentAmount) {
      alert(`Insufficient funds in your accounts to make a ₱${paymentAmount.toLocaleString()} payment.`);
      return;
    }

    const confirmPay = window.confirm(`Pay ₱${paymentAmount.toLocaleString()} towards ${debt.name} using ${account.name}?`);
    if (!confirmPay) return;

    await db.accounts.update(account.id, { balance: account.balance - paymentAmount });

    const newRemaining = Math.max(0, debt.remainingBalance - paymentAmount);
    await db.debts.update(debtId, { remainingBalance: newRemaining });

    await db.transactions.add({
      id: `tx_${Date.now()}`,
      accountId: account.id,
      amount: paymentAmount,
      type: 'expense',
      note: `Debt Payment: ${debt.name}`,
      date: Date.now()
    });

    if (newRemaining === 0) {
      alert(`Congratulations! You have fully paid off your debt to ${debt.lender}!`);
    } else {
      alert(`Paid ₱${paymentAmount.toLocaleString()} to ${debt.lender}. Remaining balance is now ₱${newRemaining.toLocaleString()}.`);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24 h-full overflow-y-auto no-scrollbar">
      <header className="pt-1">
        <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.15em] mb-0.5">Obligations</p>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Bills & Debts</h1>
      </header>

      {/* Segmented Control */}
      <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl ring-1 ring-white/5">
        <button
          onClick={() => setActiveTab('bills')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl capitalize transition-all duration-300 ${
            activeTab === 'bills' 
              ? 'bg-zinc-800 shadow-md text-zinc-100 ring-1 ring-white/10' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Bills
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl capitalize transition-all duration-300 ${
            activeTab === 'debts' 
              ? 'bg-zinc-800 shadow-md text-zinc-100 ring-1 ring-white/10' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Debts
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'bills' && bills?.map(bill => {
          const isPaid = bill.status === 'paid';
          const isMonthly = !bill.dueType || bill.dueType === 'monthly';

          // Next due date label
          let dueLabel = '';
          if (isPaid) {
            dueLabel = 'Paid this cycle';
          } else if (isMonthly) {
            const due = new Date();
            due.setDate(bill.dueDay);
            if (isPast(due) && due.getDate() !== new Date().getDate()) {
              due.setMonth(due.getMonth() + 1);
            }
            dueLabel = `Due ${formatDistanceToNow(due, { addSuffix: true })}`;
          } else {
            // Specific dates — find next upcoming
            const now = Date.now();
            const upcoming = (bill.specificDates || []).filter(ts => ts >= now).sort((a, b) => a - b);
            if (upcoming.length > 0) {
              dueLabel = `Next: ${new Date(upcoming[0]).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`;
            } else {
              dueLabel = 'All dates passed';
            }
          }

          // Recurrence badge
          const recurrenceLabel = isMonthly
            ? `↻ Monthly · ${(bill as any).timesRecurred || 0}× paid`
            : `${(bill.specificDates || []).length} dates · ${(bill as any).timesRecurred || 0}× paid`;

          return (
            <div
              key={bill.id}
              onClick={() => setSelectedBillId(bill.id)}
              className="p-4 bg-zinc-900/60 rounded-2xl ring-1 ring-white/5 relative overflow-hidden active:scale-[0.99] transition-all duration-150 cursor-pointer"
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 mr-2 min-w-0">
                  <p className="font-bold text-zinc-100 text-base leading-tight truncate">{bill.name}</p>
                  <p className={`text-xs font-bold mt-0.5 truncate ${
                    isPaid ? 'text-emerald-500' : bill.status === 'overdue' ? 'text-rose-500' : 'text-zinc-400'
                  }`}>
                    {dueLabel}
                  </p>
                  <p className={`text-[10px] font-bold mt-1.5 uppercase tracking-wider ${
                    isMonthly ? 'text-amber-500/70' : 'text-indigo-500/70'
                  }`}>
                    {recurrenceLabel}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-lg text-zinc-100 tabular-nums">
                    <span className="text-[10px] font-bold opacity-60 mr-0.5">₱</span>
                    {bill.amount.toLocaleString()}
                  </p>
                  {!isPaid ? (
                    <button
                      onClick={e => { e.stopPropagation(); handlePayBill(bill.id); }}
                      className="text-[10px] uppercase tracking-wider font-black text-zinc-900 bg-zinc-200 px-3 py-1.5 rounded-full mt-2 active:scale-95 transition-transform"
                    >
                      Pay Now
                    </button>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full mt-2 inline-block">
                      Paid
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {activeTab === 'bills' && bills?.length === 0 && (
          <div className="p-10 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/30 rounded-[2rem] ring-1 ring-white/5 border-dashed border-zinc-800">
            <div className="w-16 h-16 mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center ring-1 ring-white/5">
              <i className="lucide lucide-file-text text-2xl text-zinc-400"></i>
            </div>
            <p className="font-bold tracking-wide">No bills added yet.</p>
          </div>
        )}

        {activeTab === 'debts' && debts?.map(debt => {
          const progress = ((debt.originalAmount - debt.remainingBalance) / debt.originalAmount) * 100;
          return (
            <div 
              key={debt.id} 
              onClick={() => setSelectedDebtId(debt.id)}
              className="p-4 bg-zinc-900/60 rounded-2xl ring-1 ring-white/5 space-y-3 active:scale-[0.99] transition-all duration-150 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="font-bold text-zinc-100 text-base truncate">{debt.name}</p>
                  <p className="text-[11px] font-bold text-zinc-500 mt-0.5 truncate">OWED TO <span className="text-zinc-300">{debt.lender}</span></p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-lg text-zinc-100 tabular-nums">
                    <span className="text-[10px] font-bold opacity-60 mr-0.5">₱</span>
                    {debt.remainingBalance.toLocaleString()}
                  </p>
                  {debt.remainingBalance > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePayDebt(debt.id);
                      }}
                      className="text-[10px] uppercase tracking-wider font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full mt-2 active:scale-95 transition-transform"
                    >
                      Pay ₱{Math.min(debt.installmentAmount, debt.remainingBalance).toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-zinc-500 text-right tracking-wider">
                  <span className="text-zinc-300">{progress.toFixed(0)}%</span> PAID
                </p>
              </div>
            </div>
          );
        })}

        {activeTab === 'debts' && debts?.length === 0 && (
          <div className="p-10 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/30 rounded-[2rem] ring-1 ring-white/5 border-dashed border-zinc-800">
            <div className="w-16 h-16 mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center ring-1 ring-white/5">
              <i className="lucide lucide-credit-card text-2xl text-zinc-400"></i>
            </div>
            <p className="font-bold tracking-wide">No debts added yet.</p>
          </div>
        )}
      </div>

      {/* Debt Detail Sheet */}
      <DebtDetailsSheet 
        debtId={selectedDebtId} 
        isOpen={selectedDebtId !== null} 
        onClose={() => setSelectedDebtId(null)} 
      />

      {/* Bill Detail Sheet */}
      <BillDetailsSheet
        billId={selectedBillId}
        isOpen={selectedBillId !== null}
        onClose={() => setSelectedBillId(null)}
      />
    </div>
  );
}
