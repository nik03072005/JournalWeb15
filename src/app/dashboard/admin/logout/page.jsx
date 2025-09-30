'use client';
import React from 'react';
import Cookies from 'js-cookie';


const LogoutPage = () => {
   const handleLogout = async () => {
    localStorage.clear();
  await fetch('/api/logout'); // hits GET route
  window.location.href = '/auth';
};

    return (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2>Are you sure you want to logout?</h2>
            <button
                onClick={handleLogout}
                style={{
                    marginTop: '20px',
                    padding: '10px 24px',
                    background: '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Logout
            </button>
        </div>
    );
};

export default LogoutPage;