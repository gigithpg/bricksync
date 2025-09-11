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

// Add formatPlain function
const formatPlain = (value: number | null): string => {
  if (value == null || isNaN(value)) return '-';
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

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
  PaymentReceived: number | null;
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
  PaymentMethod: string;
  PaymentReceived: string;
  Remarks: string;
}

interface Errors {
  CustomerID?: string;
  Date?: string;
  PaymentMethod?: string;
  PaymentReceived?: string;
  api?: string;
}

interface Touched {
  CustomerID: boolean;
  Date: boolean;
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
  data: Payment[];
  total: number;
}

export default function Payments() {
  console.log('[Payments] Rendering Payments component');
  const { customers, setCustomers, payments, setPayments } = useContext(AppContext as React.Context<AppContextType>);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [form, setForm] = useState<FormState>({
    CustomerID: '',
    Date: new Date().toISOString().split('T')[0],
    PaymentMethod: 'Select Payment Method',
    PaymentReceived: '',
    Remarks: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({
    CustomerID: false,
    Date: false,
    PaymentMethod: false,
    PaymentReceived: false,
  });
  const [sortField, setSortField] = useState<keyof Payment>('Date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const itemsPerPage = 10;
  const customerSelectRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    console.log('[Payments] Fetching customers from API');
    axios
      .get<Customer[]>('http://localhost:3000/api/customers')
      .then(response => {
        console.log('[Payments] Fetched customers:', response.data);
        setCustomers(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Payments] Error fetching customers:', error.message, error.response?.status, error.response?.data);
        setErrors({ api: `Failed to fetch customers: ${error.response?.data?.error || error.message}` });
      });
  }, [setCustomers]);

  useEffect(() => {
    console.log('[Payments] Fetching payments from API');
    axios
      .get<ApiResponse>('http://localhost:3000/api/payments', {
        params: { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage },
      })
      .then(response => {
        console.log('[Payments] Fetched payments:', response.data);
        const fetchedPayments = Array.isArray(response.data.data)
          ? response.data.data.map(payment => ({
              ...payment,
              Date: payment.Date.split('T')[0], // Ensure date is YYYY-MM-DD
            }))
          : [];
        setPayments(fetchedPayments);
        setTotalItems(response.data.total || 0);
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Payments] Error fetching payments:', error.message, error.response?.status, error.response?.data);
        setPayments([]);
        setTotalItems(0);
        setErrors({ api: `Failed to fetch payments: ${error.response?.data?.error || error.message}` });
      });
  }, [currentPage, setPayments]);

  useEffect(() => {
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
    if (touched.PaymentMethod && form.PaymentMethod === 'Select Payment Method') {
      newErrors.PaymentMethod = 'Please select a valid payment method';
    }
    if (touched.PaymentReceived && form.PaymentReceived && (isNaN(Number(form.PaymentReceived)) || Number(form.PaymentReceived) <= 0 || !Number.isInteger(Number(form.PaymentReceived)))) {
      newErrors.PaymentReceived = 'Please enter a valid integer payment amount greater than 0';
    }
    setErrors(newErrors);
    console.log('[Payments] Real-time validation errors:', newErrors);
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
    if (form.PaymentMethod === 'Select Payment Method') {
      newErrors.PaymentMethod = 'Please select a valid payment method';
    }
    const paymentReceived = Number(form.PaymentReceived);
    if (!form.PaymentReceived || isNaN(paymentReceived) || paymentReceived <= 0 || !Number.isInteger(paymentReceived)) {
      newErrors.PaymentReceived = 'Please enter a valid integer payment amount greater than 0';
    }
    setErrors(newErrors);
    console.log('[Payments] Validation errors:', newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePayment = async () => {
    console.log('[Payments] Saving payment', 'Form state:', form);
    if (!validateForm()) {
      console.log('[Payments] Form validation failed');
      return;
    }
    try {
      console.log('[Payments] Using form.Date:', form.Date);
      const paymentReceived = parseInt(form.PaymentReceived, 10);
      console.log('[Payments] Raw PaymentReceived input:', form.PaymentReceived, 'Parsed:', paymentReceived);
      const data = {
        Date: form.Date, // Use Date instead of transactionDate
        CustomerID: form.CustomerID,
        PaymentReceived: paymentReceived,
        PaymentMethod: form.PaymentMethod,
        Remarks: form.Remarks || null,
      };
      console.log('[Payments] Sending payload:', data);
      const url = editingPayment ? `/api/payments/${editingPayment.PaymentID}` : '/api/payments';
      const method = editingPayment ? 'put' : 'post';
      const response = await axios[method]<Payment>(`http://localhost:3000${url}`, data);
      console.log('[Payments] Payment saved with date:', response.data.Date);
      setPayments(prev => {
        const customerName = customers.find(c => c.CustomerID === form.CustomerID)?.CustomerName || '';
        if (editingPayment) {
          return prev.map(p => (p.PaymentID === editingPayment.PaymentID ? { ...data, PaymentID: editingPayment.PaymentID, CustomerName: customerName, CreatedAt: response.data.CreatedAt, UpdatedAt: response.data.UpdatedAt } : p));
        }
        return [{ ...data, PaymentID: response.data.PaymentID, CustomerName: customerName, CreatedAt: response.data.CreatedAt }, ...prev];
      });
      setShowModal(false);
      setEditingPayment(null);
      setForm({
        CustomerID: '',
        Date: new Date().toISOString().split('T')[0],
        PaymentMethod: 'Select Payment Method',
        PaymentReceived: '',
        Remarks: '',
      });
      setTouched({
        CustomerID: false,
        Date: false,
        PaymentMethod: false,
        PaymentReceived: false,
      });
      setTotalItems(prev => prev + (editingPayment ? 0 : 1));
      setErrors({});
    } catch (error: AxiosError<{ error?: string }>) {
      console.error('[Payments] Error saving payment:', error.message, error.response?.status, error.response?.data);
      setErrors({ api: `Failed to save payment: ${error.response?.data?.error || error.message}` });
    }
  };

  const handleEditPayment = (payment: Payment) => {
    console.log('[Payments] Editing payment:', payment.PaymentID);
    setEditingPayment(payment);
    setForm({
      CustomerID: payment.CustomerID || '',
      Date: payment.Date.split('T')[0] || new Date().toISOString().split('T')[0],
      PaymentMethod: payment.PaymentMethod || 'Select Payment Method',
      PaymentReceived: payment.PaymentReceived.toString() || '',
      Remarks: payment.Remarks || '',
    });
    setTouched({
      CustomerID: true,
      Date: true,
      PaymentMethod: true,
      PaymentReceived: true,
    });
    setShowModal(true);
    setErrors({});
  };

  const handleDeletePayment = (payment: Payment) => {
    console.log('[Payments] Opening delete modal for payment:', payment.PaymentID);
    setEditingPayment(payment);
    setShowDeleteModal(true);
  };

  const confirmDeletePayment = async () => {
    if (!editingPayment) return;
    console.log('[Payments] Deleting payment:', editingPayment.PaymentID);
    try {
      await axios.delete<{ message: string }>(`http://localhost:3000/api/payments/${editingPayment.PaymentID}`);
      console.log('[Payments] Payment deleted:', editingPayment.PaymentID);
      setPayments(prev => prev.filter(p => p.PaymentID !== editingPayment.PaymentID));
      setTotalItems(prev => prev - 1);
      setShowDeleteModal(false);
      setEditingPayment(null);
    } catch (error: AxiosError<{ error?: string }>) {
      console.error('[Payments] Error deleting payment:', error.message, error.response?.status, error.response?.data);
      setErrors({ api: `Failed to delete payment: ${error.response?.data?.error || error.message}` });
    }
  };

  const filteredPayments = payments
    .filter(p => p.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()))
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
      <h1>Payments</h1>
      <div className="my-3 d-flex justify-content-between">
        <Button
          variant="primary"
          onClick={() => {
            setEditingPayment(null);
            setForm({
              CustomerID: '',
              Date: new Date().toISOString().split('T')[0],
              PaymentMethod: 'Select Payment Method',
              PaymentReceived: '',
              Remarks: '',
            });
            setTouched({
              CustomerID: false,
              Date: false,
              PaymentMethod: false,
              PaymentReceived: false,
            });
            setErrors({});
            setShowModal(true);
          }}
        >
          Add Payment
        </Button>
        <Dropdown>
          <Dropdown.Toggle variant="secondary" id="dropdown-export">
            Export
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => {
              console.log('[Payments] Exporting table as PDF');
              const doc = new jsPDF({ orientation: 'landscape' });
              doc.setFont('helvetica', 'normal');
              doc.text('Payments Report', 14, 20);
              autoTable(doc, {
                startY: 30,
                head: [['Payment ID', 'Date', 'Customer', 'Payment Method', 'Payment Received', 'Remarks']],
                body: filteredPayments.map(payment => [
                  payment.PaymentID,
                  formatDate(payment.Date),
                  payment.CustomerName || '-',
                  payment.PaymentMethod || '-',
                  payment.PaymentReceived ? formatPlain(payment.PaymentReceived) : '-', // Changed to formatPlain
                  payment.Remarks || '-',
                ]),
                theme: 'striped',
                styles: { font: 'helvetica', fontSize: 10 },
                headStyles: { fillColor: [100, 100, 100] },
              });
              doc.save(`payments_report_${new Date().toISOString().split('T')[0]}.pdf`);
            }}>
              Export as PDF
            </Dropdown.Item>
            <Dropdown.Item onClick={() => {
              console.log('[Payments] Exporting table as Excel');
              const wsData = [
                ['Payment ID', 'Date', 'Customer', 'Payment Method', 'Payment Received', 'Remarks'],
                ...filteredPayments.map(payment => [
                  payment.PaymentID,
                  formatDate(payment.Date),
                  payment.CustomerName || '-',
                  payment.PaymentMethod || '-',
                  payment.PaymentReceived ? formatINR(payment.PaymentReceived) : '-',
                  payment.Remarks || '-',
                ]),
              ];
              const ws = XLSX.utils.aoa_to_sheet(wsData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Payments');
              XLSX.writeFile(wb, `payments_report_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                console.log('[Payments] Sorting by PaymentID');
                const order = sortField === 'PaymentID' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('PaymentID');
                setSortOrder(order);
              }}>
                Payment ID {sortField === 'PaymentID' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Payments] Sorting by Date');
                const order = sortField === 'Date' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('Date');
                setSortOrder(order);
              }}>
                Date {sortField === 'Date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Payments] Sorting by CustomerName');
                const order = sortField === 'CustomerName' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('CustomerName');
                setSortOrder(order);
              }}>
                Customer {sortField === 'CustomerName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Payments] Sorting by PaymentMethod');
                const order = sortField === 'PaymentMethod' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('PaymentMethod');
                setSortOrder(order);
              }}>
                Payment Method {sortField === 'PaymentMethod' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Payments] Sorting by PaymentReceived');
                const order = sortField === 'PaymentReceived' && sortOrder === 'asc' ? 'desc' : 'asc';
                setSortField('PaymentReceived');
                setSortOrder(order);
              }}>
                Payment Received {sortField === 'PaymentReceived' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => {
                console.log('[Payments] Sorting by Remarks');
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
            {filteredPayments.map(payment => (
              <tr key={payment.PaymentID}>
                <td style={{ whiteSpace: 'nowrap' }}>{payment.PaymentID}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDate(payment.Date)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{payment.CustomerName || '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{payment.PaymentMethod || '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{payment.PaymentReceived ? formatINR(payment.PaymentReceived) : '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{payment.Remarks || '-'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <Button variant="warning" size="sm" onClick={() => handleEditPayment(payment)} className="me-2">
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeletePayment(payment)}>
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
            console.log('[Payments] Previous page');
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
            console.log('[Payments] Next page');
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
            PaymentMethod: 'Select Payment Method',
            PaymentReceived: '',
            Remarks: '',
          });
          setTouched({
            CustomerID: false,
            Date: false,
            PaymentMethod: false,
            PaymentReceived: false,
          });
          setErrors({});
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingPayment ? 'Edit Payment' : 'Add Payment'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={e => e.preventDefault()}>
            <Form.Group className="mb-3">
              <Form.Label>Customer</Form.Label>
              <Form.Select
                value={form.CustomerID}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const value = e.target.value;
                  console.log('[Payments] CustomerID changed to:', value);
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
                    console.log('[Payments] Flatpickr selected date:', date.toISOString(), 'Formatted:', formattedDate);
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
              <Form.Label>Payment Method</Form.Label>
              <Form.Select
                value={form.PaymentMethod}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const value = e.target.value;
                  setForm({ ...form, PaymentMethod: value });
                  setTouched({ ...touched, PaymentMethod: true });
                  if (value !== 'Select Payment Method') setErrors(prev => ({ ...prev, PaymentMethod: undefined }));
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
                  console.log('[Payments] Raw PaymentReceived input:', value);
                  if (value === '' || /^[0-9]*$/.test(value)) {
                    setForm({ ...form, PaymentReceived: value });
                    setTouched({ ...touched, PaymentReceived: true });
                  }
                }}
                onBlur={() => {
                  if (form.PaymentReceived) {
                    const value = form.PaymentReceived;
                    console.log('[Payments] PaymentReceived onBlur:', value);
                    setForm({ ...form, PaymentReceived: value });
                  }
                }}
                placeholder="Enter payment received"
                min="1"
                step="1"
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
                PaymentMethod: 'Select Payment Method',
                PaymentReceived: '',
                Remarks: '',
              });
              setTouched({
                CustomerID: false,
                Date: false,
                PaymentMethod: false,
                PaymentReceived: false,
              });
              setErrors({});
            }}
          >
            Close
          </Button>
          <Button variant="primary" onClick={handleSavePayment}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete payment {editingPayment?.PaymentID}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeletePayment}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}