'use client';
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiSearch, FiFilter, FiCalendar, FiBook, FiUser, FiTag, FiExternalLink } from "react-icons/fi";
import Navbar2 from "@/components/Navbar2";
import { useParams, useRouter } from 'next/navigation';
import { Types } from "mongoose";
import VisitorBadge from "@/components/VisitorBadge";

// Constants
const INITIAL_FILTERS = {
  title: "",
  abstract: "",
  creator: "",
  dateFrom: "",
  dateTo: "",
  issn: "",
  journalOrPublicationTitle: "",
  keywords: "",
  publisher: "",
  status: "",
  type: "",
};

const RESULTS_PER_PAGE = 10;
const MAX_DOAJ_PAGES = 5;
const MAX_DOAB_PAGES = 10;
const DOAJ_PAGE_SIZE = 100;
const DOAB_PAGE_LIMIT = 50;

// Helper Functions
const filterResults = (data, filters, subject) => {
  console.log(`Filtering ${data.length} results for subject: "${subject}"`);
  
  return data.filter((item) => {
    const detail = item.detail || {};
    
    // For local journal items, check type matching more strictly
    if (item.isLocalJournal) {
      const typeMatches = 
        item.type?.typeName?.toLowerCase().includes(subject.toLowerCase()) ||
        detail.title?.toLowerCase().includes(subject.toLowerCase()) ||
        detail.abstract?.toLowerCase().includes(subject.toLowerCase()) ||
        detail.keywords?.toLowerCase().includes(subject.toLowerCase()) ||
        item.subject?.subjectName?.toLowerCase().includes(subject.toLowerCase());
      
      if (!typeMatches) {
        return false;
      }
    }
    
    // Subject matching - more specific for local data
    const subjectMatch = 
      item.subject?.subjectName?.toLowerCase().includes(subject.toLowerCase()) ||
      detail.keywords?.toLowerCase().includes(subject.toLowerCase()) ||
      detail.title?.toLowerCase().includes(subject.toLowerCase()) ||
      detail.abstract?.toLowerCase().includes(subject.toLowerCase()) ||
      item.type?.typeName?.toLowerCase().includes(subject.toLowerCase()) ||
      (item.isDoajArticle && (
        subject.toLowerCase().includes('research') || 
        subject.toLowerCase().includes('article') ||
        subject.toLowerCase().includes('paper')
      )) ||
      (item.isDoabBook && (
        subject.toLowerCase().includes('book') || 
        subject.toLowerCase().includes('chapter')
      ));
    
    // Check if specific filters are applied
    const hasSpecificFilters = Object.values(filters).some(val => val);
    
    if (!subjectMatch) {
      return false;
    }
    
    // Apply individual filters
    if (filters.title && !detail.title?.toLowerCase().includes(filters.title.toLowerCase())) return false;
    if (filters.abstract && !detail.abstract?.toLowerCase().includes(filters.abstract.toLowerCase())) return false;
    if (filters.creator && !detail.creators?.some(c => 
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(filters.creator.toLowerCase())
    )) return false;
    if (filters.dateFrom && new Date(detail.date || detail.publicationDate) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(detail.date || detail.publicationDate) > new Date(filters.dateTo)) return false;
    if (filters.issn && !detail.issn?.toLowerCase().includes(filters.issn.toLowerCase())) return false;
    if (filters.journalOrPublicationTitle && 
      !detail.journalOrPublicationTitle?.toLowerCase().includes(filters.journalOrPublicationTitle.toLowerCase())
    ) return false;
    if (filters.keywords && !detail.keywords?.toLowerCase().includes(filters.keywords.toLowerCase())) return false;
    if (filters.publisher && !detail.publisher?.toLowerCase().includes(filters.publisher.toLowerCase())) return false;
    if (filters.status && !detail.status?.toLowerCase().includes(filters.status.toLowerCase())) return false;
    if (filters.type && 
      !item.type?.typeName?.toLowerCase().includes(filters.type.toLowerCase()) &&
      !(typeof item.type === 'string' && item.type.toLowerCase().includes(filters.type.toLowerCase()))
    ) return false;
    
    return true;
  });
};

