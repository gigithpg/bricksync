import { useState, useEffect } from 'react';
import { Button, Modal, Toast, Table, Form } from 'react-bootstrap';
import axios, { AxiosError } from 'axios';

interface Backup {
  file: string;
  createdAt: string;
}

interface ToastState {
  show: boolean;
  message: string;
}

interface CleanupResponse {
  deleted: string[];
}

export default function Backup() {
  console.log('[Backup] Rendering Backup component');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [backups, setBackups] = useState<Backup[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    console.log('[Backup] Fetching backups from API');
    axios
      .get<Backup[]>('http://localhost:3000/api/backups')
      .then(response => {
        console.log('[Backup] Fetched backups:', response.data);
        setBackups(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Backup] Error fetching backups:', error.message);
        setToast({ show: true, message: `Failed to fetch backups: ${error.response?.data?.error || error.message}` });
      });
  }, []);

  const handleCreateBackup = () => {
    console.log('[Backup] Creating backup');
    axios
      .post<{ file: string }>('http://localhost:3000/api/backup')
      .then(response => {
        console.log('[Backup] Backup created:', response.data);
        setToast({ show: true, message: `Backup created successfully: ${response.data.file}` });
        setBackups(prev => [{ file: response.data.file, createdAt: new Date().toISOString() }, ...prev]);
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Backup] Error creating backup:', error.message);
        setToast({ show: true, message: `Failed to create backup: ${error.response?.data?.error || error.message}` });
      });
  };

  const handleCleanupBackups = () => {
    console.log('[Backup] Opening cleanup backups confirmation modal');
    setShowConfirmModal(true);
  };

  const confirmCleanupBackups = () => {
    console.log('[Backup] Confirmed cleanup of old backups');
    axios
      .post<CleanupResponse>('http://localhost:3000/api/backup/cleanup')
      .then(response => {
        console.log('[Backup] Cleanup successful:', response.data);
        setToast({ show: true, message: `Deleted ${response.data.deleted.length} old backups` });
        setShowConfirmModal(false);
        setBackups(prev => prev.filter(b => !response.data.deleted.includes(b.file)));
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Backup] Error cleaning up backups:', error.message);
        setToast({ show: true, message: `Failed to cleanup backups: ${error.response?.data?.error || error.message}` });
        setShowConfirmModal(false);
      });
  };

  const handleResetDatabase = () => {
    console.log('[Backup] Opening reset database confirmation modal');
    setShowResetConfirmModal(true);
  };

  const confirmResetDatabase = () => {
    console.log('[Backup] Resetting database');
    axios
      .post<{ message: string }>('http://localhost:3000/api/reset')
      .then(response => {
        console.log('[Backup] Database reset:', response.data);
        setToast({ show: true, message: 'Database reset successfully' });
        setShowResetConfirmModal(false);
      })
      .catch((error: AxiosError<{ error?: string }>) => {
        console.error('[Backup] Error resetting database:', error.message);
        setToast({ show: true, message: `Failed to reset database: ${error.response?.data?.error || error.message}` });
        setShowResetConfirmModal(false);
      });
  };

  const filteredBackups = backups.filter(b => b.file.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <h1>Backup</h1>
<div className="my-3 d-flex flex-wrap gap-2">
  <Button variant="primary" onClick={handleCreateBackup}>
    Create Backup
  </Button>
  <Button variant="warning" onClick={handleCleanupBackups}>
    Cleanup Old Backups
  </Button>
  <Button variant="danger" onClick={handleResetDatabase}>
    Reset Database
  </Button>
</div>
      <Form.Group className="my-3">
        <Form.Control
          type="text"
          placeholder="Search by backup file name"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        />
      </Form.Group>
      <div className="table-responsive my-3">
        <Table striped bordered hover style={{ tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th style={{ whiteSpace: 'nowrap' }}>Backup File</th>
              <th style={{ whiteSpace: 'nowrap' }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {filteredBackups.map(backup => (
              <tr key={backup.file}>
                <td style={{ whiteSpace: 'nowrap' }}>{backup.file}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(backup.createdAt).toLocaleString('en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Cleanup</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete backups older than 7 days?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="warning" onClick={confirmCleanupBackups}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showResetConfirmModal} onHide={() => setShowResetConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Reset Database</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to reset all data in the database? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmResetDatabase}>
            Reset Database
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