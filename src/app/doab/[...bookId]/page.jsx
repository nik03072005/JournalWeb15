"use client";
import React, { useState, useEffect } from "react";
import { useParams,useRouter, usePathname } from "next/navigation";
import axios from "axios";
import Navbar2 from "../../../components/Navbar2";
import { FiDownload, FiExternalLink, FiCalendar, FiUser, FiBook, FiTag, FiCopy, FiShare2, FiMapPin, FiHeart } from "react-icons/fi";
import useActivityTracker from "@/hooks/useActivityTracker";
import useAuthStore from "@/utility/justAuth";

const DOABBookDetailPage = () => {
    const params = useParams();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('abstract');
    const [isFavorited, setIsFavorited] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { trackPageView, trackDownload } = useActivityTracker();

    // Use Zustand store for authentication
    const { isLoggedIn, hasHydrated } = useAuthStore();
    const isAuthenticated = hasHydrated && isLoggedIn;

    useEffect(() => {
        const fetchBook = async () => {
            try {
                setLoading(true);
                
                // Reconstruct the handle from the catch-all route
                const handleParts = params.bookId;
                const fullHandle = Array.isArray(handleParts) ? handleParts.join('/') : handleParts;
                
                console.log("Fetching DOAB book with handle:", fullHandle);
                
                // Use the handle directly in the DOAB API search
                const response = await axios.get(`/api/doab-search?query=handle:"${fullHandle}"&expand=metadata`);
                
                console.log("DOAB Book response:", response.data);
                
                // Handle different response structures
                let bookData = null;
                if (Array.isArray(response.data)) {
                    // If response.data is an array
                    bookData = response.data.find(item => item.handle === fullHandle) || response.data[0];
                } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
                    // If response.data has a results array
                    bookData = response.data.results.find(item => item.handle === fullHandle) || response.data.results[0];
                } else if (response.data && typeof response.data === 'object') {
                    // If response.data is a single object
                    bookData = response.data;
                }
                
                if (bookData) {
                    setBook(bookData);
                    
                    // Track book view activity
                    const bookTitle = bookData.metadata?.find(m => m.key === 'dc.title')?.value || 'Unknown Book';
                    const bookHandle = bookData.handle || fullHandle;
                    
                    console.log('Tracking DOAB book view (catch-all route):', {
                        itemType: 'doab',
                        itemId: bookHandle,
                        itemTitle: bookTitle
                    });
                    
                    trackPageView('doab', bookHandle, bookTitle);
                } else {
                    setError("Book not found");
                }
            } catch (error) {
                console.error("Error fetching DOAB book:", error);
                setError("Failed to load book details");
            } finally {
                setLoading(false);
            }
        };

        if (params.bookId) {
            fetchBook();
        }
    }, [params.bookId]);

    // Check favorite status when book and authentication state change
    useEffect(() => {
        if (book && isAuthenticated) {
            checkFavoriteStatus();
        }
    }, [book, isAuthenticated]);

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        // You can add a toast notification here
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: getMetadataValue('dc.title') || "DOAB Book",
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    // Check if book is favorited
    const checkFavoriteStatus = async () => {
        if (!isAuthenticated || !book) return;
        
        try {
            const response = await axios.get('/api/user/favourite');
            if (response.data.success) {
                const favorites = response.data.data;
                const isFav = favorites.some(fav => 
                    fav.itemType === 'doab' && fav.itemId === book.handle
                );
                setIsFavorited(isFav);
            }
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    };

    // Add/Remove favorite
    const toggleFavorite = async () => {
        if (!isAuthenticated) {
            router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        if (!book) return;

        setFavoriteLoading(true);
        try {
            if (isFavorited) {
                // Remove from favorites
                const response = await axios.delete('/api/user/favourite', {
                    data: {
                        itemId: book.handle
                    }
                });
                
                if (response.data.success !== false) {
                    setIsFavorited(false);
                }
            } else {
                // Add to favorites
                const favoriteData = {
                    itemType: 'doab',
                    itemId: book.handle,
                    itemTitle: getMetadataValue('dc.title') || 'Unknown Book',
                    itemUrl: window.location.href,
                    action: 'bookmark'
                };

                const response = await axios.post('/api/user/favourite', favoriteData);
                
                if (response.data.success) {
                    setIsFavorited(true);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // You can add a toast notification here
        } finally {
            setFavoriteLoading(false);
        }
    };

    // Helper function to extract metadata values
    const getMetadataValue = (key) => {
        if (!book || !book.metadata) return "";
        const metadataItem = book.metadata.find(m => m.key === key);
        return metadataItem?.value || "";
    };

    if (loading) {
        return (
            <>
                
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading book details...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error || !book) {
        return (
            <>
                
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Book Not Found</h2>
                        <p className="text-gray-600">{error || "The requested book could not be found."}</p>
                    </div>
                </div>
            </>
        );
    }

    // Extract book information from metadata
    const title = getMetadataValue('dc.title');
    const abstract = getMetadataValue('dc.description.abstract');
    const editor = getMetadataValue('dc.contributor.editor');
    const dateIssued = getMetadataValue('dc.date.issued');
    const doi = getMetadataValue('oapen.identifier.doi');
    const publisher = getMetadataValue('publisher.name');
    const subject = getMetadataValue('dc.subject.other');
    const language = getMetadataValue('dc.language');
    const pages = getMetadataValue('oapen.pages');
    const publisherWebsite = getMetadataValue('publisher.website');
    const publisherCountry = getMetadataValue('publisher.country');
    const publisherAddress = getMetadataValue('publisher.address');

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Left Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Access Information */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="bg-blue-100 rounded-lg h-48 flex items-center justify-center mb-4">
                                    <div className="text-center">
                                        <FiBook className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                                        <p className="text-blue-700 font-medium text-sm">Open Access Book</p>
                                        <p className="text-blue-600 text-xs">Free to read</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                               {doi && (
  <button
    onClick={() => {
      if (isAuthenticated) {
        // Open DOI in a new tab
        window.open(`https://doi.org/${doi}`, '_blank', 'noopener,noreferrer');
      } else {
        // Redirect to auth with current path
        router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      }
    }}
    className="w-full justify-center cursor-pointer inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
  >
    <FiExternalLink className="w-4 h-4 mr-2" />
    View on Publisher Site
  </button>
)}


                                <button 
                                    onClick={handleShare}
                                    className=" w-full justify-center inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    <FiShare2 className="w-4 h-4 mr-2" />
                                    Share
                                </button>

                                <button 
                                    onClick={toggleFavorite}
                                    disabled={favoriteLoading}
                                    className={`w-full justify-center inline-flex items-center px-4 py-2 rounded-md transition-colors ${
                                        isFavorited 
                                            ? 'bg-red-600 text-white hover:bg-red-700' 
                                            : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                                    } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <FiHeart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                                    {favoriteLoading ? 'Loading...' : (isFavorited ? 'Remove from Favorites' : 'Add to Favorites')}
                                </button>
                                </div>
                            </div>

                            {/* Publication Info */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Publication Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="text-gray-600 block">Published:</span>
                                        <span className="font-medium">{dateIssued || 'Unknown'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block">Publisher:</span>
                                        <span className="font-medium">{publisher || 'Unknown Publisher'}</span>
                                    </div>
                                    {pages && (
                                        <div>
                                            <span className="text-gray-600 block">Pages:</span>
                                            <span className="font-medium">{pages}</span>
                                        </div>
                                    )}
                                    {language && (
                                        <div>
                                            <span className="text-gray-600 block">Language:</span>
                                            <span className="font-medium">{language}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Identifiers */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Identifiers</h3>
                                <div className="space-y-3">
                                   {doi && (
  <div>
    <span className="text-sm text-gray-600">DOI:</span>
    <div className="flex items-center justify-between gap-2">
      <a
        href={`https://doi.org/${doi}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-sm text-blue-600 hover:underline truncate max-w-[200px]"
        title={doi}
      >
        {doi}
      </a>
      <button
        onClick={() => handleCopyId(doi)}
        className="text-blue-600 hover:text-blue-800 flex-shrink-0"
      >
        <FiCopy className="w-4 h-4" />
      </button>
    </div>
  </div>
)}

                                    {book.handle && (
                                        <div>
                                            <span className="text-sm text-gray-600">Handle:</span>
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">{book.handle}</span>
                                                <button onClick={() => handleCopyId(book.handle)} className="text-blue-600 hover:text-blue-800 ml-2">
                                                    <FiCopy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Citation */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Cite</h3>
                                    <button 
                                        onClick={() => handleCopyId(`${editor}. ${title}. ${publisher}. ${dateIssued}.`)}
                                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                    >
                                        <FiCopy className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-sm text-gray-700 leading-relaxed">
                                    <p>
                                        {editor && `${editor} (Ed.). `}
                                        <em>{title}</em>. 
                                        {publisher && ` ${publisher}`}
                                        {dateIssued && `, ${dateIssued}`}
                                        {doi && ` (DOI: ${doi})`}.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            {/* Book Type and Year */}
                            <div className="flex items-center gap-4 mb-6">
                                <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
                                    Open Access Book
                                </span>
                                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm">
                                    Year: {dateIssued || 'Unknown'}
                                </span>
                                {language && (
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
                                        Language: {language}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                                {title || "Untitled Book"}
                            </h1>

                            {/* Editor */}
                            {editor && (
                                <div className="mb-6">
                                    <div className="flex flex-wrap gap-2">
                                        <div className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                            <span className="font-medium">Edited by: {editor}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Publisher Information */}
                            {publisher && (
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                                    <div className="flex items-start">
                                        <FiBook className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-blue-800">{publisher}</p>
                                            {publisherCountry && (
                                                <p className="text-sm text-blue-600">Country: {publisherCountry}</p>
                                            )}
                                            {publisherWebsite && (
                                                <a href={publisherWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                                    Visit Publisher Website
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Content Tabs */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                                <div className="border-b border-gray-200">
                                    <div className="flex">
                                        <button 
                                            className={`px-4 py-3 text-sm font-medium border-b-2 ${
                                                activeTab === 'abstract' 
                                                    ? 'border-blue-500 text-blue-600' 
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                            onClick={() => setActiveTab('abstract')}
                                        >
                                            Abstract
                                        </button>
                                        {subject && (
                                            <button 
                                                className={`px-4 py-3 text-sm font-medium border-b-2 ml-4 ${
                                                    activeTab === 'subjects' 
                                                        ? 'border-blue-500 text-blue-600' 
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                                onClick={() => setActiveTab('subjects')}
                                            >
                                                Subject
                                            </button>
                                        )}
                                        <button 
                                            className={`px-4 py-3 text-sm font-medium border-b-2 ml-4 ${
                                                activeTab === 'details' 
                                                    ? 'border-blue-500 text-blue-600' 
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                            onClick={() => setActiveTab('details')}
                                        >
                                            Details
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {activeTab === 'abstract' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Abstract</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                {abstract || "No abstract available for this book."}
                                            </p>
                                        </div>
                                    )}
                                    {activeTab === 'subjects' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Subject</h3>
                                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm inline-block">
                                                {subject}
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'details' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {pages && (
                                                    <div>
                                                        <span className="text-sm text-gray-600 block">Pages:</span>
                                                        <span className="font-medium">{pages}</span>
                                                    </div>
                                                )}
                                                {language && (
                                                    <div>
                                                        <span className="text-sm text-gray-600 block">Language:</span>
                                                        <span className="font-medium">{language}</span>
                                                    </div>
                                                )}
                                                {publisherAddress && (
                                                    <div className="md:col-span-2">
                                                        <span className="text-sm text-gray-600 block">Publisher Address:</span>
                                                        <span className="font-medium">{publisherAddress}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {/* <div className="flex flex-wrap gap-3 mb-6">
                                <a
                                    href={`https://directory.doabooks.org${book.link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <FiExternalLink className="w-4 h-4 mr-2" />
                                    Read Full Book
                                </a>
                                {doi && (
                                    <a
                                        href={`https://doi.org/${doi}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        <FiExternalLink className="w-4 h-4 mr-2" />
                                        View on Publisher Site
                                    </a>
                                )}
                                <button 
                                    onClick={handleShare}
                                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    <FiShare2 className="w-4 h-4 mr-2" />
                                    Share
                                </button>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DOABBookDetailPage;