const getDataSources = (subject) => {
  const normalizedSubject = subject.toLowerCase();
  
  return {
    fetchLocal: true, // Always fetch local data but filter it properly
    fetchDOAJ: normalizedSubject.includes('research') || 
               normalizedSubject.includes('article') || 
               normalizedSubject.includes('journal'),
    fetchDOAB: normalizedSubject.includes('book') || 
               normalizedSubject.includes('chapter') 
               
  };
};

const normalizeDOAJArticles = (articles) => {
  return articles.map(item => {
    const bib = item.bibjson || {};
    return {
      _id: item.id,
      isDoajArticle: true,
      detail: {
        title: bib.title || "",
        abstract: bib.abstract || "",
        creators: (bib.author || []).map(a => ({
          firstName: a.name?.split(" ")[0] || "",
          lastName: a.name?.split(" ").slice(1).join(" ") || ""
        })),
        date: bib.year ? `${bib.year}-01-01` : "",
        publicationDate: bib.year ? `${bib.year}-01-01` : "",
        issn: (bib.journal?.issns || [])[0] || "",
        journalOrPublicationTitle: bib.journal?.title || "",
        keywords: (bib.keywords || []).join(", "),
        publisher: bib.journal?.publisher || "",
        status: "Open Access",
        officialURL: (bib.link || []).find(l => l.type === 'fulltext')?.url || "",
      },
      type: { typeName: "Open Access Article" },
      subject: { subjectName: (bib.subject || [])[0]?.term || "" }
    };
  });
};

const normalizeDOABBooks = (books) => {
  return books.map(book => {
    const getMetadataValue = (key) => {
      const metadataItem = book.metadata?.find(m => m.key === key);
      return metadataItem?.value || "";
    };

    const title = getMetadataValue('dc.title');
    const abstract = getMetadataValue('dc.description.abstract');
    const editor = getMetadataValue('dc.contributor.editor');
    const dateIssued = getMetadataValue('dc.date.issued');
    const doi = getMetadataValue('oapen.identifier.doi');
    const publisher = getMetadataValue('publisher.name');
    const subjectVal = getMetadataValue('dc.subject.other');

    return {
      _id: book.handle || `doab-${Math.random()}`,
      isDoabBook: true,
      detail: {
        title,
        abstract,
        creators: editor ? [{
          firstName: editor.split(" ")[0] || "",
          lastName: editor.split(" ").slice(1).join(" ") || ""
        }] : [],
        date: dateIssued ? `${dateIssued}-01-01` : "",
        publicationDate: dateIssued ? `${dateIssued}-01-01` : "",
        issn: "",
        journalOrPublicationTitle: publisher,
        keywords: subjectVal,
        publisher,
        status: "Open Access",
        officialURL: `https://directory.doabooks.org${book.link}` || "",
        doi,
      },
      type: { typeName: "Open Access Book" },
      subject: { subjectName: subjectVal }
    };
  });
};

const normalizeLocalData = (localItems) => {
  return localItems.map(item => {
    const detail = item.detail || {};
    
    return {
      _id: item._id,
      isLocalJournal: true,
      detail: {
        title: detail.title || "",
        abstract: detail.abstract || "",
        creators: detail.creators || [],
        date: detail.date || "",
        publicationDate: detail.date || "",
        issn: detail.issn || "",
        journalOrPublicationTitle: detail.journalOrPublicationTitle || "",
        keywords: detail.keywords || "",
        publisher: detail.publisher || "",
        status: detail.status || "",
        officialURL: detail.officialURL || "",
        doi: detail.doi || "",
        volume: detail.volume || "",
        number: detail.number || "",
        pageRange: detail.pageRange || "",
        conference: detail.conference || "",
        bookName: detail.bookName || "",
        department: detail.department || "",
        university: detail.university || "",
        semester: detail.semester || "",
        year: detail.year || "",
        isbn: detail.isbn || "",
        preface: detail.preface || "",
        references: detail.references || "",
        guides: detail.guides || []
      },
      type: typeof item.type === 'string' ? { typeName: item.type } : item.type,
      subject: item.subject || { subjectName: "" },
      fileUrl: item.fileUrl || ""
    };
  });
};

