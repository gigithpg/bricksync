import { useState, useEffect, useContext, useRef } from 'react';
import { Table, Button, Modal, Form, Alert, Dropdown } from 'react-bootstrap';
import axios, { AxiosError } from 'axios';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
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
  PaymentReceived: number | null;
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
  CustomerID: string;
  Date: string;
  Amount: number;
  Type: 'Sale' | 'Payment';
  CreatedAt: string;
  UpdatedAt?: string;
}

interface Balance {
  CustomerID: string;
  CustomerName: string;
  Balance: number;
}

interface FormState {
  CustomerID: string;
  Date: string;
  Quantity: string;
  Rate: string;
  VehicleRent: string;
  PaymentMethod: string;
  PaymentReceived: string;
  Remarks: string;
}

interface Errors {
  CustomerID?: string;
  Date?: string;
  Quantity?: string;
  Rate?: string;
  VehicleRent?: string;
  PaymentMethod?: string;
  PaymentReceived?: string;
  api?: string;
}

interface Touched {
  CustomerID: boolean;
  Date: boolean;
  Quantity: boolean;
  Rate: boolean;
  VehicleRent: boolean;
  PaymentMethod: boolean;
  PaymentReceived: boolean;
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
  balances: Balance[];
  setBalances: (balances: Balance[]) => void;
}

interface ApiResponse {
  data: Sale[];
  total: number;
}

