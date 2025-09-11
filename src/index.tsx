import { createRoot } from 'react-dom/client';
import App from '@/App.tsx';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import AppProvider from '@/contexts/AppContext.tsx';

const root = createRoot(document.getElementById('root')!);
root.render(
  <AppProvider>
    <App />
  </AppProvider>
);