const capitalizeSubject = (subject) => {
  return subject.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Main Component
const TypeSearchPage = () => {
  const params = useParams();
  const router = useRouter();
  const subject = decodeURIComponent(params.type || '').replace(/-/g, ' ');
  
  // State
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [results, setResults] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [journals, setJournals] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [dataSources, setDataSources] = useState(getDataSources(subject));
  const [expandedSections, setExpandedSections] = useState({
    basicSearch: true,
    metadata: true,
    publication: true,
    classification: true
  });

  // Data Fetching
  const fetchJournals = async () => {
    try {
      const response = await axios.get('/api/journal');
      console.log('Fetched journals:', response.data.journals);
      setJournals(response.data.journals);
    } catch (error) {
      console.error("Error fetching journals:", error);
    }
  };

  const fetchDOABBooks = async (query = "", page = 1, limit = DOAB_PAGE_LIMIT) => {
    if (!query) return { results: [], pagination: null };

    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await axios.get(`/api/doab-search?query=${encodedQuery}&expand=metadata&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch DOAB books:", error.message);
      return { results: [], pagination: null };
    }
  };

  const fetchAllDOABBooks = async (query = "") => {
    if (!query) return [];

    let allBooks = [];
    let currentPage = 1;
    let hasMore = true;

    try {
      while (hasMore && currentPage <= MAX_DOAB_PAGES) {
        const response = await fetchDOABBooks(query, currentPage);
        
        if (response.results?.length) {
          allBooks = [...allBooks, ...response.results];
          hasMore = response.pagination?.hasMore || false;
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }
      return allBooks;
    } catch (error) {
      console.error("Failed to fetch all DOAB books:", error.message);
      return allBooks;
    }
  };

  const fetchDOAJArticles = async (query = "", page = 1, pageSize = DOAJ_PAGE_SIZE) => {
    if (!query) return { results: [], total: 0 };

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://doaj.org/api/v2/search/articles/${encodedQuery}?page=${page}&pageSize=${pageSize}`;
      const response = await axios.get(url, { headers: { 'Accept': 'application/json' } });
      return response.data || { results: [], total: 0 };
    } catch (err) {
      console.error("Error fetching DOAJ articles:", err);
      return { results: [], total: 0 };
    }
  };

  const fetchAllDOAJArticles = async (query = "") => {
    if (!query) return [];

    let allArticles = [];
    let currentPage = 1;
    let totalArticles = 0;

    try {
      const firstResponse = await fetchDOAJArticles(query, 1);
      
      if (firstResponse.results?.length) {
        allArticles = [...firstResponse.results];
        totalArticles = firstResponse.total || 0;
        
        const totalPages = Math.min(Math.ceil(totalArticles / DOAJ_PAGE_SIZE), MAX_DOAJ_PAGES);
        
        for (let page = 2; page <= totalPages; page++) {
          const response = await fetchDOAJArticles(query, page);
          if (response.results?.length) {
            allArticles = [...allArticles, ...response.results];
            await new Promise(resolve => setTimeout(resolve, 200));
          } else {
            break;
          }
        }
      }
      return allArticles;
    } catch (error) {
      console.error("Failed to fetch all DOAJ articles:", error.message);
      return allArticles;
    }
  };

  const fetchPageResults = async (page = 1) => {
    const searchTerm = subject;
    const dataSources = getDataSources(subject);
    
    try {
      const [localData, doajData, doabBooks] = await Promise.all([
        dataSources.fetchLocal && journals.length ? journals : [],
        dataSources.fetchDOAJ ? fetchAllDOAJArticles(searchTerm) : [],
        dataSources.fetchDOAB ? fetchAllDOABBooks(searchTerm) : []
      ]);

      const normalizedLocal = dataSources.fetchLocal ? normalizeLocalData(localData) : [];
      const normalizedDOAJ = dataSources.fetchDOAJ ? normalizeDOAJArticles(doajData) : [];
      const normalizedDOAB = dataSources.fetchDOAB ? normalizeDOABBooks(doabBooks) : [];
      
      const combined = [...normalizedLocal, ...normalizedDOAJ, ...normalizedDOAB];
      const filteredResults = filterResults(combined, filters, subject);
      
      const totalResults = filteredResults.length;
      const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
      const startIndex = (page - 1) * RESULTS_PER_PAGE;
      const endIndex = startIndex + RESULTS_PER_PAGE;
      
      const paginatedResults = filteredResults.slice(startIndex, endIndex);
      
      return {
        results: paginatedResults,
        allResults: filteredResults,
        hasMore: page < totalPages,
        totalPages,
        dataSources
      };
    } catch (error) {
      console.error("Search failed:", error);
      return { results: [], hasMore: false };
    }
  };

  // Handlers
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setHasSearched(true);
    setCurrentPage(1);
    setIsLoading(true);
    
    try {
      const pageData = await fetchPageResults(1);
      setAllResults(pageData.allResults || []);
      setResults(pageData.results);
      setTotalPages(pageData.totalPages);
      setDataSources(pageData.dataSources);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = async (page) => {
    if (page < 1 || page > totalPages) return;
    
    setCurrentPage(page);
    setIsPageChanging(true);
    
    try {
      const startIndex = (page - 1) * RESULTS_PER_PAGE;
      const endIndex = startIndex + RESULTS_PER_PAGE;
      const paginatedResults = allResults.slice(startIndex, endIndex);
      setResults(paginatedResults);
    } finally {
      setIsPageChanging(false);
    }
    
    document.querySelector('.results-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    handleSearch();
  };

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Effects
  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    if (subject && journals.length) {
      handleSearch();
    }
  }, [subject, journals]);

  // Derived values
  const displaySubject = capitalizeSubject(subject);
  const startResult = (currentPage - 1) * RESULTS_PER_PAGE + 1;
  const endResult = startResult + results.length - 1;

  // Render
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Subject Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {displaySubject} 
            </h1>
            <p className="text-gray-600">
              Discover academic papers, journals, and books in {displaySubject}
            </p>
            {/* Data source indicator */}
            <div className="mt-3 flex justify-center">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">Searching in:</span>
                  <div className="flex gap-2">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                      Local {displaySubject}
                    </span>
                    {dataSources.fetchDOAB && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        DOAB Books
                      </span>
                    )}
                    {dataSources.fetchDOAJ && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        DOAJ Articles
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout: Side by side, Mobile Layout: Stacked */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Section */}
            <div className="lg:w-1/3 xl:w-1/4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:sticky lg:top-6">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <FiFilter className="w-5 h-5 text-blue-600 mr-3" />
                    <h2 className="text-xl font-medium text-gray-800">Search Filters</h2>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Results filtered for: <span className="font-medium text-blue-600">{displaySubject}</span>
                  </p>
                </div>
            
                <form onSubmit={handleSearch}>
                  {/* Basic Search Section */}
                  <FilterSection 
                    title="Basic Search"
                    expanded={expandedSections.basicSearch}
                    onToggle={() => toggleSection('basicSearch')}
                  >
                    <FilterInput 
                      label="Title"
                      name="title"
                      placeholder="Enter article title"
                      value={filters.title}
                      onChange={handleChange}
                    />
                    <FilterInput 
                      label="Abstract"
                      name="abstract"
                      placeholder="Search in abstract"
                      value={filters.abstract}
                      onChange={handleChange}
                    />
                    <FilterInput 
                      label="Keywords"
                      name="keywords"
                      placeholder="Search keywords"
                      value={filters.keywords}
                      onChange={handleChange}
                    />
                  </FilterSection>

                  {/* Author & Publication Info Section */}
                  <FilterSection 
                    title="Author & Publication Info"
                    expanded={expandedSections.metadata}
                    onToggle={() => toggleSection('metadata')}
                  >
                    <FilterInput 
                      label="Author Name"
                      name="creator"
                      placeholder="Author name"
                      value={filters.creator}
                      onChange={handleChange}
                    />
                    <FilterInput 
                      label="Journal/Publication"
                      name="journalOrPublicationTitle"
                      placeholder="Journal name"
                      value={filters.journalOrPublicationTitle}
                      onChange={handleChange}
                    />
                    <FilterInput 
                      label="Publisher"
                      name="publisher"
                      placeholder="Publisher name"
                      value={filters.publisher}
                      onChange={handleChange}
                    />
                  </FilterSection>

                  {/* Publication Details Section */}
                  <FilterSection 
                    title="Publication Details"
                    expanded={expandedSections.publication}
                    onToggle={() => toggleSection('publication')}
                  >
                    <FilterInput 
                      label="Date From"
                      name="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={handleChange}
                    />
                    <FilterInput 
                      label="Date To"
                      name="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={handleChange}
                    />
                    <FilterInput 
                      label="ISSN"
                      name="issn"
                      placeholder="ISSN number"
                      value={filters.issn}
                      onChange={handleChange}
                    />
                  </FilterSection>

                  {/* Classification Section */}
                  <FilterSection 
                    title="Classification & Status"
                    expanded={expandedSections.classification}
                    onToggle={() => toggleSection('classification')}
                  >
                    <FilterInput 
                      label="Publication Type"
                      name="type"
                      placeholder="Publication type"
                      value={filters.type}
                      onChange={handleChange}
                    />
                    <FilterInput 
                      label="Status"
                      name="status"
                      placeholder="Publication status"
                      value={filters.status}
                      onChange={handleChange}
                    />
                  </FilterSection>

                  {/* Action Buttons */}
                  <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col gap-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Searching...
                          </div>
                        ) : (
                          <>
                            <FiSearch className="inline w-4 h-4 mr-2" />
                            Search Results
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Results Section */}
            <div className="lg:w-2/3 xl:w-3/4">
              <ResultsSection 
                subject={displaySubject}
                hasSearched={hasSearched}
                isLoading={isLoading}
                results={results}
                allResults={allResults}
                currentPage={currentPage}
                totalPages={totalPages}
                startResult={startResult}
                endResult={endResult}
                isPageChanging={isPageChanging}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Sub-components for better organization
