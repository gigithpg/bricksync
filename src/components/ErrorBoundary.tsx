import { Component, ReactNode } from 'react';
import { Alert, Toast } from 'react-bootstrap';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <Alert variant="danger" className="m-3">
            <Alert.Heading>Something went wrong</Alert.Heading>
            <p>An error occurred while rendering this component. Please try again or contact support if the issue persists.</p>
          </Alert>
          <Toast
            show={this.state.hasError}
            onClose={() => this.setState({ hasError: false, errorMessage: '' })}
            delay={5000}
            autohide
            style={{ position: 'fixed', bottom: 20, right: 20 }}
          >
            <Toast.Header>
              <strong className="me-auto">Error</strong>
            </Toast.Header>
            <Toast.Body>{this.state.errorMessage}</Toast.Body>
          </Toast>
        </>
      );
    }
    return this.props.children;
  }
}