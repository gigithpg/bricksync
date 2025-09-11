  import { useState, useEffect, useContext } from 'react';
  import { Card, Table, Alert } from 'react-bootstrap';
  import axios, { AxiosError } from 'axios';
  import { Bar } from 'react-chartjs-2';
  import { Chart, registerables } from 'chart.js';
  import { AppContext } from '@/contexts/AppContext.tsx';
  import { formatDate, formatDateTime, formatINR } from '@/utils/helpers.tsx';

  // Register Chart.js components
  Chart.register(...registerables);

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

  interface Log {
    LogID: string;
    Action: string;
    Timestamp: string;
    Details: string;
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
  }

  interface ApiResponse<T> {
    data: T;
    total?: number;
  }

  export default function Dashboard() {
    console.log('[Dashboard] Rendering Dashboard component');
    const { customers, setCustomers, sales, setSales, payments, setPayments, transactions, setTransactions, balances, setBalances } = useContext(AppContext as React.Context<AppContextType>);
    const [logs, setLogs] = useState<Log[]>([]);
    const [error, setError] = useState<string | null>(null);
    const itemsPerPage = 10;

    useEffect(() => {
      console.log('[Dashboard] Fetching customers');
      axios
        .get<Customer[]>('http://localhost:3000/api/customers')
        .then(response => {
          console.log('[Dashboard] Fetched customers:', response.data);
          setCustomers(Array.isArray(response.data) ? response.data : []);
        })
        .catch((error: AxiosError<{ error?: string }>) => {
          console.error('[Dashboard] Error fetching customers:', error.message, error.response?.status, error.response?.data);
          setError(`Failed to fetch customers: ${error.response?.data?.error || error.message}`);
        });
    }, [setCustomers]);

    useEffect(() => {
      console.log('[Dashboard] Fetching sales');
      axios
        .get<ApiResponse<Sale[]>>('http://localhost:3000/api/sales', {
          params: { limit: itemsPerPage, offset: 0 },
        })
        .then(response => {
          console.log('[Dashboard] Fetched sales:', response.data.data);
          setSales(Array.isArray(response.data.data) ? response.data.data : []);
        })
        .catch((error: AxiosError<{ error?: string }>) => {
          console.error('[Dashboard] Error fetching sales:', error.message, error.response?.status, error.response?.data);
          setError(`Failed to fetch sales: ${error.response?.data?.error || error.message}`);
        });
    }, [setSales]);

    useEffect(() => {
      console.log('[Dashboard] Fetching payments');
      axios
        .get<ApiResponse<Payment[]>>('http://localhost:3000/api/payments', {
          params: { limit: itemsPerPage, offset: 0 },
        })
        .then(response => {
          console.log('[Dashboard] Fetched payments:', response.data.data);
          setPayments(Array.isArray(response.data.data) ? response.data.data : []);
        })
        .catch((error: AxiosError<{ error?: string }>) => {
          console.error('[Dashboard] Error fetching payments:', error.message, error.response?.status, error.response?.data);
          setError(`Failed to fetch payments: ${error.response?.data?.error || error.message}`);
        });
    }, [setPayments]);

    useEffect(() => {
      console.log('[Dashboard] Fetching transactions');
      axios
        .get<ApiResponse<Transaction[]>>('http://localhost:3000/api/transactions', {
          params: { limit: itemsPerPage, offset: 0 },
        })
        .then(response => {
          console.log('[Dashboard] Fetched transactions:', response.data.data);
          setTransactions(Array.isArray(response.data.data) ? response.data.data : []);
        })
        .catch((error: AxiosError<{ error?: string }>) => {
          console.error('[Dashboard] Error fetching transactions:', error.message, error.response?.status, error.response?.data);
          setError(`Failed to fetch transactions: ${error.response?.data?.error || error.message}`);
        });
    }, [setTransactions]);

    useEffect(() => {
      console.log('[Dashboard] Fetching balances');
      axios
        .get<ApiResponse<Balance[]>>('http://localhost:3000/api/balances', {
          params: { limit: itemsPerPage, offset: 0 },
        })
        .then(response => {
          console.log('[Dashboard] Fetched balances:', response.data.data);
          const balancesData = Array.isArray(response.data.data) ? response.data.data : [];
          setBalances(balancesData);
          if (!Array.isArray(response.data.data)) {
            console.warn('[Dashboard] Balances data is not an array:', response.data.data);
            setError('Received invalid balances data from server');
          }
        })
        .catch((error: AxiosError<{ error?: string }>) => {
          console.error('[Dashboard] Error fetching balances:', error.message, error.response?.status, error.response?.data);
          setBalances([]);
          setError(`Failed to fetch balances: ${error.response?.data?.error || error.message}`);
        });
    }, [setBalances]);

    useEffect(() => {
      console.log('[Dashboard] Fetching recent logs');
      axios
        .get<ApiResponse<Log[]>>('http://localhost:3000/api/logs', { params: { limit: 5 } })
        .then(response => {
          console.log('[Dashboard] Fetched logs:', response.data.data);
          setLogs(Array.isArray(response.data.data) ? response.data.data : []);
        })
        .catch((error: AxiosError<{ error?: string }>) => {
          console.error('[Dashboard] Error fetching logs:', error.message, error.response?.status, error.response?.data);
          setError(`Failed to fetch logs: ${error.response?.data?.error || error.message}`);
        });
    }, []);

    // Calculate totals with fallback to sales and payments if balances is empty
    const totalSales = balances.length > 0
      ? balances.reduce((sum, balance) => sum + (balance.TotalSales || 0), 0)
      : sales.reduce((sum, sale) => sum + (sale.Amount || 0), 0);
    const totalPayments = balances.length > 0
      ? balances.reduce((sum, balance) => sum + (balance.TotalPayments || 0), 0)
      : payments.reduce((sum, payment) => sum + (payment.PaymentReceived || 0), 0);
    console.log('[Dashboard] Calculated totals:', { totalSales, totalPayments });

    const negativeBalances = balances.filter(balance => balance.PendingBalance < 0);
    const topCustomers = balances
      .sort((a, b) => Math.abs(b.PendingBalance) - Math.abs(a.PendingBalance))
      .slice(0, 5);

    const salesData = {
      labels: sales.map(sale => formatDate(sale.Date)),
      datasets: [
        {
          label: 'Sales Amount',
          data: sales.map(sale => sale.Amount),
          backgroundColor: '#36A2EB',
        },
      ],
    };

    const paymentsData = {
      labels: payments.map(payment => formatDate(payment.Date)),
      datasets: [
        {
          label: 'Payments Amount',
          data: payments.map(payment => payment.PaymentReceived),
          backgroundColor: '#FF6384',
        },
      ],
    };

    console.log('[Dashboard] Rendering with state:', { customers, sales, payments, transactions, balances, logs });

    return (
      <>
        <h1>Dashboard</h1>
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="row">
          <div className="col-md-4">
            <Card className="mb-3 bg-primary text-white">
              <Card.Body>
                <Card.Title>Customer Count</Card.Title>
                <Card.Text>{customers.length || 0}</Card.Text>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-4">
            <Card className="mb-3 bg-success text-white">
              <Card.Body>
                <Card.Title>Total Sales</Card.Title>
                <Card.Text>{formatINR(totalSales) || '₹0'}</Card.Text>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-4">
            <Card className="mb-3 bg-info text-white">
              <Card.Body>
                <Card.Title>Total Payments</Card.Title>
                <Card.Text>{formatINR(totalPayments) || '₹0'}</Card.Text>
              </Card.Body>
            </Card>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Sales Trend</Card.Title>
                {sales.length > 0 ? (
                  <Bar
                    data={salesData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Sales Over Time' },
                      },
                      scales: {
                        x: { type: 'category' },
                        y: { beginAtZero: true },
                      },
                    }}
                  />
                ) : (
                  <p>No sales data available</p>
                )}
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-6">
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Payments Trend</Card.Title>
                {payments.length > 0 ? (
                  <Bar
                    data={paymentsData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Payments Over Time' },
                      },
                      scales: {
                        x: { type: 'category' },
                        y: { beginAtZero: true },
                      },
                    }}
                  />
                ) : (
                  <p>No payments data available</p>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Negative Balances</Card.Title>
                {negativeBalances.length > 0 ? (
                  <div className="table-responsive">
                    <Table striped bordered hover style={{ tableLayout: 'auto' }}>
                      <thead>
                        <tr>
                          <th style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Customer</th>
                          <th style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {negativeBalances.map(balance => {
                          console.log('[Dashboard] Negative Balance Key:', balance.CustomerID);
                          return (
                            <tr key={balance.CustomerID}>
                              <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{balance.CustomerName}</td>
                              <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{formatINR(balance.PendingBalance)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <p>No negative balances</p>
                )}
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-6">
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Top Customers by Balance</Card.Title>
                {topCustomers.length > 0 ? (
                  <div className="table-responsive">
                    <Table striped bordered hover style={{ tableLayout: 'auto' }}>
                      <thead>
                        <tr>
                          <th style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Customer</th>
                          <th style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCustomers.map(customer => {
                          console.log('[Dashboard] Top Customer Key:', customer.CustomerID);
                          return (
                            <tr key={customer.CustomerID}>
                              <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{customer.CustomerName}</td>
                              <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{formatINR(customer.PendingBalance)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <p>No customer balances available</p>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
        <Card className="mb-3">
          <Card.Body>
            <Card.Title>Recent Logs</Card.Title>
            {logs.length > 0 ? (
              <div className="table-responsive">
                <Table striped bordered hover style={{ tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Action</th>
                      <th style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Timestamp</th>
                      <th style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => {
                      console.log('[Dashboard] Rendering Log:', {
                        key: log.LogID || `log-${index}`,
                        action: log.Action,
                        timestamp: log.Timestamp,
                        formattedTimestamp: formatDateTime(log.Timestamp),
                        details: log.Details
                      });
                      const key = log.LogID || `log-${index}`;
                      return (
                        <tr key={key}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{log.Action}</td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{formatDateTime(log.Timestamp)}</td>
                          <td style={{ fontSize: '0.85rem' }}>{log.Details}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <p>No recent logs available</p>
            )}
          </Card.Body>
        </Card>
      </>
    );
  }