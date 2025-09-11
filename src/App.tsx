import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import AppProvider from '@/contexts/AppContext.tsx';
import ErrorBoundary from '@/components/ErrorBoundary.tsx';
import Customers from '@/modules/Customers.tsx';
import Sales from '@/modules/Sales.tsx';
import Payments from '@/modules/Payments.tsx';
import Transactions from '@/modules/Transactions.tsx';
import Balances from '@/modules/Balances.tsx';
import Backup from '@/modules/Backup.tsx';
import Logs from '@/modules/Logs.tsx';
import Dashboard from '@/modules/Dashboard.tsx';
import './index.css';

export default function App() {
  console.log('[App] Rendering App component');
  const [expanded, setExpanded] = useState<boolean>(false);
  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log('[App] Adding outside click listener');
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        navRef.current &&
        !navRef.current.contains(event.target as Node) &&
        window.innerWidth < 768
      ) {
        console.log('[App] Outside click detected, collapsing navbar');
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      console.log('[App] Removing outside click listener');
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      console.log('[App] Nav link clicked, collapsing navbar');
      setExpanded(false);
    }
  };

  return (
    <AppProvider>
      <Router>
        <ErrorBoundary>
          <Navbar
            bg="dark"
            variant="dark"
            expand="md"
            expanded={expanded}
            onToggle={() => setExpanded(prev => !prev)}
            ref={navRef}
          >
            <Container>
              <Navbar.Brand as={NavLink} to="/" onClick={handleNavClick}>
                BrickSync
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link as={NavLink} to="/" end onClick={handleNavClick}>
                    Dashboard
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/customers" onClick={handleNavClick}>
                    Customers
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/sales" onClick={handleNavClick}>
                    Sales
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/payments" onClick={handleNavClick}>
                    Payments
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/transactions" onClick={handleNavClick}>
                    Transactions
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/balances" onClick={handleNavClick}>
                    Balances
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/backup" onClick={handleNavClick}>
                    Backup
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/logs" onClick={handleNavClick}>
                    Logs
                  </Nav.Link>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
          <Container className="mt-3">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/balances" element={<Balances />} />
              <Route path="/backup" element={<Backup />} />
              <Route path="/logs" element={<Logs />} />
            </Routes>
          </Container>
        </ErrorBoundary>
      </Router>
    </AppProvider>
  );
}