const formatPlain = (value: number | null): string => {
  if (value == null || isNaN(value)) return '-';
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

export default function Sales() {
  console.log('[Sales] Rendering Sales component');
  const { customers, setCustomers, sales, setSales } = useContext(AppContext as React.Context<AppContextType>);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [form, setForm] = useState<FormState>({
    CustomerID: '',
    Date: new Date().toISOString().split('T')[0],
    Quantity: '',
    Rate: '',
    VehicleRent: '',
    PaymentMethod: 'Select Payment Method',
    PaymentReceived: '',
    Remarks: '',
  });
  const [amount, setAmount] = useState<number>(0);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({
    CustomerID: false,
    Date: false,
    Quantity: false,
    Rate: false,
    VehicleRent: false,
    PaymentMethod: false,
    PaymentReceived: false,
  });
  const [sortField, setSortField] = useState<keyof Sale>('Date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const itemsPerPage = 10;
  const customerSelectRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    console.log('[Sales] Fetching customers from API');
    axios
      .get<Customer[]>('http://localhost:3000/api/customers')
      .then(response => {
        console.log('[Sales] Fetched customers:', response.data);
        setCustomers(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Sales] Error fetching customers:', error.message, error.response?.status, error.response?.data);
        setErrors({ api: `Failed to fetch customers: ${error.response?.data?.error || error.message}` });
      });
  }, [setCustomers]);

  useEffect(() => {
    console.log('[Sales] Fetching sales from API');
    axios
      .get<ApiResponse>('http://localhost:3000/api/sales', {
        params: { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage },
      })
      .then(response => {
        console.log('[Sales] Fetched sales:', response.data);
        const fetchedSales = Array.isArray(response.data.data)
          ? response.data.data.map(sale => ({
              ...sale,
              Date: sale.Date.split('T')[0], // Ensure date is YYYY-MM-DD
            }))
          : [];
        setSales(fetchedSales);
        setTotalItems(response.data.total || 0);
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Sales] Error fetching sales:', error.message, error.response?.status, error.response?.data);
        setSales([]);
        setTotalItems(0);
        setErrors({ api: `Failed to fetch sales: ${error.response?.data?.error || error.message}` });
      });
  }, [currentPage, setSales]);

  useEffect(() => {
    const qty = Number(form.Quantity) || 0;
    const rate = Number(form.Rate) || 0;
    const rent = Number(form.VehicleRent) || 0;
    const isQuantityValid = form.Quantity && !isNaN(qty) && qty > 0 && Number.isInteger(qty);
    const isRateValid = form.Rate && !isNaN(rate) && rate > 0;
    const calculatedAmount = isQuantityValid && isRateValid ? Number((qty * rate + (form.VehicleRent && !isNaN(rent) && rent >= 0 ? rent : 0)).toFixed(2)) : 0;
    setAmount(calculatedAmount);

    const newErrors: Errors = {};
    if (touched.CustomerID && !form.CustomerID) {
      newErrors.CustomerID = 'Please select a customer';
    }
    if (touched.Date && !form.Date) {
      newErrors.Date = 'Please select a date';
    } else if (touched.Date && form.Date) {
      const selectedDate = new Date(form.Date);
      if (isNaN(selectedDate.getTime())) {
        newErrors.Date = 'Invalid date format';
      } else if (selectedDate > new Date()) {
        newErrors.Date = 'Future dates are not allowed';
      }
    }
    if (touched.Quantity && form.Quantity && (!form.Quantity || isNaN(qty) || qty <= 0 || !Number.isInteger(qty))) {
      newErrors.Quantity = 'Please enter a valid integer quantity greater than 0';
    }
    if (touched.Rate && form.Rate && (!form.Rate || isNaN(rate) || rate <= 0)) {
      newErrors.Rate = 'Please enter a valid rate greater than 0';
    }
    if (touched.VehicleRent && form.VehicleRent && (isNaN(rent) || rent < 0 || !Number.isInteger(rent))) {
      newErrors.VehicleRent = 'Please enter a valid integer vehicle rent (0 or greater)';
    }
    if (touched.PaymentMethod && form.PaymentMethod === 'Select Payment Method' && Number(form.PaymentReceived) > 0) {
      newErrors.PaymentMethod = 'Please select a valid payment method when payment is received';
    }
    if (touched.PaymentReceived && form.PaymentReceived && (isNaN(Number(form.PaymentReceived)) || Number(form.PaymentReceived) < 0 || !Number.isInteger(Number(form.PaymentReceived)))) {
      newErrors.PaymentReceived = 'Please enter a valid integer payment received (0 or greater)';
    }
    setErrors(newErrors);
    console.log('[Sales] Real-time validation errors:', newErrors);
  }, [form, touched]);

  const validateForm = (): boolean => {
    const newErrors: Errors = {};
    if (!form.CustomerID) newErrors.CustomerID = 'Please select a customer';
    if (!form.Date) {
      newErrors.Date = 'Please select a date';
    } else {
      const selectedDate = new Date(form.Date);
      if (isNaN(selectedDate.getTime())) {
        newErrors.Date = 'Invalid date format';
      } else if (selectedDate > new Date()) {
        newErrors.Date = 'Future dates are not allowed';
      }
    }
    const qty = Number(form.Quantity);
    if (!form.Quantity || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      newErrors.Quantity = 'Please enter a valid integer quantity greater than 0';
    }
    const rate = Number(form.Rate);
    if (!form.Rate || isNaN(rate) || rate <= 0) {
      newErrors.Rate = 'Please enter a valid rate greater than 0';
    }
    const rent = Number(form.VehicleRent);
    if (form.VehicleRent && (isNaN(rent) || rent < 0 || !Number.isInteger(rent))) {
      newErrors.VehicleRent = 'Please enter a valid integer vehicle rent (0 or greater)';
    }
    const paymentReceived = Number(form.PaymentReceived);
    if (form.PaymentReceived && (isNaN(paymentReceived) || paymentReceived < 0 || !Number.isInteger(paymentReceived))) {
      newErrors.PaymentReceived = 'Please enter a valid integer payment received (0 or greater)';
    }
    if (paymentReceived > 0 && form.PaymentMethod === 'Select Payment Method') {
      newErrors.PaymentMethod = 'Please select a valid payment method when payment is received';
    }
    setErrors(newErrors);
    console.log('[Sales] Validation errors:', newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSale = async () => {
    console.log('[Sales] Saving sale', 'Form state:', form);
    if (!validateForm()) {
      console.log('[Sales] Form validation failed');
      return;
    }
    try {
      console.log('[Sales] Using form.Date:', form.Date);
      const vehicleRent = form.VehicleRent ? parseInt(form.VehicleRent, 10) : null;
      console.log('[Sales] Raw VehicleRent input:', form.VehicleRent);
      const paymentReceived = form.PaymentReceived ? parseInt(form.PaymentReceived, 10) : null;
      console.log('[Sales] Raw PaymentReceived input:', form.PaymentReceived);
      const data = {
        Date: form.Date, // Use Date instead of transactionDate
        CustomerID: form.CustomerID,
        Quantity: parseInt(form.Quantity, 10),
        Rate: parseFloat(form.Rate),
        VehicleRent: vehicleRent,
        Amount: amount,
        PaymentMethod: form.PaymentMethod !== 'Select Payment Method' ? form.PaymentMethod : null,
        PaymentReceived: paymentReceived,
        Remarks: form.Remarks || null,
      };
      console.log('[Sales] Sending payload:', data);
      const url = editingSale ? `/api/sales/${editingSale.SaleID}` : '/api/sales';
      const method = editingSale ? 'put' : 'post';
      const response = await axios[method]<Sale>(`http://localhost:3000${url}`, data);
      console.log('[Sales] Sale saved with date:', response.data.Date);
      setSales(prev => {
        const customerName = customers.find(c => c.CustomerID === form.CustomerID)?.CustomerName || '';
        if (editingSale) {
          return prev.map(s => (s.SaleID === editingSale.SaleID ? { ...data, SaleID: editingSale.SaleID, CustomerName: customerName, CreatedAt: response.data.CreatedAt, UpdatedAt: response.data.UpdatedAt } : s));
        }
        return [{ ...data, SaleID: response.data.SaleID, CustomerName: customerName, CreatedAt: response.data.CreatedAt }, ...prev];
      });
      setShowModal(false);
      setEditingSale(null);
      setForm({
        CustomerID: '',
        Date: new Date().toISOString().split('T')[0],
        Quantity: '',
        Rate: '',
        VehicleRent: '',
        PaymentMethod: 'Select Payment Method',
        PaymentReceived: '',
        Remarks: '',
      });
      setTouched({
        CustomerID: false,
        Date: false,
        Quantity: false,
        Rate: false,
        VehicleRent: false,
        PaymentMethod: false,
        PaymentReceived: false,
      });
      setTotalItems(prev => prev + (editingSale ? 0 : 1));
      setErrors({});
    } catch (error: AxiosError<{ error?: string }>) {
      console.error('[Sales] Error saving sale:', error.message, error.response?.status, error.response?.data);
      setErrors({ api: `Failed to save sale: ${error.response?.data?.error || error.message}` });
    }
  };

  const handleEditSale = (sale: Sale) => {
    console.log('[Sales] Editing sale:', sale.SaleID);
    setEditingSale(sale);
    setForm({
      CustomerID: sale.CustomerID || '',
      Date: sale.Date.split('T')[0] || new Date().toISOString().split('T')[0],
      Quantity: sale.Quantity?.toString() || '',
      Rate: sale.Rate?.toString() || '',
      VehicleRent: sale.VehicleRent?.toString() || '',
      PaymentMethod: sale.PaymentMethod || 'Select Payment Method',
      PaymentReceived: sale.PaymentReceived?.toString() || '',
      Remarks: sale.Remarks || '',
    });
    setTouched({
      CustomerID: true,
      Date: true,
      Quantity: true,
      Rate: true,
      VehicleRent: !!sale.VehicleRent,
      PaymentMethod: !!sale.PaymentMethod,
      PaymentReceived: !!sale.PaymentReceived,
    });
    setShowModal(true);
    setErrors({});
  };

  const handleDeleteSale = (sale: Sale) => {
    console.log('[Sales] Opening delete modal for sale:', sale.SaleID);
    setEditingSale(sale);
    setShowDeleteModal(true);
  };

  const confirmDeleteSale = async () => {
    if (!editingSale) return;
    console.log('[Sales] Deleting sale:', editingSale.SaleID);
    try {
      await axios.delete<{ message: string }>(`http://localhost:3000/api/sales/${editingSale.SaleID}`);
      console.log('[Sales] Sale deleted:', editingSale.SaleID);
      setSales(prev => prev.filter(s => s.SaleID !== editingSale.SaleID));
      setTotalItems(prev => prev - 1);
      setShowDeleteModal(false);
      setEditingSale(null);
    } catch (error: AxiosError<{ error?: string }>) {
      console.error('[Sales] Error deleting sale:', error.message, error.response?.status, error.response?.data);
      setErrors({ api: `Failed to delete sale: ${error.response?.data?.error || error.message}` });
    }
  };

  const filteredSales = sales
    .filter(s => s.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const isQuantityValid = form.Quantity && !isNaN(Number(form.Quantity)) && Number(form.Quantity) > 0 && Number.isInteger(Number(form.Quantity));
  const isRateValid = form.Rate && !isNaN(Number(form.Rate)) && Number(form.Rate) > 0;

  return (
    <>
      <h1>Sales</h1>
      <div className="my-3 d-flex justify-content-between">
        <Button
          variant="primary"
          onClick={() => {
            setEditingSale(null);
            setForm({
              CustomerID: '',
              Date: new Date().toISOString().split('T')[0],
              Quantity: '',
              Rate: '',
              VehicleRent: '',
              PaymentMethod: 'Select Payment Method',
              PaymentReceived: '',
              Remarks: '',
            });
            setTouched({
              CustomerID: false,
              Date: false,
              Quantity: false,
              Rate: false,
              VehicleRent: false,
              PaymentMethod: false,
              PaymentReceived: false,
            });
            setErrors({});
            setShowModal(true);
          }}
        >
          Add Sale
        </Button>
        <Dropdown>
          <Dropdown.Toggle variant="secondary" id="dropdown-export">
            Export
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => {
              console.log('[Sales] Exporting table as PDF');
              const doc = new jsPDF({ orientation: 'landscape' });
              doc.setFont('helvetica', 'normal');
              doc.text('Sales Report', 14, 20);
              autoTable(doc, {
                startY: 30,
                head: [['Sale ID', 'Date', 'Customer', 'Quantity', 'Rate', 'Vehicle Rent', 'Amount', 'Payment Method', 'Payment Received', 'Remarks']],
                body: filteredSales.map(sale => [
                  sale.SaleID,
                  formatDate(sale.Date),
                  sale.CustomerName || '-',
                  sale.Quantity || '-',
                  sale.Rate ? formatPlain(sale.Rate) : '-',
                  sale.VehicleRent ? formatPlain(sale.VehicleRent) : '-',
                  sale.Amount ? formatPlain(sale.Amount) : '-',
                  sale.PaymentMethod || '-',
                  sale.PaymentReceived ? formatPlain(sale.PaymentReceived) : '-',
                  sale.Remarks || '-',
                ]),
                theme: 'striped',
                styles: { font: 'helvetica', fontSize: 10 },
                headStyles: { fillColor: [100, 100, 100] },
              });
              doc.save(`sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
            }}>
              Export as PDF
            </Dropdown.Item>
            <Dropdown.Item onClick={() => {
              console.log('[Sales] Exporting table as Excel');
              const wsData = [
                ['Sale ID', 'Date', 'Customer', 'Quantity', 'Rate', 'Vehicle Rent', 'Amount', 'Payment Method', 'Payment Received', 'Remarks'],
                ...filteredSales.map(sale => [
                  sale.SaleID,
                  formatDate(sale.Date),
                  sale.CustomerName || '-',
                  sale.Quantity || '-',
                  sale.Rate ? formatINR(sale.Rate) : '-',
                  sale.VehicleRent ? formatINR(sale.VehicleRent) : '-',
                  sale.Amount ? formatINR(sale.Amount) : '-',
                  sale.PaymentMethod || '-',
                  sale.PaymentReceived ? formatINR(sale.PaymentReceived) : '-',
                  sale.Remarks || '-',
                ]),
              ];
              const ws = XLSX.utils.aoa_to_sheet(wsData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Sales');
              XLSX.writeFile(wb, `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);
            }}>
              Export as Excel
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <Form.Group className="my-3">
        <Form.Control
          type="text"
          placeholder="Search by customer name"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </Form.Group>
      {errors.api && <Alert variant="danger">{errors.api}</Alert>}
      <div className="table-responsive my-3">
        <Table striped bordered hover style={{ tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Sales] Sorting by SaleID');
                const order = sortField === 'SaleID' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('SaleID');
                setSortOrder(order);
              }}>
                Sale ID {sortField === 'SaleID' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Sales] Sorting by Date');
                const order = sortField === 'Date' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('Date');
                setSortOrder(order);
              }}>
                Date {sortField === 'Date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Sales] Sorting by CustomerName');
                const order = sortField === 'CustomerName' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('CustomerName');
                setSortOrder(order);
              }}>
                Customer {sortField === 'CustomerName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Sales] Sorting by Quantity');
                const order = sortField === 'Quantity' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('Quantity');
                setSortOrder(order);
              }}>
                Quantity {sortField === 'Quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Sales] Sorting by Rate');
                const order = sortField === 'Rate' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('Rate');
                setSortOrder(order);
              }}>
                Rate {sortField === 'Rate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Sales] Sorting by VehicleRent');
                const order = sortField === 'VehicleRent' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('VehicleRent');
                setSortOrder(order);
              }}>
                Vehicle Rent {sortField === 'VehicleRent' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Sales] Sorting by Amount');
                const order = sortField === 'Amount' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('Amount');
                setSortOrder(order);
              }}>
                Amount {sortField === 'Amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Sales] Sorting by PaymentMethod');
                const order = sortField === 'PaymentMethod' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('PaymentMethod');
                setSortOrder(order);
              }}>
                Payment Method {sortField === 'PaymentMethod' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Sales] Sorting by PaymentReceived');
                const order = sortField === 'PaymentReceived' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('PaymentReceived');
                setSortOrder(order);
              }}>
                Payment Received {sortField === 'PaymentReceived' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Sales] Sorting by Remarks');
                const order = sortField === 'Remarks' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('Remarks');
                setSortOrder(order);
              }}>
                Remarks {sortField === 'Remarks' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => (
              <tr key={sale.SaleID}>
                <td style={{ whiteSpace: 'nowrap' }}>{sale.SaleID}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDate(sale.Date)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{sale.CustomerName || '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{sale.Quantity || '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{sale.Rate ? formatINR(sale.Rate) : '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{sale.VehicleRent ? formatINR(sale.VehicleRent) : '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{sale.Amount ? formatINR(sale.Amount) : '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{sale.PaymentMethod || '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{sale.PaymentReceived ? formatINR(sale.PaymentReceived) : '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{sale.Remarks || '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <Button variant="warning" size="sm" onClick={() => handleEditSale(sale)} className="me-2">
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteSale(sale)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="my-3">
        <Button
          disabled={currentPage === 1}
          onClick={() => {
            console.log('[Sales] Previous page');
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
            console.log('[Sales] Next page');
            setCurrentPage(prev => prev + 1);
          }}
        >
          Next
        </Button>
      </div>
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setForm({
            CustomerID: '',
            Date: new Date().toISOString().split('T')[0],
            Quantity: '',
            Rate: '',
            VehicleRent: '',
            PaymentMethod: 'Select Payment Method',
            PaymentReceived: '',
            Remarks: '',
          });
          setTouched({
            CustomerID: false,
            Date: false,
            Quantity: false,
            Rate: false,
            VehicleRent: false,
            PaymentMethod: false,
            PaymentReceived: false,
          });
          setErrors({});
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingSale ? 'Edit Sale' : 'Add Sale'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={e => e.preventDefault()}>
            <Form.Group className="mb-3">
              <Form.Label>Customer</Form.Label>
              <Form.Select
                value={form.CustomerID}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const value = e.target.value;
                  console.log('[Sales] CustomerID changed to:', value);
                  setForm({ ...form, CustomerID: value });
                  setTouched({ ...touched, CustomerID: !!value });
                  if (value) setErrors(prev => ({ ...prev, CustomerID: undefined }));
                }}
                isInvalid={!!errors.CustomerID}
                ref={customerSelectRef}
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.CustomerID} value={customer.CustomerID}>
                    {customer.CustomerName}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.CustomerID}</Form.Control.Feedback>
              <Form.Text>{touched.CustomerID && form.CustomerID && !errors.CustomerID ? 'Valid customer' : ''}</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Flatpickr
                value={form.Date ? new Date(form.Date) : undefined}
                onChange={([date]: Date[]) => {
                  if (date) {
                    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                    console.log('[Sales] Flatpickr selected date:', date.toISOString(), 'Formatted:', formattedDate);
                    setForm({ ...form, Date: formattedDate });
                    setTouched({ ...touched, Date: true });
                  }
                }}
                options={{
                  dateFormat: 'Y-m-d',
                  maxDate: new Date(),
                  timeZone: 'Asia/Kolkata',
                }}
                className={`form-control ${errors.Date ? 'is-invalid' : ''}`}
              />
              <Form.Control.Feedback type="invalid">{errors.Date}</Form.Control.Feedback>
              <Form.Text>{touched.Date && form.Date && !errors.Date ? 'Valid date' : ''}</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                value={form.Quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  if (value === '' || /^[0-9]*$/.test(value)) {
                    setForm({ ...form, Quantity: value });
                    setTouched({ ...touched, Quantity: true });
                  }
                }}
                onBlur={() => {
                  if (form.Quantity) {
                    const cleanedValue = Math.floor(Number(form.Quantity)).toString();
                    setForm({ ...form, Quantity: cleanedValue });
                  }
                }}
                placeholder="Enter quantity"
                min="1"
                step="1"
                isInvalid={!!errors.Quantity}
              />
              <Form.Control.Feedback type="invalid">{errors.Quantity}</Form.Control.Feedback>
              <Form.Text>{touched.Quantity && form.Quantity && !errors.Quantity ? `Valid quantity: ${form.Quantity}` : ''}</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rate</Form.Label>
              <Form.Control
                type="number"
                value={form.Rate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                    setForm({ ...form, Rate: value });
                    setTouched({ ...touched, Rate: true });
                  }
                }}
                onBlur={() => {
                  if (form.Rate) {
                    setForm({ ...form, Rate: parseFloat(form.Rate).toString() });
                  }
                }}
                placeholder="Enter rate"
                min="0.01"
                step="0.01"
                isInvalid={!!errors.Rate}
                disabled={!isQuantityValid}
              />
              <Form.Control.Feedback type="invalid">{errors.Rate}</Form.Control.Feedback>
              <Form.Text>{touched.Rate && form.Rate && !errors.Rate ? `Valid rate: ${formatINR(Number(form.Rate))}` : ''}</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Vehicle Rent</Form.Label>
              <Form.Control
                type="number"
                value={form.VehicleRent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  console.log('[Sales] Raw VehicleRent input:', value);
                  if (value === '' || /^[0-9]*$/.test(value)) {
                    setForm({ ...form, VehicleRent: value });
                    setTouched({ ...touched, VehicleRent: true });
                  }
                }}
                onBlur={() => {
                  if (form.VehicleRent) {
                    const value = form.VehicleRent;
                    console.log('[Sales] VehicleRent onBlur:', value);
                    setForm({ ...form, VehicleRent: value });
                  }
                }}
                placeholder="Enter vehicle rent"
                min="0"
                step="1"
                isInvalid={!!errors.VehicleRent}
                disabled={!isQuantityValid || !isRateValid}
              />
              <Form.Control.Feedback type="invalid">{errors.VehicleRent}</Form.Control.Feedback>
              <Form.Text>{touched.VehicleRent && form.VehicleRent && !errors.VehicleRent ? `Valid vehicle rent: ${formatINR(Number(form.VehicleRent))}` : ''}</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="text"
                value={isQuantityValid && isRateValid ? formatINR(amount) : '₹0'}
                readOnly
              />
              <Form.Text>{isQuantityValid && isRateValid ? `Calculated: Quantity × Rate + Vehicle Rent = ${formatINR(amount)}` : 'Enter valid quantity and rate to calculate amount'}</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Method</Form.Label>
              <Form.Select
                value={form.PaymentMethod}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const method = e.target.value;
                  setForm({
                    ...form,
                    PaymentMethod: method,
                    PaymentReceived: method === 'Select Payment Method' ? '' : form.PaymentReceived,
                  });
                  setTouched({ ...touched, PaymentMethod: true });
                  if (method !== 'Select Payment Method') setErrors(prev => ({ ...prev, PaymentMethod: undefined }));
                }}
                isInvalid={!!errors.PaymentMethod}
              >
                <option value="Select Payment Method">Select Payment Method</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="Others">Others</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.PaymentMethod}</Form.Control.Feedback>
              <Form.Text>{touched.PaymentMethod && form.PaymentMethod !== 'Select Payment Method' && !errors.PaymentMethod ? 'Valid payment method' : ''}</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Received</Form.Label>
              <Form.Control
                type="number"
                value={form.PaymentReceived}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  console.log('[Sales] Raw PaymentReceived input:', value);
                  if (value === '' || /^[0-9]*$/.test(value)) {
                    setForm({ ...form, PaymentReceived: value });
                    setTouched({ ...touched, PaymentReceived: true });
                  }
                }}
                onBlur={() => {
                  if (form.PaymentReceived) {
                    const value = form.PaymentReceived;
                    console.log('[Sales] PaymentReceived onBlur:', value);
                    setForm({ ...form, PaymentReceived: value });
                  }
                }}
                placeholder={form.PaymentMethod === 'Select Payment Method' ? '0' : 'Enter payment received'}
                min="0"
                step="1"
                disabled={form.PaymentMethod === 'Select Payment Method'}
                isInvalid={!!errors.PaymentReceived}
              />
              <Form.Control.Feedback type="invalid">{errors.PaymentReceived}</Form.Control.Feedback>
              <Form.Text>
                {touched.PaymentReceived && form.PaymentReceived && !errors.PaymentReceived ? `Valid payment: ${formatINR(Number(form.PaymentReceived))}` : ''}
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                type="text"
                value={form.Remarks}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, Remarks: e.target.value })}
                placeholder="Enter remarks"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false);
              setForm({
                CustomerID: '',
                Date: new Date().toISOString().split('T')[0],
                Quantity: '',
                Rate: '',
                VehicleRent: '',
                PaymentMethod: 'Select Payment Method',
                PaymentReceived: '',
                Remarks: '',
              });
              setTouched({
                CustomerID: false,
                Date: false,
                Quantity: false,
                Rate: false,
                VehicleRent: false,
                PaymentMethod: false,
                PaymentReceived: false,
              });
              setErrors({});
            }}
          >
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveSale}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete sale {editingSale?.SaleID}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteSale}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}