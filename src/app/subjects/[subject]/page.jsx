'use client';
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { FiSearch, FiFilter, FiCalendar, FiBook, FiUser, FiTag, FiExternalLink } from "react-icons/fi";
import { useParams, useRouter } from 'next/navigation';
import VisitorBadge from "@/components/VisitorBadge";

// Constants
const RESULTS_PER_PAGE = 10;
const MAX_VISIBLE_PAGES = 5;

const initialFilters = {
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

function filterResults(data, filters, subject) {
    return data.filter((item) => {
        // Handle nested detail object
        const detail = item.detail || {};
        
        // Subject-specific filter (primary filter)
        const subjectMatch = 
            item.subject?.subjectName?.toLowerCase().includes(subject.toLowerCase()) ||
            detail.keywords?.toLowerCase().includes(subject.toLowerCase()) ||
            detail.title?.toLowerCase().includes(subject.toLowerCase()) ||
            detail.abstract?.toLowerCase().includes(subject.toLowerCase());
        
        if (!subjectMatch) return false;
        
        if (
            filters.title &&
            !detail.title?.toLowerCase().includes(filters.title.toLowerCase())
        )
            return false;
        if (
            filters.abstract &&
            !detail.abstract?.toLowerCase().includes(filters.abstract.toLowerCase())
        )
            return false;
        if (
            filters.creator &&
            !detail.creators?.some(
                (c) =>
                    `${c.firstName} ${c.lastName}`
                        .toLowerCase()
                        .includes(filters.creator.toLowerCase())
            )
        )
            return false;
        if (
            filters.dateFrom &&
            new Date(detail.date || detail.publicationDate) < new Date(filters.dateFrom)
        )
            return false;
        if (
            filters.dateTo &&
            new Date(detail.date || detail.publicationDate) > new Date(filters.dateTo)
        )
            return false;
        if (
            filters.issn &&
            !detail.issn?.toLowerCase().includes(filters.issn.toLowerCase())
        )
            return false;
        if (
            filters.journalOrPublicationTitle &&
            !detail.journalOrPublicationTitle
                ?.toLowerCase()
                .includes(filters.journalOrPublicationTitle.toLowerCase())
        )
            return false;
        if (
            filters.keywords &&
            !detail.keywords?.toLowerCase().includes(filters.keywords.toLowerCase())
        )
            return false;
        if (
            filters.publisher &&
            !detail.publisher?.toLowerCase().includes(filters.publisher.toLowerCase())
        )
            return false;
        if (
            filters.status &&
            !detail.status?.toLowerCase().includes(filters.status.toLowerCase())
        )
            return false;
        if (
            filters.type &&
            !item.type?.typeName?.toLowerCase().includes(filters.type.toLowerCase()) &&
            !(typeof item.type === 'string' && item.type.toLowerCase().includes(filters.type.toLowerCase()))
        )
            return false;
        return true;
    });
}

const SubjectSearchPage = () => {
    const params = useParams();
    const router = useRouter();
    const subject = decodeURIComponent(params.subject || '').replace(/-/g, ' ');
    
    const [filters, setFilters] = useState(initialFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
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
    const [expandedSections, setExpandedSections] = useState({
        basicSearch: true,
        metadata: true,
        publication: true,
        classification: true
    });

    // API fetch functions
    const fetchDOAJArticles = useCallback(async (query = "", page = 1) => {
        if (!query) return { results: [], pagination: null };
        const encodedQuery = encodeURIComponent(query);
        const url = `https://doaj.org/api/v2/search/articles/${query}?page=${page}`;

        try {
            const response = await axios.get(url, { headers: { 'Accept': 'application/json' } });
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
            const publisher = bibjson.publisher || {};
            const subject = bibjson.subject ? bibjson.subject[0] : {};
            
            return {
                _id: journal.id,
                isDoajJournal: true,
                detail: {
                    title: bibjson.title || 'Untitled Journal',
                    abstract: bibjson.description || "",
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
        return books.map((book) => {
            const getMetadataValue = (key) => {
                const metadataItem = book.metadata?.find(m => m.key === key);
                return metadataItem?.value || "";
            };

            const hasMetadata = book.metadata && Array.isArray(book.metadata);
            
            let title, abstract, editor, dateIssued, doi, publisher, subjectVal;
            
            if (hasMetadata) {
                title = getMetadataValue('dc.title');
                abstract = getMetadataValue('dc.description.abstract');
                editor = getMetadataValue('dc.contributor.editor');
                dateIssued = getMetadataValue('dc.date.issued');
                doi = getMetadataValue('oapen.identifier.doi');
                publisher = getMetadataValue('publisher.name');
                subjectVal = getMetadataValue('dc.subject.other');
            } else {
                title = book.title || book.name || "";
                abstract = book.description || book.abstract || "";
                editor = book.author || book.editor || book.creator || "";
                dateIssued = book.year || book.date || "";
                doi = book.doi || book.identifier || "";
                publisher = book.publisher || "";
                subjectVal = book.subject || "";
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
                    keywords: subjectVal,
                    publisher: publisher,
                    status: "Open Access",
                    officialURL: `https://directory.doabooks.org${book.link}` || "",
                    doi: doi,
                },
                type: "Open Access Book",
                subject: {
                    subjectName: subjectVal
                }
            };
        });
    }, []);

    // Main search function
    const performCombinedSearch = useCallback(async (searchTerm) => {
        try {
            setIsLoading(true);
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

            const normalizedDOAJ = normalizeDOAJArticles(doajResponse.results || []);
            const normalizedDOAJJournals = formatDOAJJournals(doajJournalResponse.results || []);
            const normalizedDOAB = normalizeDOABBooks(doabResponse.results || []);
            
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
            setIsLoading(false);
        }
    }, [fetchDOAJArticles, fetchDOAJJournals, fetchDOABBooks, normalizeDOAJArticles, formatDOAJJournals, normalizeDOABBooks]);

    // Event handlers
    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setCurrentPage(1);
        await performCombinedSearch(subject);
    };

    const clearFilters = () => {
        setFilters(initialFilters);
    };

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
        
        setIsLoading(true);
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
            setIsLoading(false);
        }
    }, [normalizeDOAJArticles]);

    // Handle DOAJ Journal pagination using API links
    const handleDoajJournalPagination = useCallback(async (url) => {
        if (!url) return;
        
        setIsLoading(true);
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
            setIsLoading(false);
        }
    }, [formatDOAJJournals]);

    // Handle DOAB pagination
    const handleDoabPagination = useCallback(async (page) => {
        if (!subject || !page) return;
        
        setIsLoading(true);
        try {
            const doabResponse = await fetchDOABBooks(subject, page, 20);
            const normalizedDOAB = normalizeDOABBooks(doabResponse.results || []);
            setDoabResults(normalizedDOAB);
            setDoabPagination(doabResponse.pagination);
        } catch (error) {
            console.error("Failed to fetch DOAB page:", error);
        } finally {
            setIsLoading(false);
        }
    }, [subject, fetchDOABBooks, normalizeDOABBooks]);

    // Handle tab switching
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
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
                return doajResults; // Default to articles
        }
    };

    const filteredJournals = useMemo(() => {
        const activeResults = getActiveResults();
        
        // For API tabs (articles, journals, books), show all results without additional filtering
        // since they're already filtered by the API search
        if (activeTab === 'articles' || activeTab === 'journals' || activeTab === 'books') {
            return activeResults;
        }
        
        // For home tab, apply client-side filters
        return filterResults(activeResults, filters, subject);
    }, [doajResults, doajJournalResults, doabResults, localResults, activeTab, subject, filters]);

    // Pagination calculations - different logic for API tabs vs local tab
    const getCurrentPageResults = () => {
        if (activeTab === 'articles' || activeTab === 'journals' || activeTab === 'books') {
            // For API tabs, show all results from current API page (no client-side pagination)
            return filteredJournals;
        } else {
            // For home/local tab, use client-side pagination
            const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
            const endIndex = startIndex + RESULTS_PER_PAGE;
            return filteredJournals.slice(startIndex, endIndex);
        }
    };

    const currentPageResults = getCurrentPageResults();
    
    // Only calculate totalPages for home tab (local results)
    const totalPages = activeTab === 'home' ? Math.ceil(filteredJournals.length / RESULTS_PER_PAGE) : 1;
    const totalResults = filteredJournals.length;

    // Effects
    useEffect(() => {
        if (subject) {
            performCombinedSearch(subject);
        }
    }, [subject, performCombinedSearch]);

    // Set default active tab when results are available - only on initial load
    useEffect(() => {
        // Only set default tab if no tab is explicitly selected or if we're on the default 'articles' tab with no results
        if (activeTab === 'articles' && doajResults.length === 0) {
            // Set default tab based on available results
            if (doajJournalResults.length > 0) {
                setActiveTab('journals');
            } else if (doabResults.length > 0) {
                setActiveTab('books');
            } else if (localResults.length > 0) {
                setActiveTab('home');
            }
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
                        disabled={!doajPagination.prev || isLoading}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : 'Previous'}
                    </button>
                    
                    <span className="px-2 py-1 text-sm text-gray-600">
                        Page {currentPage}
                    </span>
                    
                    <button
                        onClick={() => handleDoajPagination(doajPagination.next)}
                        disabled={!doajPagination.next || isLoading}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : 'Next'}
                    </button>
                    
                    {doajPagination.last && (
                        <button
                            onClick={() => handleDoajPagination(doajPagination.last)}
                            disabled={isLoading || currentPage === totalPages}
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
                        disabled={!doajJournalPagination.prev || isLoading}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : 'Previous'}
                    </button>
                    
                    <span className="px-2 py-1 text-sm text-gray-600">
                        Page {currentPage}
                    </span>
                    
                    <button
                        onClick={() => handleDoajJournalPagination(doajJournalPagination.next)}
                        disabled={!doajJournalPagination.next || isLoading}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : 'Next'}
                    </button>
                    
                    {doajJournalPagination.last && (
                        <button
                            onClick={() => handleDoajJournalPagination(doajJournalPagination.last)}
                            disabled={isLoading || currentPage === totalPages}
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
                        disabled={!doabPagination.hasPrevious || isLoading}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : 'Previous'}
                    </button>
                    
                    <span className="px-2 py-1 text-sm text-gray-600">
                        Page {currentPage}
                    </span>
                    
                    <button
                        onClick={() => handleDoabPagination(currentPage + 1)}
                        disabled={!doabPagination.hasMore || isLoading}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : 'Next'}
                    </button>
                    
                    {totalPages > 1 && currentPage < totalPages && (
                        <button
                            onClick={() => handleDoabPagination(totalPages)}
                            disabled={isLoading || currentPage === totalPages}
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

    // Render individual result item
    const renderJournalItem = (journal, idx) => (
        <div
            key={journal._id || idx}
            className="border-b border-gray-200 py-6 hover:bg-gray-50 transition-colors"
        >
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
                        onClick={() => {
                            let route;
                            if (journal.isDoajArticle) {
                                route = `/doaj/${journal._id}`;
                            } else if (journal.isDoajJournal) {
                                route = `/doaj/journal/${journal._id}`;
                            } else if (journal.isDoabBook) {
                                route = `/doab/${journal._id}`;
                            } else {
                                route = `/paper/${journal._id}`;
                            }
                            window.open(route, '_self');
                        }}
                    >
                        {journal.detail?.title || journal.title || "Untitled"}
                    </h3>
                    
                    {/* Authors */}
                    <div className="text-blue-600 text-sm mb-2">
                        {(journal.detail?.creators || journal.creators)?.map((author, index) => (
                            <span key={index}>
                                <span className="hover:underline cursor-pointer">
                                    {author?.firstName} {author?.lastName}
                                </span>
                                {index < (journal.detail?.creators || journal.creators).length - 1 && ", "}
                            </span>
                        )) || "Unknown Author"}
                    </div>
                    
                    {/* Publication Info */}
                    <div className="text-gray-700 text-sm mb-2 italic">
                        <span className="font-medium">{journal.detail?.journalOrPublicationTitle || journal.journalOrPublicationTitle || journal.detail?.title || journal.title}</span>
                        {(journal.detail?.volume || journal.volume) && <span> Vol. {journal.detail?.volume || journal.volume}</span>}
                        {(journal.detail?.number || journal.number) && <span>, No. {journal.detail?.number || journal.number}</span>}
                        {(journal.detail?.publisher || journal.publisher) && (
                            <span>, {journal.detail?.publisher || journal.publisher}</span>
                        )}
                        {(journal.detail?.date || journal.detail?.publicationDate || journal.date) && (
                            <span> ({new Date(journal.detail?.date || journal.detail?.publicationDate || journal.date).getFullYear()})</span>
                        )}
                    </div>

                    {/* Abstract preview */}
                    {journal.detail?.abstract && (
                        <div className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {journal.detail.abstract.substring(0, 200)}
                            {journal.detail.abstract.length > 200 && '...'}
                        </div>
                    )}
                    
                    {/* Tags/Categories */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {/* Subject Match Indicator */}
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {subject.split(' ').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')} Related
                        </span>
                        
                        {journal.type && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                journal.isDoajArticle ? 'bg-blue-100 text-blue-800' :
                                journal.isDoajJournal ? 'bg-cyan-100 text-cyan-800' :
                                journal.isDoabBook ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {typeof journal.type === 'string' ? journal.type : journal.type?.typeName}
                            </span>
                        )}
                        {journal.subject?.subjectName && (
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                {journal.subject.subjectName}
                            </span>
                        )}
                        {(journal.detail?.status || journal.status) && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                {journal.detail?.status || journal.status}
                            </span>
                        )}
                        
                        {/* Content Type Indicator */}
                        {journal.isDoajArticle && (
                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs border border-green-200">
                                DOAJ Article
                            </span>
                        )}
                        {journal.isDoajJournal && (
                            <span className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded text-xs border border-cyan-200">
                                DOAJ Journal
                            </span>
                        )}
                        {journal.isDoabBook && (
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200">
                                DOAB Book
                            </span>
                        )}
                        {!journal.isDoajArticle && !journal.isDoajJournal && !journal.isDoabBook && (
                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs border border-purple-200">
                                Local Journal
                            </span>
                        )}
                        
                        {/* Visitor Badge */}
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

                    {/* External link */}
                    {journal.detail?.officialURL && (
                        <div className="mt-2">
                            <a
                                href={journal.detail.officialURL}
                                target="_self"
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
    
    // Capitalize subject for display
    const displaySubject = subject.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Subject Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            {displaySubject} Research
                        </h1>
                        <p className="text-gray-600">
                            Discover academic papers, journals, and books in {displaySubject}
                        </p>
                    </div>

                    {/* Desktop Layout: Side by side, Mobile Layout: Stacked */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Filter Section - Left side on desktop, top on mobile */}
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
                                    <div className="border-b border-gray-200">
                                        <div className="p-6">
                                            <button 
                                                type="button"
                                                className="w-full flex items-center justify-between text-left"
                                                onClick={() => toggleSection('basicSearch')}
                                            >
                                                <span className="text-blue-600 font-medium">Basic Search</span>
                                                <span className="text-blue-600">{expandedSections.basicSearch ? '▼' : '▶'}</span>
                                            </button>
                                            {expandedSections.basicSearch && (
                                                <div className="mt-4 space-y-4">
                                                    {/* Title */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                                        <input
                                                            name="title"
                                                            placeholder="Enter article title"
                                                            value={filters.title}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>

                                                    {/* Abstract */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Abstract</label>
                                                        <input
                                                            name="abstract"
                                                            placeholder="Search in abstract"
                                                            value={filters.abstract}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>

                                                    {/* Keywords */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                                                        <input
                                                            name="keywords"
                                                            placeholder="Search keywords"
                                                            value={filters.keywords}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Author & Publication Info Section */}
                                    <div className="border-b border-gray-200">
                                        <div className="p-6">
                                            <button 
                                                type="button"
                                                className="w-full flex items-center justify-between text-left"
                                                onClick={() => toggleSection('metadata')}
                                            >
                                                <span className="text-blue-600 font-medium">Author & Publication Info</span>
                                                <span className="text-blue-600">{expandedSections.metadata ? '▼' : '▶'}</span>
                                            </button>
                                            {expandedSections.metadata && (
                                                <div className="mt-4 space-y-4">
                                                    {/* Creator */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Author Name</label>
                                                        <input
                                                            name="creator"
                                                            placeholder="Author name"
                                                            value={filters.creator}
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>

                                                    {/* Journal/Publication Title */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Journal/Publication</label>
                                                        <input
                                                            name="journalOrPublicationTitle"
                                                            placeholder="Journal name"
                                                            value={filters.journalOrPublicationTitle}
                                                            onChange={handleChange}
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
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

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
                                                            onChange={handleChange}
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
                                                            onChange={handleChange}
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
                                                            onChange={handleChange}
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
                                                    {/* Type */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Publication Type</label>
                                                        <input
                                                            name="type"
                                                            placeholder="Publication type"
                                                            value={filters.type}
                                                            onChange={handleChange}
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
                                                            onChange={handleChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

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

                        {/* Results Section - Right side on desktop, bottom on mobile */}
                        <div className="lg:w-2/3 xl:w-3/4">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 results-container">
                                {/* Tab Navigation */}
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

                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-medium text-gray-800">
                                            {displaySubject} Research Results
                                        </h3>
                                        {filteredJournals.length > 0 && (
                                            <div className="flex items-center gap-4">
                                                <div className="text-sm text-gray-500">
                                                    {activeTab === 'home' ? (
                                                        `Showing ${((currentPage - 1) * RESULTS_PER_PAGE) + 1}-${Math.min(currentPage * RESULTS_PER_PAGE, filteredJournals.length)} of ${filteredJournals.length}`
                                                    ) : (
                                                        `Showing ${currentPageResults.length} of ${filteredJournals.length} results`
                                                    )}
                                                </div>
                                                <select className="text-sm border border-gray-300 rounded px-3 py-1 bg-white">
                                                    <option>Sort by relevance</option>
                                                    <option>Sort by date</option>
                                                    <option>Sort by title</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {isLoading ? (
                                        <div className="text-center py-16 px-6">
                                            <div className="text-blue-600 mb-4">
                                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                                            </div>
                                            <h4 className="text-xl font-semibold text-gray-700 mb-2">
                                                Searching...
                                            </h4>
                                            <p className="text-gray-500 max-w-md mx-auto">
                                                Please wait while we search for {displaySubject} research across multiple academic databases.
                                            </p>
                                        </div>
                                    ) : filteredJournals.length > 0 ? (
                                        <div className="space-y-0 relative">
                                            {/* Page changing overlay */}
                                            {isPageChanging && (
                                                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                                                    <div className="text-center">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                                        <p className="text-gray-600 font-medium">Loading page {currentPage}...</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Pagination Controls - Top */}
                                            {renderPagination()}
                                            
                                            {currentPageResults.map((item, idx) => renderJournalItem(item, idx))}

                                            {/* Pagination Controls - Bottom */}
                                            {renderPagination()}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 px-6">
                                            <div className="text-gray-400 mb-4">
                                                <FiSearch className="w-16 h-16 mx-auto" />
                                            </div>
                                            <h4 className="text-xl font-semibold text-gray-700 mb-2">
                                                No {displaySubject} results found
                                            </h4>
                                            <p className="text-gray-500 max-w-md mx-auto">
                                                Try adjusting your search filters or browse other subject areas.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SubjectSearchPage;
