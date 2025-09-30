// src/app/book/[...bookId]/layout.jsx
import React from "react";
import axios from "axios";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar2";

export async function generateMetadata({ params }) {
  // Reconstruct the handle from the catch-all route
  const handleParts = params.bookId;
  const fullHandle = Array.isArray(handleParts) ? handleParts.join("/") : handleParts;

  // Fetch book data from the DOAB API
 const res = await axios.get(`https://directory.doabooks.org/rest/search?query=handle:"${fullHandle}"&expand=metadata`, {
    headers: {
      Accept: "application/json",
    },
  });
  let bookData = null;

  // Handle different response structures
  if (Array.isArray(res.data)) {
    bookData = res.data.find((item) => item.handle === fullHandle) || res.data[0];
  } else if (res.data && res.data.results && Array.isArray(res.data.results)) {
    bookData = res.data.results.find((item) => item.handle === fullHandle) || res.data.results[0];
  } else if (res.data && typeof res.data === "object") {
    bookData = res.data;
  }

  if (!bookData || !bookData.metadata) {
    return {
      title: "Book Not Found",
      description: "The requested book could not be found.",
    };
  }

  // Helper function to extract metadata values
  const getMetadataValue = (key) => {
    const metadataItem = bookData.metadata.find((m) => m.key === key);
    return metadataItem?.value || "";
  };

  // Extract relevant metadata
  const title = getMetadataValue("dc.title") || "Untitled Book";
  const editors = getMetadataValue("dc.contributor.editor")?.split(", ") || [];
  const publicationDate = getMetadataValue("dc.date.issued") || "";
  const publisher = getMetadataValue("publisher.name") || "Unknown Publisher";
  const doi = getMetadataValue("oapen.identifier.doi") || "";
  const pages = getMetadataValue("oapen.pages") || "";
  const issued=getMetadataValue("dc.date.issued") || "";
  const pdfUrl = bookData.bitstreams?.find((b) => b.mimeType === "application/pdf")?.retrieveLink
    ? `https://directory.doabooks.org${bookData.bitstreams.find((b) => b.mimeType === "application/pdf").retrieveLink}`
    : "";

  return {
    title: title,
    description: getMetadataValue("dc.description.abstract") || "No abstract available for this book.",
    other: {
      "citation_journal_title": title,
      // Map editors to multiple citation_author meta tags
      ...editors.reduce((acc, editor, index) => {
        acc[`citation_author_${index}`] = editor.trim();
        return acc;
      }, {}),
      "citation_publication_date": publicationDate,
      "citation_publisher": publisher,
      "citation_issued": issued,
      "citation_volume": 23,
      ...(pages && {
        "citation_firstpage": "1",
        "citation_lastpage": pages,
      }),
      "citation_pdf_url": pdfUrl || "",
    },
  };
}

export default function BookLayout({ children }) {
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