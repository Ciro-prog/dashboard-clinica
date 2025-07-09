
import React, { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import DashboardLayout from '@/components/DashboardLayout';

const Index = () => {
  const [user, setUser] = useState<string | null>(null);

  const handleLogin = (email: string) => {
    setUser(email);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <>
      {!user ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <DashboardLayout userEmail={user} onLogout={handleLogout} />
      )}
    </>
  );
};

export default Index;
