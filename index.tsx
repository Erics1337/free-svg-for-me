/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './components/AuthContext';
import { supabase } from './lib/supabase';

// Handle Stripe payment redirects
const PaymentHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<'success' | 'cancelled' | null>(null);

  useEffect(() => {
    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (paymentStatus === 'success') {
      setPaymentMessage('Payment successful! Your credits have been added.');
      setPaymentType('success');
      // Clear the URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Refresh the session to get updated credits
      timerId = setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (paymentStatus === 'cancelled') {
      setPaymentMessage('Payment cancelled. Your credits were not charged.');
      setPaymentType('cancelled');
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Clear message after 5 seconds
      timerId = setTimeout(() => setPaymentMessage(null), 5000);
    }

    return () => clearTimeout(timerId);
  }, []);

  const bannerClass = paymentType === 'cancelled'
    ? 'bg-red-500/10 border border-red-500/30 text-red-300'
    : 'bg-green-500/10 border border-green-500/30 text-green-300';

  return (
    <>
      {paymentMessage && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg text-sm font-medium ${bannerClass}`}>
          {paymentMessage}
        </div>
      )}
      {children}
    </>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <PaymentHandler>
        <App />
      </PaymentHandler>
    </AuthProvider>
  </React.StrictMode>
);
