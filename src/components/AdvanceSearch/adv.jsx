'use client';
import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
import Navbar2 from "@/components/Navbar2";
import VisitorBadge from "@/components/VisitorBadge";
import { FiFilter, FiSearch, FiX } from 'react-icons/fi';

// Constants
const RESULTS_PER_PAGE = 10;
const MAX_VISIBLE_PAGES = 5;

// Filter interface - simpler now
const INITIAL_FILTERS = {
    dateFrom: "",
    dateTo: "",
    issn: "",
    publisher: "",
    status: "",
    subject: "",
    type: "",
    itemType: "",
};

const INITIAL_EXPANDED_SECTIONS = {
    itemType: true,
    publication: true,
    classification: true
};

// Item types for local library filtering
const LOCAL_ITEM_TYPES = [
    'Book',
    'Book Chapters',
    'Conference Proceeding',
    'Dissertation',
    'Question Papers',
    'Research Papers',
    'Thesis'
];

// Main search function that matches across title, keywords, authors, and type
function matchesSearchTerm(item, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') return true;
    
    const term = searchTerm.toLowerCase();
    const detail = item.detail || {};
    
    // Search in title
    const titleMatch = detail.title?.toLowerCase().includes(term);
    
    // Search in keywords
    const keywordsMatch = detail.keywords?.toLowerCase().includes(term);
    
    // Search in authors/creators
    const authorsMatch = detail.creators?.some(creator => 
        `${creator.firstName} ${creator.lastName}`.toLowerCase().includes(term)
    );
    
    // Search in type
    const typeMatch = (typeof item.type === 'string' ? 
        item.type.toLowerCase().includes(term) : 
        item.type?.typeName?.toLowerCase().includes(term));
    
    return titleMatch || keywordsMatch || authorsMatch || typeMatch;
}

// Filter function for additional filters (works on fetched data)
function applyFilters(data, filters) {
    return data.filter((item) => {
        const detail = item.detail || {};
        
        // Date filters
        if (filters.dateFrom) {
            const itemDate = new Date(detail.date || detail.publicationDate);
            if (itemDate < new Date(filters.dateFrom)) return false;
        }
        
        if (filters.dateTo) {
            const itemDate = new Date(detail.date || detail.publicationDate);
            if (itemDate > new Date(filters.dateTo)) return false;
        }
        
        // ISSN filter
        if (filters.issn && !detail.issn?.toLowerCase().includes(filters.issn.toLowerCase())) {
            return false;
        }
        
        // Publisher filter
        if (filters.publisher && !detail.publisher?.toLowerCase().includes(filters.publisher.toLowerCase())) {
            return false;
        }
        
        // Status filter
        if (filters.status && !detail.status?.toLowerCase().includes(filters.status.toLowerCase())) {
            return false;
        }
        
        // Subject filter
        if (filters.subject && !item.subject?.subjectName?.toLowerCase().includes(filters.subject.toLowerCase())) {
            return false;
        }
        
        // Type filter
        if (filters.type) {
            const itemType = typeof item.type === 'string' ? item.type : item.type?.typeName;
            if (!itemType?.toLowerCase().includes(filters.type.toLowerCase())) {
                return false;
            }
        }
        
        // Item Type filter (for local library)
        if (filters.itemType) {
            const itemType = typeof item.type === 'string' ? item.type : item.type?.typeName;
            if (!itemType?.toLowerCase().includes(filters.itemType.toLowerCase())) {
                return false;
            }
        }
        
        return true;
    });
}

