// src/app/article/[articleId]/layout.jsx
import React from "react";
import axios from "axios";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar2";

export async function generateMetadata({ params }) {
  const { articleId } = params;

  // Fetch article data from the DOAJ API
  let article;
  try {
    const res = await axios.get(`https://doaj.org/api/v2/articles/${articleId}`, {
      headers: {
        Accept: "application/json",
      },
    });
    article = res.data;
  } catch (error) {
    console.error("Error fetching DOAJ article:", error);
    return {
      title: "Article Not Found",
      description: "The requested article could not be found.",
    };
  }

  if (!article || !article.bibjson) {
    return {
      title: "Article Not Found",
      description: "The requested article could not be found.",
    };
  }

  const bibjson = article.bibjson || {};
  const authors = bibjson.author || [];
  const journal = bibjson.journal || {};
  const identifiers = bibjson.identifier || [];
  const links = bibjson.link || [];

  // Extract relevant metadata
  const title = bibjson.title || "Untitled Article";
  const publicationDate = bibjson.year
    ? `${bibjson.year}${bibjson.month ? `/${bibjson.month}` : ""}`
    : "";
  const journalTitle = journal.title || "Unknown Journal";
  const volume = journal.volume || "";
  const issue = journal.number || "";
  const firstPage = bibjson.start_page || "";
  const lastPage = bibjson.end_page || "";
  const doi = identifiers.find((id) => id.type === "doi")?.id || "";
  const pdfUrl = links.find((link) => link.type === "fulltext")?.url || "";

  return {
    title: title,
    description: bibjson.abstract || "No abstract available for this article.",
    other: {
      "citation_title": title,
      // Map authors to multiple citation_author meta tags
      ...authors.reduce((acc, author, index) => {
        acc[`citation_author_${index}`] = author.name?.trim() || "";
        return acc;
      }, {}),
      ...(publicationDate && { "citation_publication_date": publicationDate }),
      "citation_journal_title": journalTitle,
      "citation_volume": volume|| "",
       "citation_issue": issue || "",
     "citation_firstpage": firstPage || 1,
      "citation_lastpage": lastPage || " ",
      "citation_pdf_url": pdfUrl || "",
    },
  };
}

export default function ArticleLayout({ children }) {
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