import { Suspense } from 'react';
import AuthClient from './AuthClient'; // Separate client logic
import Navbar from '@/components/Navbar2';
import Footer from '@/components/Footer';

export default function AuthPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Suspense fallback={<div>Loading...</div>}>
          <AuthClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
