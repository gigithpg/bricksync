import { useState, useEffect, useContext, useRef } from 'react';
import { Table, Button, Modal, Form, Toast,Alert } from 'react-bootstrap';
import axios, { AxiosError } from 'axios';
import { AppContext } from '@/contexts/AppContext.tsx';
import { capitalizeName, canDeleteCustomer } from '@/utils/helpers.tsx';

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
  VehicleRent: number;
  Amount: number;
  Remarks: string;
  CreatedAt: string;
  UpdatedAt?: string;
}

interface Payment {
  PaymentID: string;
  CustomerID: string;
  CustomerName: string;
  Date: string;
  Amount: number;
  PaymentMethod: string;
  Remarks: string;
  CreatedAt: string;
  UpdatedAt?: string;
}

interface FormState {
  CustomerName: string;
}

interface Errors {
  CustomerName?: string;
  api?: string;
}

interface Touched {
  CustomerName: boolean;
}

interface ToastState {
  show: boolean;
  message: string;
}

interface AppContextType {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  sales: Sale[];
  setSales: (sales: Sale[]) => void;
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  transactions: unknown[];
  setTransactions: (transactions: unknown[]) => void;
}

export default function Customers() {
  console.log('[Customers] Rendering Customers component');
  const { customers, setCustomers, sales, payments } = useContext(AppContext as React.Context<AppContextType>);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormState>({ CustomerName: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Touched>({ CustomerName: false });
  const [sortField, setSortField] = useState<keyof Customer>('CustomerID');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const itemsPerPage = 5;
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('[Customers] Fetching customers from API');
    axios
      .get<Customer[]>('http://localhost:3000/api/customers')
      .then(response => {
        console.log('[Customers] Fetched customers:', response.data);
        setCustomers(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Customers] Error fetching customers:', error.message, error.response?.status, error.response?.data);
        setErrors({ api: `Failed to fetch customers: ${error.response?.data?.error || error.message}` });
      });
  }, [setCustomers]);

  useEffect(() => {
    if (showModal && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showModal]);

  useEffect(() => {
    const newErrors: Errors = {};
    if (touched.CustomerName && !form.CustomerName.trim()) {
      newErrors.CustomerName = 'Customer name cannot be empty';
    }
    setErrors(prev => ({ ...prev, CustomerName: newErrors.CustomerName }));
    console.log('[Customers] Real-time validation errors:', newErrors);
  }, [form.CustomerName, touched]);

  const validateForm = (): boolean => {
    const newErrors: Errors = {};
    if (!form.CustomerName.trim()) {
      newErrors.CustomerName = 'Customer name cannot be empty';
    }
    setErrors(newErrors);
    console.log('[Customers] Validation errors:', newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCustomer = () => {
    console.log('[Customers] Opening add customer modal');
    setEditingCustomer(null);
    setForm({ CustomerName: '' });
    setTouched({ CustomerName: false });
    setErrors({});
    setShowModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log('[Customers] Editing customer:', customer.CustomerID);
    setEditingCustomer(customer);
    setForm({ CustomerName: customer.CustomerName });
    setTouched({ CustomerName: true });
    setErrors({});
    setShowModal(true);
  };

  const handleSaveCustomer = () => {
    if (!validateForm()) {
      console.log('[Customers] Form validation failed');
      return;
    }
    const formattedName = capitalizeName(form.CustomerName);
    if (editingCustomer) {
      console.log('[Customers] Saving edited customer:', editingCustomer.CustomerID);
      axios
        .put<Customer>(`http://localhost:3000/api/customers/${editingCustomer.CustomerID}`, {
          CustomerName: formattedName,
        })
        .then(response => {
          console.log('[Customers] Customer updated:', response.data);
          setCustomers(prev =>
            prev.map(c =>
              c.CustomerID === editingCustomer.CustomerID
                ? { ...c, CustomerName: formattedName, UpdatedAt: new Date().toISOString() }
                : c
            )
          );
          setToast({ show: true, message: 'Customer updated successfully' });
          setShowModal(false);
          setForm({ CustomerName: '' });
          setTouched({ CustomerName: false });
          setErrors({});
        })
        .catch((error: AxiosError<{ error?: string }>) => {
          console.error('[Customers] Error updating customer:', error.message, error.response?.status, error.response?.data);
          setErrors({ CustomerName: error.response?.data?.error || 'Failed to update customer' });
        });
    } else {
      console.log('[Customers] Saving new customer:', formattedName);
      axios
        .post<Customer>('http://localhost:3000/api/customers', { CustomerName: formattedName })
        .then(response => {
          console.log('[Customers] Customer created:', response.data);
          setCustomers(prev => [
            ...prev,
            {
              CustomerID: response.data.CustomerID,
              CustomerName: formattedName,
              CreatedAt: new Date().toISOString(),
            },
          ]);
          setToast({ show: true, message: 'Customer created successfully' });
          setShowModal(false);
          setForm({ CustomerName: '' });
          setTouched({ CustomerName: false });
          setErrors({});
        })
        .catch((error: AxiosError<{ error?: string }>) => {
          console.error('[Customers] Error creating customer:', error.message, error.response?.status, error.response?.data);
          setErrors({ CustomerName: error.response?.data?.error || 'Failed to create customer' });
        });
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    console.log('[Customers] Checking if customer can be deleted:', customer.CustomerID);
    const { canDelete, message } = canDeleteCustomer(customer.CustomerID, sales, payments);
    if (!canDelete) {
      setToast({
        show: true,
        message,
      });
    } else {
      setEditingCustomer(customer);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteCustomer = () => {
    if (!editingCustomer) return;
    console.log('[Customers] Deleting customer:', editingCustomer.CustomerID);
    axios
      .delete(`http://localhost:3000/api/customers/${editingCustomer.CustomerID}`)
      .then(response => {
        console.log('[Customers] Customer deleted:', response.data);
        setCustomers(prev => prev.filter(c => c.CustomerID !== editingCustomer.CustomerID));
        setToast({ show: true, message: 'Customer deleted successfully' });
        setShowDeleteModal(false);
        setEditingCustomer(null);
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Customers] Error deleting customer:', error.message, error.response?.status, error.response?.data);
        setToast({ show: true, message: `Failed to delete customer: ${error.response?.data?.error || error.message}` });
        setShowDeleteModal(false);
      });
  };

  const handleSort = (field: keyof Customer) => {
    console.log('[Customers] Sorting by:', field);
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
  };

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter(c =>
        c.CustomerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  console.log('[Customers] Filtered customers:', filteredCustomers);

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  console.log('[Customers] Sorted customers:', sortedCustomers);

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  console.log('[Customers] Paginated customers:', paginatedCustomers);

  return (
    <>
      <h1>Customers</h1>
      <Button
        onClick={handleAddCustomer}
        className="my-3"
      >
        Add Customer
      </Button>
      <Form.Group className="my-3">
        <Form.Control
          type="text"
          placeholder="Search by customer name"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            console.log('[Customers] Search term:', e.target.value);
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </Form.Group>
      {errors.api && <Alert variant="danger">{errors.api}</Alert>}
      <div className="table-responsive">
        <Table striped bordered hover style={{ tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('CustomerID')}>
                Customer ID {sortField === 'CustomerID' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('CustomerName')}>
                Name {sortField === 'CustomerName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.map(customer => (
              <tr key={customer.CustomerID}>
                <td style={{ whiteSpace: 'nowrap' }}>{customer.CustomerID}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{customer.CustomerName}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleEditCustomer(customer)}
                    className="me-2"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteCustomer(customer)}
                  >
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
            console.log('[Customers] Previous page');
            setCurrentPage(prev => prev - 1);
          }}
        >
          Previous
        </Button>
        <span className="mx-2">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          disabled={currentPage === totalPages}
          onClick={() => {
            console.log('[Customers] Next page');
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
          setForm({ CustomerName: '' });
          setTouched({ CustomerName: false });
          setErrors({});
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={e => {
            e.preventDefault();
            handleSaveCustomer();
          }}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={form.CustomerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setForm({ CustomerName: e.target.value });
                  setTouched({ CustomerName: true });
                  setErrors(prev => ({ ...prev, CustomerName: undefined }));
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    console.log('[Customers] Enter key pressed, saving customer');
                    e.preventDefault();
                    handleSaveCustomer();
                  }
                }}
                placeholder="Enter customer name"
                isInvalid={!!errors.CustomerName}
                ref={nameInputRef}
              />
              <Form.Control.Feedback type="invalid">{errors.CustomerName}</Form.Control.Feedback>
              <Form.Text>
                {touched.CustomerName && form.CustomerName && !errors.CustomerName ? 'Valid customer name' : ''}
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false);
              setForm({ CustomerName: '' });
              setTouched({ CustomerName: false });
              setErrors({});
            }}
          >
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveCustomer}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {editingCustomer?.CustomerName}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteCustomer}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
      <Toast
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        delay={3000}
        autohide
        style={{ position: 'fixed', bottom: 20, right: 20 }}
      >
        <Toast.Header>
          <strong className="me-auto">Notification</strong>
        </Toast.Header>
        <Toast.Body>{toast.message}</Toast.Body>
      </Toast>
    </>
  );
}