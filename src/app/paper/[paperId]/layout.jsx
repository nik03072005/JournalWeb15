// src/app/paper/[paperId]/layout.jsx
import axios from "axios";
import React from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar2";

export async function generateMetadata({ params }) {
  try {
    // Check if paperId exists
    console.log(params,"sdsdsdsdsds")
    if (!params.paperId || params.paperId.trim() === '') {
      return {
        title: 'Paper Not Found',
        description: 'The requested paper could not be found.',
      };
    }

    // Use absolute URL for server-side rendering
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const res = await axios.get(`${baseUrl}/api/journal`, {
      params: { id: params.paperId }
    });
    
    // Check axios response status (axios doesn't have res.ok, it has res.status)
    if (res.status !== 200) {
      return {
        title: 'Paper Not Found',
        description: 'The requested paper could not be found.',
      };
    }

    const data = await res.data;
    const paper = data.journal;
    
    // Check if paper and paper.detail exist
    if (!paper || !paper.detail) {
      return {
        title: 'Paper Not Found',
        description: 'The requested paper could not be found.',
      };
    }

    const date = paper.detail.date ? new Date(paper.detail.date) : null;

    const month = date ? String(date.getMonth() + 1).padStart(2, '0') : '01';
    const year = date ? date.getFullYear() : new Date().getFullYear();

    const formattedDate = `${month}/${year}`;
    let firstPage = 1;
    let lastPage = '';

    if (paper.detail.pageRange) {
      const parts = paper.detail.pageRange.split('-');
      firstPage = parseInt(parts[0], 10) || 1;
      lastPage = parts[1] ? parseInt(parts[1], 10) : '';
    }

    return {
      title: paper.detail.title || 'Research Paper',
      description: paper.detail.abstract || 'Research paper details',
      other: {
        "citation_journal_title": paper.detail.title || '',
        ...(paper.authors || []).reduce((acc, author, index) => {
          acc[`citation_author_${index}`] = author.name || '';
          return acc;
        }, {}),
        "citation_publication_date": formattedDate,
        "citation_volume": paper.detail.volume || '',
        "citation_issue": paper.detail.isbn || '',
        "citation_firstpage": firstPage,
        "citation_lastpage": lastPage || '',
        "citation_pdf_url": paper.fileUrl || '',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Paper Not Found',
      description: 'The requested paper could not be found.',
    };
  }
}

export default function PaperLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
