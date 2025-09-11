interface Sale {
    CustomerID: string;
    CustomerName: string;
    Date: string;
    Quantity: number;
    Rate: number;
    VehicleRent: number;
    Amount: number;
    Remarks: string;
    CreatedAt: string;
    UpdatedAt?: string;
  }

  interface Payment {
    CustomerID: string;
    CustomerName: string;
    Date: string;
    Amount: number;
    PaymentMethod: string;
    Remarks: string;
    CreatedAt: string;
    UpdatedAt?: string;
  }

  // utils/helpers.tsx
export const formatDate = (date: string | Date): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date.replace(/-/g, '/')) : date;
  if (isNaN(d.getTime())) return '-';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

  // helpers.tsx
export function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    console.error('[helpers] Invalid date input:', dateInput);
    return 'Invalid Date';
  }
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

  export const formatINR = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '-';
    const formattedValue = Number.isInteger(value) ? Math.floor(value) : Number(value.toFixed(2));
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(formattedValue);
  };

  export const formatINRPlain = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '-';
    const formattedValue = Number.isInteger(value) ? Math.floor(value) : Number(value.toFixed(2));
    return `INR ${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(formattedValue)}`;
  };

  export function capitalizeName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/(^|\s)\w/g, letter => letter.toUpperCase());
  }

  export function canDeleteCustomer(
    customerID: string,
    sales: Sale[],
    payments: Payment[],
  ): { canDelete: boolean; message: string } {
    const hasSales = sales.some(s => s.CustomerID === customerID);
    const hasPayments = payments.some(p => p.CustomerID === customerID);

    if (hasSales && hasPayments) {
      return {
        canDelete: false,
        message: 'Cannot delete customer with associated sales and payments.',
      };
    } else if (hasSales) {
      return {
        canDelete: false,
        message: 'Cannot delete customer with associated sales.',
      };
    } else if (hasPayments) {
      return {
        canDelete: false,
        message: 'Cannot delete customer with associated payments.',
      };
    }
    return { canDelete: true, message: 'Customer can be deleted.' };
  }