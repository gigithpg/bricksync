import { useState, useEffect } from 'react';
import { Table, Button, Form, Alert } from 'react-bootstrap';
import axios, { AxiosError } from 'axios';
import ErrorBoundary from '@/components/ErrorBoundary.tsx';

interface Log {
  LogID: string;
  Timestamp: string;
  Action: string;
  RecordID?: string;
  Details?: string;
}

interface ApiResponse {
  data: Log[];
  total: number;
}

function formatDateTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

export default function Logs() {
  console.log('[Logs] Rendering Logs component');
  const [logs, setLogs] = useState<Log[]>([]);
  const [sortField, setSortField] = useState<keyof Log>('Timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const itemsPerPage = 10;

  useEffect(() => {
    console.log('[Logs] Fetching logs from API');
    axios
      .get<ApiResponse>('http://localhost:3000/api/logs', {
        params: { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage },
      })
      .then(response => {
        console.log('[Logs] Fetched logs:', response.data.data);
        setLogs(Array.isArray(response.data.data) ? response.data.data : []);
        setTotalItems(response.data.total || 0);
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Logs] Error fetching logs:', error.message, error.response?.status, error.response?.data);
        setLogs([]);
        setTotalItems(0);
        setError(`Failed to fetch logs: ${error.response?.data?.error || error.message}`);
      });
  }, [currentPage]);

  const handleClearLogs = async () => {
    console.log('[Logs] Clearing logs');
    try {
      await axios.delete<{ message: string }>('http://localhost:3000/api/logs');
      console.log('[Logs] Logs cleared');
      setLogs([]);
      setTotalItems(0);
      setCurrentPage(1);
      setError('');
    } catch (error: AxiosError<{ error?: string }>) {
      console.error('[Logs] Error clearing logs:', error.message, error.response?.status, error.response?.data);
      setError(`Failed to clear logs: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleSort = (field: keyof Log) => {
    console.log('[Logs] Sorting by:', field);
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredLogs = logs
    .filter(log => 
      log.Details?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.Action?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <ErrorBoundary>
      <div className="logs-container">
        <h1>Logs</h1>
        <div className="my-3">
          <Button variant="danger" onClick={handleClearLogs}>
            Clear Logs
          </Button>
        </div>
        <Form.Group className="my-3">
          <Form.Control
            type="text"
            placeholder="Search by action or details"
            value={searchTerm}
            onChange={handleSearch}
          />
        </Form.Group>
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="table-responsive">
          <Table striped bordered hover style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('Timestamp')}>
                  Timestamp {sortField === 'Timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('Action')}>
                  Action {sortField === 'Action' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('RecordID')}>
                  Record ID {sortField === 'RecordID' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ whiteSpace: 'nowrap' }} onClick={() => handleSort('Details')}>
                  Details {sortField === 'Details' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={`${log.Timestamp}-${log.RecordID || Math.random()}`}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.Timestamp)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{log.Action || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{log.RecordID || '-'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{log.Details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <div className="my-3">
          <Button
            disabled={currentPage === 1}
            onClick={() => {
              console.log('[Logs] Previous page clicked');
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
              console.log('[Logs] Next page clicked');
              setCurrentPage(prev => prev + 1);
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  );
}