const AdvanceSearch = () => {
    const router = useRouter();
    
    // Main state
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [expandedSections, setExpandedSections] = useState(INITIAL_EXPANDED_SECTIONS);
    
    // Loading and pagination
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isPageChanging, setIsPageChanging] = useState(false);
    
    // Results from different sources
    const [allResults, setAllResults] = useState([]);
    const [doajResults, setDoajResults] = useState([]);
    const [doajJournalResults, setDoajJournalResults] = useState([]);
    const [doabResults, setDoabResults] = useState([]);
    const [localResults, setLocalResults] = useState([]);
    
    // Pagination info for external APIs
    const [doajPagination, setDoajPagination] = useState(null);
    const [doajJournalPagination, setDoajJournalPagination] = useState(null);
    const [doabPagination, setDoabPagination] = useState(null);
    
    // Counts for tabs
    const [doajTotalCount, setDoajTotalCount] = useState(0);
    const [doajJournalTotalCount, setDoajJournalTotalCount] = useState(0);
    const [doabTotalCount, setDoabTotalCount] = useState(0);
    
    // UI state
    const [activeTab, setActiveTab] = useState('articles');
    const [showFilters, setShowFilters] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );
    
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
    // Main search function - searches across all sources for the search term
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

            // Fetch from all sources in parallel
            const [localData, doajResponse, doajJournalResponse, doabResponse] = await Promise.all([
                axios.get(`/api/journal`).then(res => res.data.journals).catch(() => []),
                fetchDOAJArticles(searchTerm, 1),
                fetchDOAJJournals(searchTerm, 1),
                fetchDOABBooks(searchTerm, 1, 20)
            ]);

            // Normalize data from different sources
            const normalizedDOAJ = normalizeDOAJArticles(doajResponse.results || []);
            const normalizedDOAJJournals = formatDOAJJournals(doajJournalResponse.results || []);
            const normalizedDOAB = normalizeDOABBooks(doabResponse.results || []);
            
            // Set results
            const combinedResults = [...localData, ...normalizedDOAJ, ...normalizedDOAJJournals, ...normalizedDOAB];
            
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
            setHasSearched(true);
            
        } catch (error) {
            console.error("Search failed:", error);
            // Reset all results on error
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
            performCombinedSearch(trimmedTerm);
            setCurrentPage(1); // Reset to first page
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        // No need to search again - filters work on current data
    };

    const clearFilters = () => {
        setFilters(INITIAL_FILTERS);
        setCurrentPage(1);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setFilters(INITIAL_FILTERS);
        setAllResults([]);
        setDoajResults([]);
        setDoajJournalResults([]);
        setDoabResults([]);
        setLocalResults([]);
        setDoajTotalCount(0);
        setDoajJournalTotalCount(0);
        setDoabTotalCount(0);
        setHasSearched(false);
        setCurrentPage(1);
        setDoajPagination(null);
        setDoajJournalPagination(null);
        setDoabPagination(null);
    };

    // Toggle section for filters
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
        if (!searchTerm || !page) return;
        
        setLoading(true);
        try {
            const doabResponse = await fetchDOABBooks(searchTerm, page, 20);
            const normalizedDOAB = normalizeDOABBooks(doabResponse.results || []);
            setDoabResults(normalizedDOAB);
            setDoabPagination(doabResponse.pagination);
        } catch (error) {
            console.error("Failed to fetch DOAB page:", error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, fetchDOABBooks, normalizeDOABBooks]);

    // Handle tab switching
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    // Get active results based on current tab
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

    // Apply search term matching and filters to current results
    const filteredResults = useMemo(() => {
        let results = getActiveResults();
        
        // First apply search term matching (title, keywords, authors, type)
        if (searchTerm.trim()) {
            results = results.filter(item => matchesSearchTerm(item, searchTerm));
        }
        
        // Then apply additional filters
        results = applyFilters(results, filters);
        
        return results;
    }, [searchTerm, filters, activeTab, doajResults, doajJournalResults, doabResults, localResults]);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return Object.values(filters).some(value => value && value.trim() !== '');
    };

    // Get count of active filters
    const getActiveFilterCount = () => {
        return Object.values(filters).filter(value => value && value.trim() !== '').length;
    };

    // Pagination calculations
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + RESULTS_PER_PAGE;
    
    // For external APIs, show all results from current API page
    // For local results and filtered results, use local pagination
    const shouldUsePagination = activeTab === 'home' || hasActiveFilters() || searchTerm.trim();
    const currentPageResults = shouldUsePagination ? 
        filteredResults.slice(startIndex, endIndex) : 
        filteredResults;
    
    const totalPages = shouldUsePagination ? 
        Math.ceil(filteredResults.length / RESULTS_PER_PAGE) : 
        1;
    
    const totalResults = filteredResults.length;

    // Get unique values for filter dropdowns from current results
    const uniqueTypes = useMemo(() => {
        const results = getActiveResults();
        return [...new Set(results.map(item => 
            typeof item.type === 'string' ? item.type : item.type?.typeName || item.type
        ).filter(Boolean))];
    }, [activeTab, doajResults, doajJournalResults, doabResults, localResults]);

    const uniquePublishers = useMemo(() => {
        const results = getActiveResults();
        return [...new Set(results.map(item => item.detail?.publisher).filter(Boolean))];
    }, [activeTab, doajResults, doajJournalResults, doabResults, localResults]);

    const uniqueSubjects = useMemo(() => {
        const results = getActiveResults();
        return [...new Set(results.map(item => item.subject?.subjectName).filter(Boolean))];
    }, [activeTab, doajResults, doajJournalResults, doabResults, localResults]);

    // Effects
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            <Navbar2 />
            <div className="bg-white py-8">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSearch} className="flex items-center gap-4 pl-4 pr-4">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-2xl p-3 pr-12 rounded-md border border-gray-300 focus:border-blue-500 outline-none transition-colors mb-4"
                                placeholder="Search by title, keywords, authors, or type..."
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-16 top-3 text-gray-400 hover:text-gray-600 p-1"
                                    title="Clear search"
                                >
                                    <FiX size={20} />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-500 text-white border-none rounded-md p-3 text-lg cursor-pointer hover:bg-blue-600 transition-colors mb-4 min-w-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                            ) : (
                                <FiSearch size={20} />
                            )}
                        </button>
                    </form>
                    {hasSearched && (
                        <div className="text-center text-gray-600 mt-2">
                            {hasActiveFilters() ? 
                                `Search results filtered by ${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? 's' : ''}` :
                                'Use the filters on the left to refine your search results'
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-gray-100 py-8">
                <div className="flex justify-between px-8">
                    {/* Desktop Advanced Filter Sidebar */}
                    {windowWidth >= 768 && (
                        <div className="w-72 sticky top-5">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:sticky lg:top-6">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <FiFilter className="w-5 h-5 text-blue-600 mr-3" />
                                            <h2 className="text-xl font-medium text-gray-800">Filter Results</h2>
                                        </div>
                                        {hasActiveFilters() && (
                                            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                {getActiveFilterCount()} active
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Filters apply automatically to your search results
                                    </p>
                                </div>
                        
                                <div>
                                    {/* Item Type Section - Only for Home Library */}
                                    {activeTab === 'home' && (
                                        <div className="border-b border-gray-200">
                                            <div className="p-6">
                                                <button 
                                                    type="button"
                                                    className="w-full flex items-center justify-between text-left"
                                                    onClick={() => toggleSection('itemType')}
                                                >
                                                    <span className="text-blue-600 font-medium">Item Type</span>
                                                    <span className="text-blue-600">{expandedSections.itemType ? '▼' : '▶'}</span>
                                                </button>
                                                {expandedSections.itemType && (
                                                    <div className="mt-4 space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Item Type</label>
                                                            <select
                                                                name="itemType"
                                                                value={filters.itemType}
                                                                onChange={handleFilterChange}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                            >
                                                                <option value="">All Types</option>
                                                                {LOCAL_ITEM_TYPES.map((type) => (
                                                                    <option key={type} value={type}>
                                                                        {type}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Publication Details Section */}
                                    <div className="border-b border-gray-200">
                                        <div className="p-6">
                                            <button 
                                                type="button"
                                                className="w-full flex items-center justify-between text-left"
                                                onClick={() => toggleSection('publication')}
                                            >
                                                <span className="text-blue-600 font-medium">Publication Details</span>
                                                <span className="text-blue-600">{expandedSections.publication ? '▼' : '▶'}</span>
                                            </button>
                                            {expandedSections.publication && (
                                                <div className="mt-4 space-y-4">
                                                    {/* Date From */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                                                        <input
                                                            name="dateFrom"
                                                            type="date"
                                                            value={filters.dateFrom}
                                                            onChange={handleFilterChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>

                                                    {/* Date To */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                                                        <input
                                                            name="dateTo"
                                                            type="date"
                                                            value={filters.dateTo}
                                                            onChange={handleFilterChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>

                                                    {/* ISSN */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">ISSN</label>
                                                        <input
                                                            name="issn"
                                                            placeholder="ISSN number"
                                                            value={filters.issn}
                                                            onChange={handleFilterChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>

                                                    {/* Publisher */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Publisher</label>
                                                        <input
                                                            name="publisher"
                                                            placeholder="Publisher name"
                                                            value={filters.publisher}
                                                            onChange={handleFilterChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Classification Section */}
                                    <div>
                                        <div className="p-6">
                                            <button 
                                                type="button"
                                                className="w-full flex items-center justify-between text-left"
                                                onClick={() => toggleSection('classification')}
                                            >
                                                <span className="text-blue-600 font-medium">Classification & Status</span>
                                                <span className="text-blue-600">{expandedSections.classification ? '▼' : '▶'}</span>
                                            </button>
                                            {expandedSections.classification && (
                                                <div className="mt-4 space-y-4">
                                                    {/* Subject */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                                        <input
                                                            name="subject"
                                                            placeholder="Subject area"
                                                            value={filters.subject}
                                                            onChange={handleFilterChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>

                                                    {/* Type */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Publication Type</label>
                                                        <input
                                                            name="type"
                                                            placeholder="Publication type"
                                                            value={filters.type}
                                                            onChange={handleFilterChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>

                                                    {/* Status */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                                        <input
                                                            name="status"
                                                            placeholder="Publication status"
                                                            value={filters.status}
                                                            onChange={handleFilterChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="p-6 border-t border-gray-200 bg-gray-50">
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm"
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                </div>
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
                                        hasActiveFilters() || searchTerm.trim() ? 
                                            `${filteredResults.length} Filtered Articles` :
                                            `${doajTotalCount?.toLocaleString() || 0} Articles found`
                                    ) : activeTab === 'journals' ? (
                                        hasActiveFilters() || searchTerm.trim() ? 
                                            `${filteredResults.length} Filtered Journals` :
                                            `${doajJournalTotalCount?.toLocaleString() || 0} Journals found`
                                    ) : activeTab === 'books' ? (
                                        hasActiveFilters() || searchTerm.trim() ? 
                                            `${filteredResults.length} Filtered Books` :
                                            `${doabTotalCount?.toLocaleString() || 0} Books found`
                                    ) : (
                                        `${filteredResults.length} Home Library Results`
                                    )} {searchTerm.trim() && `for "${searchTerm}"`}
                                </h2>
                            </div>
                            
                            {/* Loading State */}
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="ml-3 text-gray-600">Searching across multiple databases...</span>
                                </div>
                            ) : filteredResults.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-500 text-lg">No results found.</div>
                                    <div className="text-gray-400 text-sm mt-2">
                                        {hasSearched ? 
                                            "Try adjusting your search terms or filters." :
                                            "Enter a search term to get started."
                                        }
                                    </div>
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

export default AdvanceSearch;