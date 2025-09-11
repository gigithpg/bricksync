import { useState, useEffect, useContext } from 'react';
import { Table, Form, Button, Dropdown } from 'react-bootstrap';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatINR } from '@/utils/helpers.tsx';
import { AppContext } from '@/contexts/AppContext.tsx';

interface Balance {
  CustomerID: string;
  CustomerName: string;
  TotalSales: number;
  TotalPayments: number;
  PendingBalance: number;
}

interface AppContextType {
  balances: Balance[];
  setBalances: (balances: Balance[]) => void;
}

interface ApiResponse {
  data: Balance[];
  total: number;
}

export default function Balances() {
  console.log('[Balances] Rendering Balances component');
  const { balances, setBalances } = useContext(AppContext as React.Context<AppContextType>);
  const [sortField, setSortField] = useState<keyof Balance>('CustomerName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const itemsPerPage = 10;

  useEffect(() => {
    console.log('[Balances] Fetching balances with params:', { currentPage, limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage });
    axios
      .get<ApiResponse>('http://localhost:3000/api/balances', {
        params: { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage },
      })
      .then(response => {
        console.log('[Balances] Raw response:', response);
        const fetchedBalances = Array.isArray(response.data.data) ? response.data.data : [];
        console.log('[Balances] Fetched balances:', fetchedBalances);
        setBalances(fetchedBalances);
        setTotalItems(response.data.total || fetchedBalances.length || 0);
      })
      .catch(error => {
        console.error('[Balances] Error fetching balances:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        setBalances([]);
        setTotalItems(0);
      });
  }, [currentPage, setBalances]);

  const handleSort = (field: keyof Balance) => {
    console.log('[Balances] Sorting by:', field);
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleExportPDF = () => {
    console.log('[Balances] Exporting table as PDF');
    const doc = new jsPDF('landscape');
    doc.setFont('helvetica', 'normal');
    doc.text('Balances Report', 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Customer', 'Total Sales', 'Total Payments', 'Pending Balance']],
      body: filteredBalances.map(balance => [
        balance.CustomerName || '-',
        balance.TotalSales ? balance.TotalSales.toString() : '0',
        balance.TotalPayments ? balance.TotalPayments.toString() : '0',
        balance.PendingBalance ? balance.PendingBalance.toString() : '0',
      ]),
      theme: 'striped',
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [100, 100, 100] },
    });
    doc.save(`balances_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportExcel = () => {
    console.log('[Balances] Exporting table as Excel');
    const wsData = [
      ['Customer', 'Total Sales', 'Total Payments', 'Pending Balance'],
      ...filteredBalances.map(balance => [
        balance.CustomerName || '-',
        balance.TotalSales ? formatINR(balance.TotalSales) : '0',
        balance.TotalPayments ? formatINR(balance.TotalPayments) : '0',
        balance.PendingBalance ? formatINR(balance.PendingBalance) : '0',
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balances');
    XLSX.writeFile(wb, `balances_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredBalances = balances
    .filter(b => b.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aValue = a[sortField] || 0;
      const bValue = b[sortField] || 0;
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

  console.log('[Balances] Filtered balances:', filteredBalances);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <>
      <h1>Balances</h1>
      <div className="my-3 d-flex justify-content-between">
        <Form.Group className="w-50">
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
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('CustomerName')}>
                Customer {sortField === 'CustomerName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('TotalSales')}>
                Total Sales {sortField === 'TotalSales' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('TotalPayments')}>
                Total Payments {sortField === 'TotalPayments' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('PendingBalance')}>
                Pending Balance {sortField === 'PendingBalance' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBalances.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>
                  No balances available
                </td>
              </tr>
            ) : (
              filteredBalances.map(balance => (
                <tr key={balance.CustomerID}>
                  <td style={{ whiteSpace: 'nowrap' }}>{balance.CustomerName || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{balance.TotalSales ? formatINR(balance.TotalSales) : '0'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{balance.TotalPayments ? formatINR(balance.TotalPayments) : '0'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{balance.PendingBalance ? formatINR(balance.PendingBalance) : '0'}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
      <div>
        <Button
          disabled={currentPage === 1}
          onClick={() => {
            console.log('[Balances] Previous page');
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
            console.log('[Balances] Next page');
            setCurrentPage(prev => prev + 1);
          }}
        >
          Next
        </Button>
      </div>
    </>
  );
}