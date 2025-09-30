// src/app/search/layout.jsx
import Navbar2 from '@/components/Navbar2';
import Footer from '@/components/Footer';

export default function subjectLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar2 />
      
      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}