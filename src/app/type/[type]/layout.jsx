// src/app/type/[type]/layout.jsx
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar2";
import React from "react";

export async function generateMetadata({ params }) {
  // Decode and format the subject from the type parameter
  const subject = decodeURIComponent(params.type || "").replace(/-/g, " ");
  const displaySubject = subject
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // No API fetch is performed, as this is a search results page and metadata is based on the subject
  // Construct description based on subject
  const description = `Explore open-access academic research on ${displaySubject}, including papers, journals, and books from various sources.`;

  // Determine data sources for context (mirroring page.jsx logic)
  const normalizedSubject = subject.toLowerCase();
  const dataSources = {
    fetchLocal: true,
    fetchDOAJ: normalizedSubject.includes("research") || normalizedSubject.includes("conference"),
    fetchDOAB: normalizedSubject.includes("book") || normalizedSubject.includes("chapter"),
  };

  // Construct a generic journal title based on data sources
  let journalTitle = "Local Journals";
  if (dataSources.fetchDOAJ && dataSources.fetchDOAB) {
    journalTitle = "DOAJ Articles, DOAB Books, and Local Journals";
  } else if (dataSources.fetchDOAJ) {
    journalTitle = "DOAJ Articles and Local Journals";
  } else if (dataSources.fetchDOAB) {
    journalTitle = "DOAB Books and Local Journals";
  }

  return {
    title: `${displaySubject} Research | Academic Search`,
    description,
    other: {
      "citation_title": `${displaySubject} Research Collection`,
      // Use a generic author for the collection, as specific authors are not applicable
      "citation_author_0": "Various Authors",
      // Use current date for the dynamic search results collection
      "citation_publication_date": new Date().toISOString().split("T")[0], // e.g., "2025-07-30"
      "citation_journal_title": journalTitle,
      // No volume, issue, firstpage, lastpage, doi, or pdf_url for a search page
      // Add keywords for SEO
      "keywords": `${displaySubject}, academic research, open access, journals, books, articles`,
    },
  };
}

export default function TypeSearchLayout({ children }) {
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