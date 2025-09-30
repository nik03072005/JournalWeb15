"use client";
import React, { useEffect, useState, useCallback ,useMemo} from "react";
import axios from "axios";
import { useParams, useRouter } from 'next/navigation';
import Navbar2 from "@/components/Navbar2";
import VisitorBadge from "@/components/VisitorBadge";

// Constants
const RESULTS_PER_PAGE = 10;
const MAX_VISIBLE_PAGES = 5;
const INITIAL_FILTERS = {
  type: '',
  publisher: '',
  subject: '',
  dateFrom: '',
  dateTo: ''
};
const INITIAL_EXPANDED_SECTIONS = {
  typeDeposit: true,
  documentType: true,
  subjectField: true,
  year: true,
  language: true
};

const SearchPage = () => {
  // Hooks and state initialization
  const params = useParams();
  const router = useRouter();
  const initialSearchTerm = decodeURIComponent(params.searchTerm || '');
  
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [currentSearchTerm, setCurrentSearchTerm] = useState(initialSearchTerm);
  const [loading, setLoading] = useState(!!initialSearchTerm);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [allResults, setAllResults] = useState([]);
  const [doajResults, setDoajResults] = useState([]);
  const [doajJournalResults, setDoajJournalResults] = useState([]);
  const [doabResults, setDoabResults] = useState([]);
  const [localResults, setLocalResults] = useState([]);
  const [doajPagination, setDoajPagination] = useState(null);
  const [doajJournalPagination, setDoajJournalPagination] = useState(null);
  const [doabPagination, setDoabPagination] = useState(null);
  const [doajTotalCount, setDoajTotalCount] = useState(0);
  const [doajJournalTotalCount, setDoajJournalTotalCount] = useState(0);
  const [doabTotalCount, setDoabTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState('articles');
  const [showFilters, setShowFilters] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [expandedSections, setExpandedSections] = useState(INITIAL_EXPANDED_SECTIONS);

  // API fetch functions
  const fetchDOAJArticles = useCallback(async (query = "", page = 1) => {
    if (!query) return { results: [], pagination: null };
    const encodedQuery = encodeURIComponent(query);
    const url = `https://doaj.org/api/v2/search/articles/${query}?page=${page}`;

    try {
      const response = await axios.get(url, { headers: { 'Accept': 'application/json' } });
      console.log("DOAJ Data from api:", response.data);
      return {
        results: response.data?.results || [],
        pagination: {
          prev: response.data?.prev || null,
          next: response.data?.next || null,
          page: response.data?.page || 1,
          pageSize: response.data?.pageSize || 10,
          total: response.data?.total || 0,
          last: response.data?.last || null
        }
      };
    } catch (err) {
      console.error("Error fetching DOAJ articles:", err);
      return { results: [], pagination: null };
    }
  }, []);

  const fetchDOAJJournals = useCallback(async (query = "", page = 1) => {
    if (!query) return { results: [], pagination: null };
    const encodedQuery = encodeURIComponent(query);
    const url = `https://doaj.org/api/search/journals/${encodedQuery}?page=${page}`;

    try {
      const response = await axios.get(url, { headers: { 'Accept': 'application/json' } });
      console.log("DOAJ Journals Data from api:", response.data);
      return {
        results: response.data?.results || [],
        pagination: {
          prev: response.data?.prev || null,
          next: response.data?.next || null,
          page: response.data?.page || 1,
          pageSize: response.data?.pageSize || 10,
          total: response.data?.total || 0,
          last: response.data?.last || null
        }
      };
    } catch (err) {
      console.error("Error fetching DOAJ journals:", err);
      return { results: [], pagination: null };
    }
  }, []);

  const fetchDOABBooks = useCallback(async (query = "", page = 1, limit = 20) => {
    if (!query) return { results: [], pagination: null };
    const encodedQuery = encodeURIComponent(query);

    try {
      const response = await axios.get(
        `/api/doab-search?query=${encodedQuery}&expand=metadata&page=${page}&limit=${limit}`,
        {
          timeout: 30000 // 30 seconds timeout for DOAB API
        }
      );
      console.log("DOAB Data from api:", response.data);

      return response.data;
    } catch (error) {
      console.error("Failed to fetch DOAB books:", error.message);
      
      // If it's a timeout error, try without metadata
      if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
        console.log("DOAB request timed out, trying with basic search...");
        try {
          const fallbackResponse = await axios.get(
            `/api/doab-search?query=${encodedQuery}&page=${page}&limit=${Math.min(limit, 10)}`,
            {
              timeout: 15000 // 15 seconds for fallback
            }
          );
          return fallbackResponse.data;
        } catch (fallbackError) {
          console.error("Fallback DOAB request also failed:", fallbackError.message);
          return { results: [], pagination: null };
        }
      }
      
      return { results: [], pagination: null };
    }
  }, []);

  // Data normalization functions
  const normalizeDOAJArticles = useCallback((articles) => {
    return articles.map((item) => {
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
        type: "Open Access Article",
        subject: {
          subjectName: (bib.subject || [])[0]?.term || ""
        }
      };
    });
  }, []);

  const formatDOAJJournals = useCallback((results) => {
    return results.map(journal => {
      const bibjson = journal.bibjson || {};
      const editorial = bibjson.editorial || {};
      const license = bibjson.license ? bibjson.license[0] : {};
      const publisher = bibjson.publisher || {};
      const subject = bibjson.subject ? bibjson.subject[0] : {};
      
      return {
        _id: journal.id,
        isDoajJournal: true,
        detail: {
          title: bibjson.title || 'Untitled Journal',
          abstract: bibjson.description || editorial.description || "",
          creators: publisher.name ? [{
            firstName: publisher.name.split(" ")[0] || "",
            lastName: publisher.name.split(" ").slice(1).join(" ") || ""
          }] : [],
          date: bibjson.oa_start ? `${bibjson.oa_start}-01-01` : "",
          publicationDate: bibjson.oa_start ? `${bibjson.oa_start}-01-01` : "",
          issn: `${bibjson.pissn || ''} ${bibjson.eissn || ''}`.trim(),
          journalOrPublicationTitle: bibjson.title || 'Untitled Journal',
          keywords: (bibjson.keywords || []).join(", "),
          publisher: publisher.name || "",
          status: "Open Access Journal",
          officialURL: bibjson.ref?.journal || "",
        },
        type: "Open Access Journal",
        subject: {
          subjectName: subject.term || ""
        },
        journalDetails: {
          alternativeTitle: bibjson.alternative_title || '',
          issn: {
            print: bibjson.pissn || '',
            electronic: bibjson.eissn || ''
          },
          publisher: {
            name: publisher.name || '',
            country: publisher.country || ''
          },
          subjects: bibjson.subject?.map(sub => ({
            term: sub.term || '',
            code: sub.code || '',
            scheme: sub.scheme || ''
          })) || [],
          languages: bibjson.language || [],
          license: {
            type: license.type || '',
            url: license.url || '',
            BY: license.BY || false,
            NC: license.NC || false,
            ND: license.ND || false,
            SA: license.SA || false
          },
          editorial: {
            reviewProcess: editorial.review_process || [],
            reviewUrl: editorial.review_url || '',
            boardUrl: editorial.board_url || ''
          },
          openAccess: {
            startYear: bibjson.oa_start || null,
            statementUrl: bibjson.ref?.oa_statement || ''
          },
          apc: bibjson.apc?.has_apc ? {
            hasApc: true,
            amount: bibjson.apc.max || [],
            url: bibjson.apc.url || ''
          } : { hasApc: false },
          preservation: bibjson.preservation?.has_preservation ? {
            services: bibjson.preservation.service || [],
            url: bibjson.preservation.url || ''
          } : { hasPreservation: false },
          dates: {
            created: journal.created_date,
            updated: journal.last_updated
          },
          urls: {
            journal: bibjson.ref?.journal || '',
            authorInstructions: bibjson.ref?.author_instructions || '',
            aimsScope: bibjson.ref?.aims_scope || ''
          }
        }
      };
    });
  }, []);

  const normalizeDOABBooks = useCallback((books) => {
    console.log(`Normalizing ${books.length} DOAB books`);
    if (books.length > 0) {
      console.log("First book to normalize:", books[0]);
    }
    
    const normalizedBooks = books.map((book) => {
      // Function to get metadata value (for books with metadata)
      const getMetadataValue = (key) => {
        const metadataItem = book.metadata?.find(m => m.key === key);
        return metadataItem?.value || "";
      };

      // Check if this book has metadata or is a basic book object
      const hasMetadata = book.metadata && Array.isArray(book.metadata);
      
      let title, abstract, editor, dateIssued, doi, publisher, subject;
      
      if (hasMetadata) {
        // Book with metadata - use metadata extraction
        title = getMetadataValue('dc.title');
        abstract = getMetadataValue('dc.description.abstract');
        editor = getMetadataValue('dc.contributor.editor');
        dateIssued = getMetadataValue('dc.date.issued');
        doi = getMetadataValue('oapen.identifier.doi');
        publisher = getMetadataValue('publisher.name');
        subject = getMetadataValue('dc.subject.other');
      } else {
        // Basic book object - use direct properties (try multiple possible property names)
        title = book.title || book.name || book.dc_title || book['dc.title'] || "";
        abstract = book.description || book.abstract || book.dc_description || book['dc.description'] || "";
        editor = book.author || book.editor || book.creator || book.dc_creator || book['dc.creator'] || "";
        dateIssued = book.year || book.date || book.dc_date || book['dc.date'] || "";
        doi = book.doi || book.identifier || "";
        publisher = book.publisher || book.dc_publisher || book['dc.publisher'] || "";
        subject = book.subject || book.dc_subject || book['dc.subject'] || "";
      }

      return {
        _id: book.handle || `doab-${Math.random()}`,
        isDoabBook: true,
        detail: {
          title: title,
          abstract: abstract,
          creators: editor ? [{
            firstName: editor.split(" ")[0] || "",
            lastName: editor.split(" ").slice(1).join(" ") || ""
          }] : [],
          date: dateIssued ? `${dateIssued}-01-01` : "",
          publicationDate: dateIssued ? `${dateIssued}-01-01` : "",
          issn: "",
          journalOrPublicationTitle: publisher,
          keywords: subject,
          publisher: publisher,
          status: "Open Access",
          officialURL: `https://directory.doabooks.org${book.link}` || "",
          doi: doi,
        },
        type: "Open Access Book",
        subject: {
          subjectName: subject
        }
      };
    });
    
    console.log(`Normalized ${books.length} DOAB books successfully`);
    return normalizedBooks;
  }, []);

  // Main search function
  const performCombinedSearch = useCallback(async (searchTerm) => {
    try {
      setLoading(true);
      setAllResults([]);
      setDoajResults([]);
      setDoajJournalResults([]);
      setDoabResults([]);
      setLocalResults([]);
      setDoajTotalCount(0);
      setDoajJournalTotalCount(0);
      setDoabTotalCount(0);

      const [localData, doajResponse, doajJournalResponse, doabResponse] = await Promise.all([
        axios.get(`/api/journal`).then(res => res.data.journals).catch(() => []),
        fetchDOAJArticles(searchTerm, 1),
        fetchDOAJJournals(searchTerm, 1),
        fetchDOABBooks(searchTerm, 1, 20)
      ]);
      console.log("DOAJ Articles Response:", doajResponse);
      console.log("DOAJ Journals Response:", doajJournalResponse);
      console.log("DOAB Response:", doabResponse);
      
      // Debug DOAB books structure
      if (doabResponse.results && doabResponse.results.length > 0) {
        console.log("Sample DOAB book structure:", doabResponse.results[0]);
      }

      const normalizedDOAJ = normalizeDOAJArticles(doajResponse.results || []);
      const normalizedDOAJJournals = formatDOAJJournals(doajJournalResponse.results || []);
      const normalizedDOAB = normalizeDOABBooks(doabResponse.results || []);
      
      console.log(`Normalized DOAJ Articles: ${normalizedDOAJ.length} articles`);
      console.log(`Normalized DOAJ Journals: ${normalizedDOAJJournals.length} journals`);
      console.log(`Normalized DOAB: ${normalizedDOAB.length} books`);
      
      const combinedResults = [...localData, ...normalizedDOAJ, ...normalizedDOAJJournals, ...normalizedDOAB];
      console.log("Combined Results:", combinedResults);
      
      setAllResults(combinedResults);
      setLocalResults(localData);
      setDoajResults(normalizedDOAJ);
      setDoajJournalResults(normalizedDOAJJournals);
      setDoabResults(normalizedDOAB);
      setDoajPagination(doajResponse.pagination);
      setDoajJournalPagination(doajJournalResponse.pagination);
      setDoabPagination(doabResponse.pagination);
      setDoajTotalCount(doajResponse.pagination?.total || 0);
      setDoajJournalTotalCount(doajJournalResponse.pagination?.total || 0);
      setDoabTotalCount(doabResponse.pagination?.totalResults || 0);
    } catch (error) {
      console.error("Search failed:", error);
      setAllResults([]);
      setLocalResults([]);
      setDoajResults([]);
      setDoajJournalResults([]);
      setDoabResults([]);
      setDoajTotalCount(0);
      setDoajJournalTotalCount(0);
      setDoabTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [fetchDOAJArticles, fetchDOAJJournals, fetchDOABBooks, normalizeDOAJArticles, formatDOAJJournals, normalizeDOABBooks]);

  // Event handlers
  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm) {
      router.push(`/search/${encodeURIComponent(trimmedTerm)}`);
    }
  };

  const handleInputChange = (e) => setSearchTerm(e.target.value);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    setIsPageChanging(true);
    
    setTimeout(() => {
      setIsPageChanging(false);
      document.querySelector('.results-container')?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }, []);

  // Handle DOAJ pagination using API links
  const handleDoajPagination = useCallback(async (url) => {
    if (!url) return;
    
    setLoading(true);
    try {
      const response = await axios.get(url, { headers: { 'Accept': 'application/json' } });
      const normalizedDOAJ = normalizeDOAJArticles(response.data?.results || []);
      setDoajResults(normalizedDOAJ);
      setDoajPagination({
        prev: response.data?.prev || null,
        next: response.data?.next || null,
        page: response.data?.page || 1,
        pageSize: response.data?.pageSize || 10,
        total: response.data?.total || 0,
        last: response.data?.last || null
      });
    } catch (error) {
      console.error("Failed to fetch DOAJ page:", error);
    } finally {
      setLoading(false);
    }
  }, [normalizeDOAJArticles]);

  // Handle DOAJ Journal pagination using API links
  const handleDoajJournalPagination = useCallback(async (url) => {
    if (!url) return;
    
    setLoading(true);
    try {
      const response = await axios.get(url, { headers: { 'Accept': 'application/json' } });
      const normalizedDOAJJournals = formatDOAJJournals(response.data?.results || []);
      setDoajJournalResults(normalizedDOAJJournals);
      setDoajJournalPagination({
        prev: response.data?.prev || null,
        next: response.data?.next || null,
        page: response.data?.page || 1,
        pageSize: response.data?.pageSize || 10,
        total: response.data?.total || 0,
        last: response.data?.last || null
      });
    } catch (error) {
      console.error("Failed to fetch DOAJ journals page:", error);
    } finally {
      setLoading(false);
    }
  }, [formatDOAJJournals]);

  // Handle DOAB pagination
  const handleDoabPagination = useCallback(async (page) => {
    if (!currentSearchTerm || !page) return;
    
    setLoading(true);
    try {
      const doabResponse = await fetchDOABBooks(currentSearchTerm, page, 20);
      const normalizedDOAB = normalizeDOABBooks(doabResponse.results || []);
      setDoabResults(normalizedDOAB);
      setDoabPagination(doabResponse.pagination);
    } catch (error) {
      console.error("Failed to fetch DOAB page:", error);
    } finally {
      setLoading(false);
    }
  }, [currentSearchTerm, fetchDOABBooks, normalizeDOABBooks]);

  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    // Don't reset filters when switching tabs - allow filtering across all tabs
  };

  // Filter and pagination logic
  const getActiveResults = () => {
    switch (activeTab) {
      case 'articles':
        return doajResults;
      case 'journals':
        return doajJournalResults;
      case 'books':
        return doabResults;
      case 'home':
        return localResults;
      default:
        return [];
    }
  };

  const filteredJournals = useMemo(() => {
    const activeResults = getActiveResults();
    const lowerSearch = currentSearchTerm.toLowerCase();
    
    return activeResults.filter((journal) => {
      // Text search filter - apply to all tabs
      const matchesSearch = !currentSearchTerm || (
        journal.detail?.title?.toLowerCase().includes(lowerSearch) ||
        journal.detail?.journalOrPublicationTitle?.toLowerCase().includes(lowerSearch) ||
        journal.detail?.publisher?.toLowerCase().includes(lowerSearch) ||
        journal.subject?.subjectName?.toLowerCase().includes(lowerSearch) ||
        journal.type?.toLowerCase().includes(lowerSearch) ||
        (typeof journal.type === 'string' && journal.type.toLowerCase().includes(lowerSearch)) ||
        journal.detail?.abstract?.toLowerCase().includes(lowerSearch) ||
        journal.detail?.keywords?.toLowerCase().includes(lowerSearch)
      );

      // Type filter - apply to all tabs
      const matchesType = !filters.type || 
        (journal.type?.toLowerCase && journal.type.toLowerCase().includes(filters.type.toLowerCase())) ||
        (typeof journal.type === 'string' && journal.type.toLowerCase().includes(filters.type.toLowerCase()));

      // Publisher filter - apply to all tabs
      const matchesPublisher = !filters.publisher || 
        journal.detail?.publisher?.toLowerCase().includes(filters.publisher.toLowerCase());

      // Subject filter - apply to all tabs
      const matchesSubject = !filters.subject || 
        journal.subject?.subjectName?.toLowerCase().includes(filters.subject.toLowerCase());

      // Date filter - apply to all tabs
      const journalDate = new Date(journal.detail?.date || journal.detail?.publicationDate || journal.date);
      const matchesDateFrom = !filters.dateFrom || (
        journalDate.getFullYear().toString() === filters.dateFrom || 
        journalDate >= new Date(filters.dateFrom)
      );
      const matchesDateTo = !filters.dateTo || journalDate <= new Date(filters.dateTo);

      return matchesSearch && matchesType && matchesPublisher && matchesSubject && matchesDateFrom && matchesDateTo;
    });
  }, [doajResults, doajJournalResults, doabResults, localResults, activeTab, currentSearchTerm, filters]);

  // Pagination calculations
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIndex = startIndex + RESULTS_PER_PAGE;
  // For DOAJ articles, DOAJ journals, and DOAB books, show all results from the current API page
  // For home tab, use local pagination
  const currentPageResults = (activeTab === 'articles' || activeTab === 'journals' || activeTab === 'books') ? filteredJournals : filteredJournals.slice(startIndex, endIndex);
  const totalPages = (activeTab === 'articles' || activeTab === 'journals' || activeTab === 'books') ? 1 : Math.ceil(filteredJournals.length / RESULTS_PER_PAGE);
  const totalResults = filteredJournals.length;

  // Get unique values for filter dropdowns
  const uniqueTypes = useMemo(() => {
    const activeResults = getActiveResults();
    return [...new Set(activeResults.map(j => 
      typeof j.type === 'string' ? j.type : j.type?.typeName || j.type
    ).filter(Boolean))];
  }, [doajResults, doajJournalResults, doabResults, localResults, activeTab]);

  const uniquePublishers = useMemo(() => {
    const activeResults = getActiveResults();
    return [...new Set(activeResults.map(j => j.detail?.publisher).filter(Boolean))];
  }, [doajResults, doajJournalResults, doabResults, localResults, activeTab]);

  const uniqueSubjects = useMemo(() => {
    const activeResults = getActiveResults();
    return [...new Set(activeResults.map(j => j.subject?.subjectName).filter(Boolean))];
  }, [doajResults, doajJournalResults, doabResults, localResults, activeTab]);

  const uniqueYears = useMemo(() => {
    const activeResults = getActiveResults();
    const years = [...new Set(activeResults.map(j => {
      const date = new Date(j.detail?.date || j.detail?.publicationDate || j.date);
      return !isNaN(date.getTime()) ? date.getFullYear().toString() : null;
    }).filter(Boolean))];
    return years.sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending
  }, [doajResults, doajJournalResults, doabResults, localResults, activeTab]);

  // Effects
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentSearchTerm) {
      setCurrentPage(1);
      performCombinedSearch(currentSearchTerm);
    } else {
      setLoading(false);
    }
  }, [currentSearchTerm, performCombinedSearch]);

  useEffect(() => {
    const newSearchTerm = decodeURIComponent(params.searchTerm || '');
    setCurrentSearchTerm(newSearchTerm);
    setSearchTerm(newSearchTerm);
  }, [params.searchTerm]);

  // Set default active tab when results are available
  useEffect(() => {
    if (doajResults.length > 0 && activeTab === 'articles') return;
    if (doajJournalResults.length > 0 && activeTab === 'journals') return;
    if (doabResults.length > 0 && activeTab === 'books') return;
    if (localResults.length > 0 && activeTab === 'home') return;
    
    // Set default tab based on available results
    if (doajResults.length > 0) {
      setActiveTab('articles');
    } else if (doajJournalResults.length > 0) {
      setActiveTab('journals');
    } else if (doabResults.length > 0) {
      setActiveTab('books');
    } else if (localResults.length > 0) {
      setActiveTab('home');
    }
  }, [doajResults, doajJournalResults, doabResults, localResults, activeTab]);

  // Render helper components
  const renderDoajPagination = () => {
    if (!doajPagination || activeTab !== 'articles') return null;

    const currentPage = doajPagination.page || 1;
    const totalPages = Math.ceil((doajPagination.total || 0) / (doajPagination.pageSize || 10));

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-sm text-gray-600">
          DOAJ Articles - Page {currentPage} of {totalPages} ({doajPagination.total?.toLocaleString()} total articles)
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDoajPagination(doajPagination.prev)}
            disabled={!doajPagination.prev || loading}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : 'Previous'}
          </button>
          
          <span className="px-2 py-1 text-sm text-gray-600">
            Page {currentPage}
          </span>
          
          <button
            onClick={() => handleDoajPagination(doajPagination.next)}
            disabled={!doajPagination.next || loading}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : 'Next'}
          </button>
          
          {doajPagination.last && (
            <button
              onClick={() => handleDoajPagination(doajPagination.last)}
              disabled={loading || currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Last
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDoajJournalPagination = () => {
    if (!doajJournalPagination || activeTab !== 'journals') return null;

    const currentPage = doajJournalPagination.page || 1;
    const totalPages = Math.ceil((doajJournalPagination.total || 0) / (doajJournalPagination.pageSize || 10));

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-sm text-gray-600">
          DOAJ Journals - Page {currentPage} of {totalPages} ({doajJournalPagination.total?.toLocaleString()} total journals)
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDoajJournalPagination(doajJournalPagination.prev)}
            disabled={!doajJournalPagination.prev || loading}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : 'Previous'}
          </button>
          
          <span className="px-2 py-1 text-sm text-gray-600">
            Page {currentPage}
          </span>
          
          <button
            onClick={() => handleDoajJournalPagination(doajJournalPagination.next)}
            disabled={!doajJournalPagination.next || loading}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : 'Next'}
          </button>
          
          {doajJournalPagination.last && (
            <button
              onClick={() => handleDoajJournalPagination(doajJournalPagination.last)}
              disabled={loading || currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Last
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDoabPagination = () => {
    if (!doabPagination || activeTab !== 'books') return null;

    const currentPage = doabPagination.currentPage || 1;
    const totalPages = doabPagination.totalPages || 1;
    const totalResults = doabPagination.totalResults || 0;

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-sm text-gray-600">
          DOAB Books - Page {currentPage} of {totalPages} ({totalResults?.toLocaleString()} total books)
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDoabPagination(currentPage - 1)}
            disabled={!doabPagination.hasPrevious || loading}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : 'Previous'}
          </button>
          
          <span className="px-2 py-1 text-sm text-gray-600">
            Page {currentPage}
          </span>
          
          <button
            onClick={() => handleDoabPagination(currentPage + 1)}
            disabled={!doabPagination.hasMore || loading}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : 'Next'}
          </button>
          
          {totalPages > 1 && currentPage < totalPages && (
            <button
              onClick={() => handleDoabPagination(totalPages)}
              disabled={loading || currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Last
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    // Use DOAJ pagination for articles tab
    if (activeTab === 'articles') {
      return renderDoajPagination();
    }
    
    // Use DOAJ journal pagination for journals tab
    if (activeTab === 'journals') {
      return renderDoajJournalPagination();
    }
    
    // Use DOAB pagination for books tab
    if (activeTab === 'books') {
      return renderDoabPagination();
    }
    
    // Use regular pagination for home tab only
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      let startPage, endPage;
      
      if (totalPages <= MAX_VISIBLE_PAGES) {
        startPage = 1;
        endPage = totalPages;
      } else {
        if (currentPage <= 3) {
          startPage = 1;
          endPage = MAX_VISIBLE_PAGES;
        } else if (currentPage >= totalPages - 2) {
          startPage = totalPages - MAX_VISIBLE_PAGES + 1;
          endPage = totalPages;
        } else {
          startPage = currentPage - 2;
          endPage = currentPage + 2;
        }
      }
      
      const pages = [];
      
      if (startPage > 1) {
        pages.push(renderPageButton(1));
        if (startPage > 2) pages.push(<span key="ellipsis1" className="px-2 py-1 text-gray-500">...</span>);
      }
      
      for (let page = startPage; page <= endPage; page++) {
        pages.push(renderPageButton(page));
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push(<span key="ellipsis2" className="px-2 py-1 text-gray-500">...</span>);
        pages.push(renderPageButton(totalPages));
      }
      
      return pages;
    };

    const renderPageButton = (page) => (
      <button
        key={page}
        onClick={() => handlePageChange(page)}
        disabled={isPageChanging}
        className={`px-3 py-1 border rounded-md disabled:cursor-not-allowed transition-colors ${
          currentPage === page
            ? 'bg-blue-600 text-white border-blue-600'
            : 'border-gray-300 hover:bg-gray-50'
        }`}
      >
        {isPageChanging && currentPage === page ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          page
        )}
      </button>
    );

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages} ({totalResults} total results)
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isPageChanging}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            {isPageChanging && currentPage > 1 ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : 'Previous'}
          </button>
          
          <div className="flex gap-1">{getPageNumbers()}</div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isPageChanging}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            {isPageChanging && currentPage < totalPages ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : 'Next'}
          </button>
        </div>
      </div>
    );
  };

  const renderFilterSection = (title, sectionName, items, filterKey, renderItem) => (
    <div className="border-b border-gray-200">
      <div className="p-4">
        <button 
          className="w-full flex items-center justify-between text-left"
          onClick={() => toggleSection(sectionName)}
        >
          <span className="text-blue-600 font-medium">{title}</span>
          <span className="text-blue-600">{expandedSections[sectionName] ? '▼' : '▶'}</span>
        </button>
        {expandedSections[sectionName] && (
          <div className="mt-3 space-y-2">
            {items.map(item => renderItem(item, filterKey))}
          </div>
        )}
      </div>
    </div>
  );

  const renderFilterItem = (item, filterKey) => {
    const activeResults = getActiveResults();
    const count = activeResults.filter(j => {
      if (filterKey === 'type') {
        return (typeof j.type === 'string' ? j.type : j.type?.typeName) === item;
      } else if (filterKey === 'subject') {
        return j.subject?.subjectName === item;
      } else if (filterKey === 'publisher') {
        return j.detail?.publisher === item;
      } else if (filterKey === 'dateFrom') {
        // For year filtering, check if the publication year matches
        const journalDate = new Date(j.detail?.date || j.detail?.publicationDate || j.date);
        return !isNaN(journalDate.getTime()) && journalDate.getFullYear().toString() === item;
      }
      return false;
    }).length;

    return (
      <label key={item} className="flex items-center justify-between text-sm hover:bg-gray-50 rounded p-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters[filterKey] === item}
            onChange={(e) => handleFilterChange({
              target: { name: filterKey, value: e.target.checked ? item : '' }
            })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-gray-700">{item}</span>
        </div>
        <span className="text-gray-500 text-xs">{count}</span>
      </label>
    );
  };

  const renderJournalItem = (journal, idx) => (
    <li key={journal._id || idx} className="border-b border-gray-200 py-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <input 
            type="checkbox" 
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
          />
        </div>
        
        <div className="flex-1">
          <h3 
            className="text-lg font-medium text-blue-600 hover:text-blue-800 cursor-pointer mb-2 leading-tight"
            onClick={() => {
              if (journal.isDoajArticle) {
                router.push(`/doaj/${journal._id}`);
              } else if (journal.isDoajJournal) {
                router.push(`/doaj/journal/${journal._id}`);
              } else if (journal.isDoabBook) {
                router.push(`/doab/${journal._id.replace('doab-', '')}`);
              } else {
                router.push(`/paper/${journal._id}`);
              }
            }}
          >
            {journal.detail?.title || journal.detail?.journalOrPublicationTitle || "Untitled"}
          </h3>
          
          <div className="flex items-center gap-2 mb-2">
            {journal.isDoajArticle && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                DOAJ Article
              </span>
            )}
            {journal.isDoajJournal && (
              <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs font-medium">
                DOAJ Journal
              </span>
            )}
            {journal.isDoabBook && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                DOAB Book
              </span>
            )}
            {!journal.isDoajArticle && !journal.isDoajJournal && !journal.isDoabBook && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                Local Database
              </span>
            )}
            <VisitorBadge 
              paperId={journal._id} 
              paperType={
                journal.isDoajArticle ? 'doaj' : 
                journal.isDoajJournal ? 'doaj-journal' :
                journal.isDoabBook ? 'doab' : 
                'local'
              }
              className="ml-auto"
            />
          </div>
          
          <div className="text-blue-600 text-sm mb-2">
            {journal?.detail?.creators?.map((author, index) => (
              <span key={index}>
                <span className="hover:underline cursor-pointer">
                  {author?.firstName} {author?.lastName}
                </span>
                {index < journal.detail.creators.length - 1 && ", "}
              </span>
            )) || "Unknown Author"}
          </div>
          
          <div className="text-gray-700 text-sm mb-2 italic">
            <span className="font-medium">{journal.detail?.journalOrPublicationTitle || journal.detail?.title}</span>
            {journal.detail?.volume && <span> Vol. {journal.detail.volume}</span>}
            {journal.detail?.publisher && (
              <span>, {journal.isDoabBook ? 'Publisher' : 'Book Publisher'} {journal.detail.publisher}</span>
            )}
            {(journal.detail?.publicationDate || journal.detail?.date) && (
              <span> ({new Date(journal.detail.publicationDate || journal.detail.date).getFullYear()})</span>
            )}
          </div>
          
          {journal.detail?.abstract && (
            <div className="text-gray-600 text-sm mb-3 line-clamp-2">
              {journal.detail.abstract.substring(0, 200)}
              {journal.detail.abstract.length > 200 && '...'}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mb-3">
            {journal.type && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                {typeof journal.type === 'string' ? journal.type : journal.type.typeName}
              </span>
            )}
            {journal.subject?.subjectName && (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                {journal.subject.subjectName}
              </span>
            )}
            {journal.detail?.status && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                {journal.detail.status}
              </span>
            )}
          </div>
          
          {journal.detail?.officialURL && (
            <div className="mt-2">
              <a
                href={journal.detail.officialURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <span>View Full Text</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
        
        <div className="flex items-start mt-1">
          <button className="text-gray-400 hover:text-gray-600 p-1" title="More options">
            <span className="text-lg">⋯</span>
          </button>
        </div>
      </div>
    </li>
  );

  return (
    <div className="min-h-screen bg-blue-900">
      <div className="bg-white py-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSearch} className="flex items-center gap-4 pl-4 pr-4">
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              className="w-full text-2xl p-3 rounded-md border border-gray-300 focus:border-blue-500 outline-none transition-colors mb-4"
              placeholder="Search journals..."
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white border-none rounded-md p-3 text-lg cursor-pointer hover:bg-blue-600 transition-colors mb-4 min-w-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
              ) : (
                <span role="img" aria-label="search">🔍</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Filter Section */}
      {windowWidth < 768 && (
        <div className="bg-gray-100 border-b border-gray-200 py-4">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <span className="text-lg">{showFilters ? '▼' : '▶'}</span>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              {(Object.values(filters).some(Boolean)) && (
                <button
                  onClick={clearFilters}
                  className="bg-transparent border border-red-500 rounded-md px-4 py-2 text-red-500 text-sm font-medium hover:bg-red-500 hover:text-white transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            {showFilters && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {renderFilterSection("Type of deposit", "typeDeposit", uniqueTypes, "type", renderFilterItem)}
                {renderFilterSection("Document type", "documentType", uniqueTypes.filter(type => 
                  type.toLowerCase().includes('article') || 
                  type.toLowerCase().includes('journal') || 
                  type.toLowerCase().includes('book')
                ), "type", renderFilterItem)}
                {renderFilterSection("Subject field", "subjectField", uniqueSubjects.slice(0, 10), "subject", renderFilterItem)}
                {renderFilterSection("Year", "year", uniqueYears.slice(0, 10), "dateFrom", renderFilterItem)}
                {renderFilterSection("Publisher", "publisher", uniquePublishers.slice(0, 10), "publisher", renderFilterItem)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-gray-100 py-8">
        <div className="flex justify-between px-8">
          {/* Desktop Filter Sidebar */}
          {windowWidth >= 768 && (
            <div className="w-72 sticky top-5">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {renderFilterSection("Type of deposit", "typeDeposit", uniqueTypes, "type", renderFilterItem)}
                {renderFilterSection("Document type", "documentType", uniqueTypes.filter(type => 
                  type.toLowerCase().includes('article') || 
                  type.toLowerCase().includes('journal') || 
                  type.toLowerCase().includes('book')
                ), "type", renderFilterItem)}
                {renderFilterSection("Subject field", "subjectField", uniqueSubjects.slice(0, 10), "subject", renderFilterItem)}
                {renderFilterSection("Year", "year", uniqueYears.slice(0, 10), "dateFrom", renderFilterItem)}
                {renderFilterSection("Publisher", "publisher", uniquePublishers.slice(0, 10), "publisher", renderFilterItem)}

                {(Object.values(filters).some(Boolean)) && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={clearFilters}
                      className="w-full bg-red-50 border border-red-200 rounded px-3 py-2 text-red-600 text-sm font-medium hover:bg-red-100 transition-all"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Section */}
          <div className="flex-1 w-full md:max-w-[calc(100%-324px)] mx-auto md:mx-0 md:px-0">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md mb-4">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6 py-4">
                  <button
                    onClick={() => handleTabChange('articles')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'articles'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Articles ({doajTotalCount?.toLocaleString() || 0})
                  </button>
                  <button
                    onClick={() => handleTabChange('journals')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'journals'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Journals ({doajJournalTotalCount?.toLocaleString() || 0})
                  </button>
                  <button
                    onClick={() => handleTabChange('books')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'books'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Books ({doabTotalCount?.toLocaleString() || 0})
                  </button>
                  <button
                    onClick={() => handleTabChange('home')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'home'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Home Library ({localResults.length})
                  </button>
                </nav>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 results-container relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl">
                  {activeTab === 'articles' ? (
                    doajPagination ? 
                      `${doajPagination.total?.toLocaleString() || 0} Articles found` : 
                      `${filteredJournals.length} Articles`
                  ) : activeTab === 'journals' ? (
                    doajJournalPagination ? 
                      `${doajJournalPagination.total?.toLocaleString() || 0} Journals found` : 
                      `${filteredJournals.length} Journals`
                  ) : activeTab === 'books' ? (
                    doabPagination ? 
                      `${doabPagination.totalResults?.toLocaleString() || 0} Books found` : 
                      `${filteredJournals.length} Books`
                  ) : (
                    `${filteredJournals.length} Home Library Results`
                  )} for "{currentSearchTerm}"
                </h2>
                {/* Show current page info for home tab only */}
                {filteredJournals.length > RESULTS_PER_PAGE && activeTab === 'home' && (
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredJournals.length)} of {filteredJournals.length}
                  </div>
                )}
                {/* Show current page info for DOAJ articles */}
                {activeTab === 'articles' && doajPagination && (
                  <div className="text-sm text-gray-600">
                    Showing {filteredJournals.length} of {doajPagination.pageSize || 10} results on page {doajPagination.page || 1}
                  </div>
                )}
                {/* Show current page info for DOAJ journals */}
                {activeTab === 'journals' && doajJournalPagination && (
                  <div className="text-sm text-gray-600">
                    Showing {filteredJournals.length} of {doajJournalPagination.pageSize || 10} results on page {doajJournalPagination.page || 1}
                  </div>
                )}
                {/* Show current page info for DOAB books */}
                {activeTab === 'books' && doabPagination && (
                  <div className="text-sm text-gray-600">
                    Showing {filteredJournals.length} of {doabPagination.limit || 20} results on page {doabPagination.currentPage || 1}
                  </div>
                )}
              </div>
              
              {/* Loading State */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Searching across multiple databases...</span>
                </div>
              ) : filteredJournals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">No results found.</div>
                  <div className="text-gray-400 text-sm mt-2">Try adjusting your search terms or filters.</div>
                </div>
              ) : (
                <>
                  {/* Page Change Loading Overlay */}
                  {isPageChanging && (
                    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <span className="text-gray-700 font-medium">Loading page {currentPage}...</span>
                      </div>
                    </div>
                  )}
                  
                  {renderPagination()}
                  
                  <ul className="list-none p-0">
                    {currentPageResults.map(renderJournalItem)}
                  </ul>
                  
                  {renderPagination()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;