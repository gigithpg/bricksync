import { createContext, useState, ReactNode } from 'react';

interface Customer {
  CustomerID: string;
  CustomerName: string;
  CreatedAt: string;
  UpdatedAt?: string;
}

interface Sale {
  SaleID: string;
  CustomerID: string;
  CustomerName: string;
  Date: string;
  Quantity: number;
  Rate: number;
  VehicleRent: number | null;
  Amount: number;
  PaymentMethod: string | null;
  PaymentReceived: number;
  Remarks: string | null;
  CreatedAt: string;
  UpdatedAt?: string;
}

interface Payment {
  PaymentID: string;
  CustomerID: string;
  CustomerName: string;
  Date: string;
  PaymentReceived: number;
  PaymentMethod: string;
  Remarks: string | null;
  CreatedAt: string;
  UpdatedAt?: string;
}

interface Transaction {
  TransactionID: string;
  Type: string;
  Date: string;
  CustomerName: string;
  Quantity?: number;
  Rate?: number;
  VehicleRent?: number;
  Amount?: number;
  PaymentMethod?: string;
  PaymentReceived?: number;
  Remarks?: string;
}

interface Balance {
  CustomerID: string;
  CustomerName: string;
  TotalSales: number;
  TotalPayments: number;
  PendingBalance: number;
}

interface AppContextType {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  sales: Sale[];
  setSales: (sales: Sale[]) => void;
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  balances: Balance[];
  setBalances: (balances: Balance[]) => void;
  formatDateTime: (dateInput: string | Date) => string;
  formatINRPlain: (amount: number) => string;
}

export const AppContext = createContext<AppContextType>({
  customers: [],
  setCustomers: () => {},
  sales: [],
  setSales: () => {},
  payments: [],
  setPayments: () => {},
  transactions: [],
  setTransactions: () => {},
  balances: [],
  setBalances: () => {},
  formatDateTime: () => '',
  formatINRPlain: () => '',
});

interface AppProviderProps {
  children: ReactNode;
}

export default function AppProvider({ children }: AppProviderProps) {
  console.log('[AppProvider] Rendering AppProvider');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);

  const formatDateTime = (dateInput: string | Date): string => {
    if (!dateInput) return '-';
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(date.getTime())) {
        console.error('[AppContext] Invalid date input:', dateInput);
        return 'Invalid Date';
      }
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('[AppContext] Error formatting date:', dateInput, error);
      return 'Invalid Date';
    }
  };

  const formatINRPlain = (amount: number): string => {
    if (isNaN(amount)) return '0';
    try {
      return amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } catch (error) {
      console.error('[AppContext] Error formatting INR:', amount, error);
      return amount.toString();
    }
  };

  console.log('[AppProvider] State:', { customers, sales, payments, transactions, balances });

  return (
    <AppContext.Provider
      value={{
        customers,
        setCustomers,
        sales,
        setSales,
        payments,
        setPayments,
        transactions,
        setTransactions,
        balances,
        setBalances,
        formatDateTime,
        formatINRPlain,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}