const FilterSection = ({ title, expanded, onToggle, children }) => (
  <div className="border-b border-gray-200">
    <div className="p-6">
      <button 
        type="button"
        className="w-full flex items-center justify-between text-left"
        onClick={onToggle}
      >
        <span className="text-blue-600 font-medium">{title}</span>
        <span className="text-blue-600">{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (
        <div className="mt-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  </div>
);

const FilterInput = ({ label, type = "text", ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type={type}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      {...props}
    />
  </div>
);

const ResultsSection = ({
  subject,
  hasSearched,
  isLoading,
  results,
  allResults,
  currentPage,
  totalPages,
  startResult,
  endResult,
  isPageChanging,
  onPageChange
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 results-container">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-medium text-gray-800">
          {hasSearched ? `${subject} Results` : subject}
        </h3>
        {hasSearched && results.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Showing {startResult}-{endResult} of {allResults.length} total results
            </div>
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Page {currentPage} of {totalPages}
            </div>
            <select className="text-sm border border-gray-300 rounded px-3 py-1 bg-white">
              <option>Sort by relevance</option>
              <option>Sort by date</option>
              <option>Sort by title</option>
            </select>
          </div>
        )}
      </div>

      {/* Pagination Controls - Top */}
      {hasSearched && results.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          isPageChanging={isPageChanging}
          onPageChange={onPageChange}
        />
      )}

      {/* Results Content */}
      {!hasSearched && !isLoading ? (
        <EmptyState 
          icon={<FiBook className="w-16 h-16 mx-auto" />}
          title={`Exploring ${subject}`}
          description={`Loading research materials related to ${subject}. Use the filters above to refine your search further.`}
        />
      ) : isLoading ? (
        <EmptyState 
          icon={<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />}
          title="Searching..."
          description={`Please wait while we search for ${subject} research across multiple academic databases.`}
        />
      ) : results.length > 0 ? (
        <div className="space-y-0 px-6 relative">
          {isPageChanging && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading page {currentPage}...</p>
              </div>
            </div>
          )}
          
          {results.map((item, idx) => (
            <ResultItem key={item._id || idx} item={item} subject={subject} />
          ))}

          {/* Pagination Controls - Bottom */}
          {hasSearched && results.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mt-6 mx-6">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                isPageChanging={isPageChanging}
                onPageChange={onPageChange}
                compact
              />
            </div>
          )}
        </div>
      ) : (
        <EmptyState 
          icon={<FiSearch className="w-16 h-16 mx-auto" />}
          title={`No ${subject} results found`}
          description="Try adjusting your search filters or browse other subject areas."
        />
      )}
    </div>
  </div>
);

