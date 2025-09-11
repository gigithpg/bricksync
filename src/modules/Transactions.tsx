import { useState, useEffect, useContext } from 'react';
import { Table, Form, Button, Dropdown } from 'react-bootstrap';
import axios, { AxiosError } from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AppContext } from '@/contexts/AppContext.tsx';
import { formatDate, formatINR } from '@/utils/helpers.tsx';

interface Customer {
  CustomerID: string;
  CustomerName: string;
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

interface AppContextType {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  sales: Sale[];
  setSales: (sales: Sale[]) => void;
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
}

interface ApiResponse {
  data: Transaction[];
  total: number;
}

// Helper function to format numbers without currency symbols
const formatPlain = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return '-';
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

export default function Transactions() {
  console.log('[Transactions] Rendering Transactions component');
  const { transactions, setTransactions } = useContext(AppContext as React.Context<AppContextType>);
  const [sortField, setSortField] = useState<keyof Transaction>('Date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const itemsPerPage = 10;

  useEffect(() => {
    console.log('[Transactions] Fetching transactions from API');
    axios
      .get<ApiResponse>('http://localhost:3000/api/transactions', {
        params: { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage },
      })
      .then(response => {
        console.log('[Transactions] Fetched transactions raw data:', response.data);
        const fetchedTransactions = Array.isArray(response.data.data)
          ? response.data.data.map(transaction => {
              const formattedDate = transaction.Date;
              if (!formattedDate || !/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
                console.warn(
                  '[Transactions] Invalid or missing date for transaction:', 
                  transaction.TransactionID, 
                  'Raw Date:', 
                  transaction.Date, 
                  'Using current date as fallback'
                );
                return {
                  ...transaction,
                  Date: new Date().toISOString().split('T')[0], // Fallback for invalid dates
                };
              }
              console.log(
                '[Transactions] Transaction:', 
                transaction.TransactionID, 
                'Raw Date:', 
                transaction.Date, 
                'Formatted for State:', 
                formattedDate
              );
              return {
                ...transaction,
                Date: formattedDate, // Keep YYYY-MM-DD format as provided by API
              };
            })
          : [];
        setTransactions(fetchedTransactions);
        setTotalItems(response.data.total || 0);
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Transactions] Error fetching transactions:', error.message, error.response?.status, error.response?.data);
        setTransactions([]);
        setTotalItems(0);
      });
  }, [currentPage, setTransactions]);

  const handleSort = (field: keyof Transaction) => {
    console.log('[Transactions] Sorting by:', field);
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleExportPDF = () => {
    console.log('[Transactions] Exporting table as PDF');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFont('helvetica', 'normal');
    doc.text('Transactions Report', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Transaction ID', 'Type', 'Date', 'Customer', 'Quantity', 'Rate', 'Vehicle Rent', 'Amount', 'Payment Method', 'Payment Received', 'Remarks']],
      body: filteredTransactions.map(transaction => {
        console.log('[Transactions] PDF Export - PaymentReceived for', transaction.TransactionID, ':', transaction.PaymentReceived);
        return [
          transaction.TransactionID || '-',
          transaction.Type || (transaction.TransactionID?.startsWith('SALE') ? 'Sale' : transaction.TransactionID?.startsWith('PAY') ? 'Payment' : '-'),
          formatDate(transaction.Date) || '-',
          transaction.CustomerName || '-',
          transaction.Quantity || '-',
          transaction.Rate ? formatPlain(transaction.Rate) : '-',
          transaction.VehicleRent ? formatPlain(transaction.VehicleRent) : '-',
          transaction.Amount ? formatPlain(transaction.Amount) : '-',
          transaction.PaymentMethod || '-',
          transaction.PaymentReceived ? formatPlain(transaction.PaymentReceived) : '-',
          transaction.Remarks || '-',
        ];
      }),
      theme: 'striped',
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [100, 100, 100] },
    });
    doc.save(`transactions_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportExcel = () => {
    console.log('[Transactions] Exporting table as Excel');
    const wsData = [
      ['Transaction ID', 'Type', 'Date', 'Customer', 'Quantity', 'Rate', 'Vehicle Rent', 'Amount', 'Payment Method', 'Payment Received', 'Remarks'],
      ...filteredTransactions.map(transaction => {
        console.log('[Transactions] Excel Export - PaymentReceived for', transaction.TransactionID, ':', transaction.PaymentReceived);
        return [
          transaction.TransactionID || '-',
          transaction.Type || (transaction.TransactionID?.startsWith('SALE') ? 'Sale' : transaction.TransactionID?.startsWith('PAY') ? 'Payment' : '-'),
          formatDate(transaction.Date) || '-',
          transaction.CustomerName || '-',
          transaction.Quantity || '-',
          transaction.Rate ? formatINR(transaction.Rate) : '-',
          transaction.VehicleRent ? formatINR(transaction.VehicleRent) : '-',
          transaction.Amount ? formatINR(transaction.Amount) : '-',
          transaction.PaymentMethod || '-',
          transaction.PaymentReceived ? formatINR(transaction.PaymentReceived) : '-',
          transaction.Remarks || '-',
        ];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `transactions_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredTransactions = transactions
    .filter(t => t.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <>
      <h1>Transactions</h1>
      <div className="my-3 d-flex justify-content-between">
        <Form.Group className="my-3 w-50">
          <Form.Control
            type="text"
            placeholder="Search by customer name"
            value={searchTerm}
            onChange={handleSearch}
          />
        </Form.Group>
        <Dropdown>
          <Dropdown.Toggle variant="secondary" id="dropdown-export">
            Export
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={handleExportPDF}>Export as PDF</Dropdown.Item>
            <Dropdown.Item onClick={handleExportExcel}>Export as Excel</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <div className="table-responsive">
        <Table striped bordered hover style={{ tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('TransactionID')}>
                Transaction ID {sortField === 'TransactionID' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('Type')}>
                Type {sortField === 'Type' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('Date')}>
                Date {sortField === 'Date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('CustomerName')}>
                Customer {sortField === 'CustomerName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('Quantity')}>
                Quantity {sortField === 'Quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('Rate')}>
                Rate {sortField === 'Rate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('VehicleRent')}>
                Vehicle Rent {sortField === 'VehicleRent' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('Amount')}>
                Amount {sortField === 'Amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('PaymentMethod')}>
                Payment Method {sortField === 'PaymentMethod' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('PaymentReceived')}>
                Payment Received {sortField === 'PaymentReceived' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('Remarks')}>
                Remarks {sortField === 'Remarks' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(transaction => {
              console.log(
                '[Transactions] Rendering transaction:', 
                transaction.TransactionID, 
                'Display Date:', 
                formatDate(transaction.Date), 
                'PaymentReceived:', 
                transaction.PaymentReceived
              );
              return (
                <tr key={transaction.TransactionID}>
                  <td style={{ whiteSpace: 'nowrap' }}>{transaction.TransactionID || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{transaction.Type || (transaction.TransactionID?.startsWith('SALE') ? 'Sale' : transaction.TransactionID?.startsWith('PAY') ? 'Payment' : '-')}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(transaction.Date) || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{transaction.CustomerName || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{transaction.Quantity || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{transaction.Rate ? formatINR(transaction.Rate) : '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{transaction.VehicleRent ? formatINR(transaction.VehicleRent) : '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{transaction.Amount ? formatINR(transaction.Amount) : '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{transaction.PaymentMethod || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{transaction.PaymentReceived ? formatINR(transaction.PaymentReceived) : '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{transaction.Remarks || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <div className="my-3">
        <Button
          disabled={currentPage === 1}
          onClick={() => {
            console.log('[Transactions] Previous page');
            setCurrentPage(prev => prev - 1);
          }}
        >
          Previous
        </Button>
        <span className="mx-2">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          disabled={currentPage >= totalPages}
          onClick={() => {
            console.log('[Transactions] Next page');
            setCurrentPage(prev => prev + 1);
          }}
        >
          Next
        </Button>
      </div>
    </>
  );
}