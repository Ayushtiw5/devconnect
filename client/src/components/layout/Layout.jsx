import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout__main">
        <div className="layout__container">
          <Outlet />
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#000',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default Layout;