const PaginationControls = ({
  currentPage,
  totalPages,
  isPageChanging,
  onPageChange,
  compact = false
}) => {
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = compact ? 5 : 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftOffset = Math.floor(maxVisible / 2);
      const rightOffset = Math.ceil(maxVisible / 2) - 1;
      
      let start, end;
      
      if (currentPage <= leftOffset) {
        start = 1;
        end = maxVisible;
      } else if (currentPage >= totalPages - rightOffset) {
        start = totalPages - maxVisible + 1;
        end = totalPages;
      } else {
        start = currentPage - leftOffset;
        end = currentPage + rightOffset;
      }
      
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        if (i > 0 && i <= totalPages) pages.push(i);
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages.map((page, idx) => (
      page === '...' ? (
        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-sm text-gray-500">...</span>
      ) : (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={isPageChanging}
          className={`px-3 py-1 text-sm border rounded ${
            currentPage === page
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white border-gray-300 hover:bg-gray-50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {page}
        </button>
      )
    ));
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isPageChanging}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      <div className="flex gap-1">
        {renderPageNumbers()}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isPageChanging}
        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
};

const EmptyState = ({ icon, title, description }) => (
  <div className="text-center py-16 px-6">
    <div className="text-blue-400 mb-4">
      {icon}
    </div>
    <h4 className="text-xl font-semibold text-gray-700 mb-2">
      {title}
    </h4>
    <p className="text-gray-500 max-w-md mx-auto">
      {description}
    </p>
  </div>
);

const ResultItem = ({ item, subject }) => {
  const detail = item.detail || {};
  
  const getItemRoute = () => {
    if (item.isDoajArticle) return `/doaj/${item._id}`;
    if (item.isDoabBook) return `/doab/${item._id}`;
    if (item.isLocalJournal) return `/paper/${item._id}`;
    return `/paper/${item._id}`;
  };

  return (
    <div className="border-b border-gray-200 py-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div className="mt-1">
          <input 
            type="checkbox" 
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
          />
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {/* Title */}
          <h3 
            className="text-lg font-medium text-blue-600 hover:text-blue-800 cursor-pointer mb-2 leading-tight"
            onClick={() => window.location.href = getItemRoute()}
          >
            {detail.title || "Untitled"}
          </h3>
          
          {/* Authors */}
          <div className="text-blue-600 text-sm mb-2">
            {(detail.creators || []).map((author, index) => (
              <span key={index}>
                <span className="hover:underline cursor-pointer">
                  {author?.firstName} {author?.lastName}
                </span>
                {index < (detail.creators || []).length - 1 && ", "}
              </span>
            )) || "Unknown Author"}
          </div>
          
          {/* Publication Info */}
          <div className="text-gray-700 text-sm mb-2 italic">
            <span className="font-medium">{detail.journalOrPublicationTitle || detail.title}</span>
            {detail.volume && <span> Vol. {detail.volume}</span>}
            {detail.number && <span>, No. {detail.number}</span>}
            {detail.publisher && <span>, {detail.publisher}</span>}
            {(detail.date || detail.publicationDate) && (
              <span> ({new Date(detail.date || detail.publicationDate).getFullYear()})</span>
            )}
          </div>

          {/* Abstract preview */}
          {detail.abstract && (
            <div className="text-gray-600 text-sm mb-3 line-clamp-2">
              {detail.abstract.substring(0, 200)}
              {detail.abstract.length > 200 && '...'}
            </div>
          )}
          
          {/* Tags/Categories */}
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Subject Match Indicator */}
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
              {subject} Related
            </span>
            
            {item.type?.typeName && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                item.isDoajArticle ? 'bg-blue-100 text-blue-800' :
                item.isDoabBook ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {item.type.typeName}
              </span>
            )}
            {item.subject?.subjectName && (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                {item.subject.subjectName}
              </span>
            )}
            {detail.status && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                {detail.status}
              </span>
            )}
            {/* Content Type Indicator */}
            {item.isDoajArticle && (
              <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs border border-green-200">
                DOAJ Article
              </span>
            )}
            {item.isDoabBook && (
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200">
                DOAB Book
              </span>
            )}
            {item.isLocalJournal && (
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs border border-purple-200">
                Local Journal
              </span>
            )}
            {!item.isDoajArticle && !item.isDoabBook && !item.isLocalJournal && (
              <span className="bg-gray-50 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200">
                Other
              </span>
            )}
          </div>

          {/* External link */}
          {detail.officialURL && (
            <div className="mt-2">
              <a
                href={detail.officialURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <FiExternalLink className="w-3 h-3" />
                <span>View Full Text</span>
              </a>
            </div>
          )}
        </div>
        
        {/* Action Menu */}
        <div className="flex items-start mt-1">
          <button className="text-gray-400 hover:text-gray-600 p-1" title="More options">
            <span className="text-lg">⋯</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypeSearchPage;