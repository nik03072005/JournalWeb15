"use client";
import React, { useState, useEffect } from "react";
import { useParams,useRouter, usePathname } from "next/navigation";
import axios from "axios";
import Navbar2 from "../../../components/Navbar2";
import { FiDownload, FiExternalLink, FiCalendar, FiUser, FiBook, FiTag, FiCopy, FiShare2, FiMapPin, FiHeart } from "react-icons/fi";
import VisitorCounter from "@/components/VisitorCounter";
import useActivityTracker from "@/hooks/useActivityTracker";
import  useAuthStore  from "@/utility/justAuth";

const DOAJArticleDetailPage = () => {
    const { articleId } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('abstract');
    const [isFavorited, setIsFavorited] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { trackPageView, trackDownload } = useActivityTracker();
    const { isLoggedIn, hasHydrated } = useAuthStore();
    
    const isAuthenticated = hasHydrated && isLoggedIn;

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                console.log("Fetching DOAJ article with ID:", articleId);
                
                // Fetch from DOAJ API using the article ID
                const response = await axios.get(
                    `https://doaj.org/api/v2/articles/${articleId}`,
                    {
                        headers: {
                            'Accept': 'application/json',
                        }
                    }
                );
                
                console.log("DOAJ Article response:", response.data);
                setArticle(response.data);
                
                // Track article view activity
                const articleTitle = response.data?.bibjson?.title || 'Unknown Article';
                const articleDOI = response.data?.bibjson?.identifier?.find(id => id.type === 'doi')?.id || articleId;
                
                console.log('Tracking DOAJ article view:', {
                    itemType: 'doaj',
                    itemId: articleDOI,
                    itemTitle: articleTitle
                });
                
                trackPageView('doaj', articleDOI, articleTitle);
            } catch (error) {
                console.error("Error fetching DOAJ article:", error);
                setError("Failed to load article details");
            } finally {
                setLoading(false);
            }
        };

        if (articleId) {
            fetchArticle();
        }
    }, [articleId]);

    // Check favorite status when article and authentication state change
    useEffect(() => {
        if (article && isAuthenticated) {
            checkFavoriteStatus();
        }
    }, [article, isAuthenticated]);

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        // You can add a toast notification here
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: article?.bibjson?.title || "DOAJ Article",
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    // Check if article is favorited
    const checkFavoriteStatus = async () => {
        if (!isAuthenticated || !article) return;
        
        try {
            const response = await axios.get('/api/user/favourite');
            if (response.data.success) {
                const favorites = response.data.data;
                const articleDOI = article?.bibjson?.identifier?.find(id => id.type === 'doi')?.id || articleId;
                const isFav = favorites.some(fav => 
                    fav.itemType === 'doaj' && fav.itemId === articleDOI
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

        if (!article) return;

        setFavoriteLoading(true);
        try {
            const articleDOI = article?.bibjson?.identifier?.find(id => id.type === 'doi')?.id || articleId;
            
            if (isFavorited) {
                // Remove from favorites
                const response = await axios.delete('/api/user/favourite', {
                    data: {
                        itemId: articleDOI
                    }
                });
                
                if (response.data.success !== false) {
                    setIsFavorited(false);
                }
            } else {
                // Add to favorites
                const favoriteData = {
                    itemType: 'doaj',
                    itemId: articleDOI,
                    itemTitle: article?.bibjson?.title || 'Unknown Article',
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

    if (loading) {
        return (
            <>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading article details...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error || !article) {
        return (
            <>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Article Not Found</h2>
                        <p className="text-gray-600">{error || "The requested article could not be found."}</p>
                    </div>
                </div>
            </>
        );
    }

    const bibjson = article.bibjson || {};
    const authors = bibjson.author || [];
    const journal = bibjson.journal || {};
    const identifiers = bibjson.identifier || [];
    const subjects = bibjson.subject || [];
    const links = bibjson.link || [];
    const keywords = bibjson.keywords || [];

    // Get DOI and other identifiers
    const doi = identifiers.find(id => id.type === 'doi')?.id;
    const eissn = identifiers.find(id => id.type === 'eissn')?.id;
    const issn = journal.issns?.[0] || eissn;

    // Get full text link
    const fullTextLink = links.find(link => link.type === 'fulltext')?.url;

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Left Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Access Information */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="bg-green-100 rounded-lg h-48 flex items-center justify-center mb-4">
                                    <div className="text-center">
                                        <FiBook className="w-12 h-12 text-green-600 mx-auto mb-2" />
                                        <p className="text-green-700 font-medium text-sm">Open Access</p>
                                        <p className="text-green-600 text-xs">Free to read</p>
                                    </div>
                                </div>
                                {fullTextLink && (
  <div className="space-y-2">
    <button
      onClick={() => {
        if (isAuthenticated) {
          window.open(fullTextLink, '_blank', 'noopener,noreferrer');
        } else {
          router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
        }
      }}
      className="w-full bg-green-600 cursor-pointer text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
    >
      <FiExternalLink className="w-4 h-4 mr-2" />
      Read Full Text
    </button>

    <div className="flex flex-wrap gap-3 mb-6">
      <button
        onClick={handleShare}
        className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors flex items-center justify-center"
      >
        <FiShare2 className="w-4 h-4 mr-2" />
        Share
      </button>

      <button 
        onClick={toggleFavorite}
        disabled={favoriteLoading}
        className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
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
)}

                            </div>
                            {/* Action Buttons */}
                            

                            {/* Publication Info */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Publication Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="text-gray-600 block">Published:</span>
                                        <span className="font-medium">
                                            {bibjson.month && `${bibjson.month}/`}{bibjson.year || 'Unknown'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block">Journal:</span>
                                        <span className="font-medium">{journal.title || 'Unknown Journal'}</span>
                                    </div>
                                    {journal.volume && (
                                        <div>
                                            <span className="text-gray-600 block">Volume:</span>
                                            <span className="font-medium">{journal.volume}</span>
                                        </div>
                                    )}
                                    {journal.number && (
                                        <div>
                                            <span className="text-gray-600 block">Issue:</span>
                                            <span className="font-medium">{journal.number}</span>
                                        </div>
                                    )}
                                    {bibjson.start_page && (
                                        <div>
                                            <span className="text-gray-600 block">Pages:</span>
                                            <span className="font-medium">{bibjson.start_page}</span>
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

                                    {issn && (
                                        <div>
                                            <span className="text-sm text-gray-600">ISSN:</span>
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">{issn}</span>
                                                <button onClick={() => handleCopyId(issn)} className="text-blue-600 hover:text-blue-800 ml-2">
                                                    <FiCopy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Article Statistics */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Article Statistics</h3>
                                <VisitorCounter 
                                    paperId={articleId} 
                                    paperType="doaj" 
                                />
                            </div>

                            {/* Citation */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Cite</h3>
                                    <button 
                                        onClick={() => handleCopyId(`${authors.map(a => a.name).join(', ')}. ${bibjson.title}. ${journal.title}. ${bibjson.year}.`)}
                                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                    >
                                        <FiCopy className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-sm text-gray-700 leading-relaxed">
                                    <p>
                                        {authors.map((author, index) => (
                                            <span key={index}>
                                                {author.name}
                                                {index < authors.length - 1 && ", "}
                                            </span>
                                        ))}. {bibjson.title}. 
                                        <em> {journal.title}</em>
                                        {journal.volume && ` Vol. ${journal.volume}`}
                                        {journal.number && `, No. ${journal.number}`}
                                        {journal.publisher && `, ${journal.publisher}`}
                                        {bibjson.start_page && `, pp.${bibjson.start_page}`}
                                        {bibjson.year && `, ${bibjson.year}`}
                                        {doi && ` (DOI: ${doi})`}.
                                    </p>
                                </div>
                            </div>

                            
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            {/* Article Type and Year */}
                            <div className="flex items-center gap-4 mb-6">
                                <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium">
                                    Open Access Article
                                </span>
                                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm">
                                    Year: {bibjson.year || 'Unknown'}
                                </span>
                                {journal.language?.[0] && (
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                                        Language: {journal.language[0]}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                                {bibjson.title || "Untitled Article"}
                            </h1>

            {/* Authors */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Authors</h3>
                <div className="space-y-3">
                    {authors.map((author, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                            <div className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                <span className="font-medium">{author.name}</span>
                            </div>
                            {author.affiliation && (
                                <div className="text-sm text-gray-600 mt-2 flex items-start">
                                    <FiMapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="leading-tight">{author.affiliation}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>                            {/* Journal Information */}
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                                <div className="flex items-start">
                                    <FiBook className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-blue-800">{journal.title}</p>
                                        {journal.publisher && (
                                            <p className="text-sm text-blue-600">Published by {journal.publisher}</p>
                                        )}
                                        {journal.country && (
                                            <p className="text-sm text-blue-600">Country: {journal.country}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

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
                                        {keywords.length > 0 && (
                                            <button 
                                                className={`px-4 py-3 text-sm font-medium border-b-2 ml-4 ${
                                                    activeTab === 'keywords' 
                                                        ? 'border-blue-500 text-blue-600' 
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                                onClick={() => setActiveTab('keywords')}
                                            >
                                                Keywords
                                            </button>
                                        )}
                                        {subjects.length > 0 && (
                                            <button 
                                                className={`px-4 py-3 text-sm font-medium border-b-2 ml-4 ${
                                                    activeTab === 'subjects' 
                                                        ? 'border-blue-500 text-blue-600' 
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                                onClick={() => setActiveTab('subjects')}
                                            >
                                                Subjects
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    {activeTab === 'abstract' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Abstract</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                {bibjson.abstract || "No abstract available for this article."}
                                            </p>
                                        </div>
                                    )}
                                    {activeTab === 'keywords' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Keywords</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {keywords.map((keyword, index) => (
                                                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'subjects' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Subject Classifications</h3>
                                            <div className="space-y-2">
                                                {subjects.map((subject, index) => (
                                                    <div key={index} className="bg-gray-50 p-3 rounded">
                                                        <div className="font-medium text-gray-800">{subject.term}</div>
                                                        {subject.code && (
                                                            <div className="text-sm text-gray-600">
                                                                Code: {subject.code} ({subject.scheme})
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
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

export default DOAJArticleDetailPage;
