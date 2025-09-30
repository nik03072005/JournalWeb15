"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import axios from "axios";
import Navbar2 from "../../../../components/Navbar2";
import { FiDownload, FiExternalLink, FiCalendar, FiUser, FiBook, FiTag, FiCopy, FiShare2, FiMapPin, FiHeart, FiGlobe, FiUsers, FiCheckCircle } from "react-icons/fi";
import VisitorCounter from "@/components/VisitorCounter";
import useActivityTracker from "@/hooks/useActivityTracker";
import useAuthStore from "@/utility/justAuth";

const DOAJJournalDetailPage = () => {
    const { journalId } = useParams();
    const [journal, setJournal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isFavorited, setIsFavorited] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { trackPageView, trackDownload } = useActivityTracker();
    const { isLoggedIn, hasHydrated } = useAuthStore();
    
    const isAuthenticated = hasHydrated && isLoggedIn;

    useEffect(() => {
        const fetchJournal = async () => {
            try {
                setLoading(true);
                console.log("Fetching DOAJ journal with ID:", journalId);
                
                // Fetch from DOAJ API using the journal ID
                const response = await axios.get(
                    `https://doaj.org/api/v2/journals/${journalId}`,
                    {
                        headers: {
                            'Accept': 'application/json',
                        }
                    }
                );
                
                console.log("DOAJ Journal response:", response.data);
                setJournal(response.data);
                
                // Track journal view activity only if auth is hydrated
                if (hasHydrated) {
                    const journalTitle = response.data?.bibjson?.title || 'Unknown Journal';
                    
                    console.log('Tracking DOAJ journal view:', {
                        itemType: 'doaj-journal',
                        itemId: journalId,
                        itemTitle: journalTitle
                    });
                    
                    trackPageView('doaj-journal', journalId, journalTitle);
                }
            } catch (error) {
                console.error("Error fetching DOAJ journal:", error);
                setError("Failed to load journal details");
            } finally {
                setLoading(false);
            }
        };

        if (journalId) {
            fetchJournal();
        }
    }, [journalId, hasHydrated, trackPageView]);

    // Check favorite status when journal and authentication state change
    useEffect(() => {
        if (journal && isAuthenticated) {
            checkFavoriteStatus();
        }
    }, [journal, isAuthenticated]);

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        // You can add a toast notification here
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: journal?.bibjson?.title || "DOAJ Journal",
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    // Check if journal is favorited
    const checkFavoriteStatus = async () => {
        if (!isAuthenticated || !journal) return;
        
        try {
            const response = await axios.get('/api/user/favourite');
            if (response.data.success) {
                const favorites = response.data.data;
                const isFav = favorites.some(fav => 
                    fav.itemType === 'doaj-journal' && fav.itemId === journalId
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

        if (!journal) return;

        setFavoriteLoading(true);
        try {
            if (isFavorited) {
                // Remove from favorites
                const response = await axios.delete('/api/user/favourite', {
                    data: {
                        itemId: journalId
                    }
                });
                
                if (response.data.success !== false) {
                    setIsFavorited(false);
                }
            } else {
                // Add to favorites
                const favoriteData = {
                    itemType: 'doaj-journal',
                    itemId: journalId,
                    itemTitle: journal?.bibjson?.title || 'Unknown Journal',
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
                <Navbar2 />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading journal details...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error || !journal) {
        return (
            <>
                <Navbar2 />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Journal Not Found</h2>
                        <p className="text-gray-600">{error || "The requested journal could not be found."}</p>
                    </div>
                </div>
            </>
        );
    }

    const bibjson = journal.bibjson || {};
    const publisher = bibjson.publisher || {};
    const subjects = bibjson.subject || [];
    const languages = bibjson.language || [];
    const keywords = bibjson.keywords || [];
    const license = bibjson.license?.[0] || {};
    const editorial = bibjson.editorial || {};
    const apc = bibjson.apc || {};
    const preservation = bibjson.preservation || {};

    // Get journal URL
    const journalUrl = bibjson.ref?.journal;

    return (
        <>
            <Navbar2 />
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
                                        <p className="text-green-600 text-xs">Journal</p>
                                    </div>
                                </div>
                                {journalUrl && (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => {
                                                if (isAuthenticated) {
                                                    window.open(journalUrl, '_blank', 'noopener,noreferrer');
                                                } else {
                                                    router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
                                                }
                                            }}
                                            className="w-full bg-green-600 cursor-pointer text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                                        >
                                            <FiExternalLink className="w-4 h-4 mr-2" />
                                            Visit Journal
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

                            {/* Publication Info */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Journal Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="text-gray-600 block">Open Access Start:</span>
                                        <span className="font-medium">
                                            {bibjson.oa_start || 'Unknown'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block">Publisher:</span>
                                        <span className="font-medium">{publisher.name || 'Unknown Publisher'}</span>
                                    </div>
                                    {publisher.country && (
                                        <div>
                                            <span className="text-gray-600 block">Country:</span>
                                            <span className="font-medium">{publisher.country}</span>
                                        </div>
                                    )}
                                    {languages.length > 0 && (
                                        <div>
                                            <span className="text-gray-600 block">Languages:</span>
                                            <span className="font-medium">{languages.join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Identifiers */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Identifiers</h3>
                                <div className="space-y-3">
                                    {bibjson.pissn && (
                                        <div>
                                            <span className="text-sm text-gray-600">Print ISSN:</span>
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">{bibjson.pissn}</span>
                                                <button onClick={() => handleCopyId(bibjson.pissn)} className="text-blue-600 hover:text-blue-800 ml-2">
                                                    <FiCopy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {bibjson.eissn && (
                                        <div>
                                            <span className="text-sm text-gray-600">Electronic ISSN:</span>
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">{bibjson.eissn}</span>
                                                <button onClick={() => handleCopyId(bibjson.eissn)} className="text-blue-600 hover:text-blue-800 ml-2">
                                                    <FiCopy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Journal Statistics */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Journal Statistics</h3>
                                <VisitorCounter 
                                    paperId={journalId} 
                                    paperType="doaj-journal" 
                                />
                            </div>

                            {/* Citation */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Cite Journal</h3>
                                    <button 
                                        onClick={() => handleCopyId(`${bibjson.title}. ${publisher.name || 'Unknown Publisher'}. ISSN: ${bibjson.eissn || bibjson.pissn || 'Unknown'}.`)}
                                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                    >
                                        <FiCopy className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-sm text-gray-700 leading-relaxed">
                                    <p>
                                        <em>{bibjson.title}</em>. 
                                        {publisher.name && ` ${publisher.name}`}
                                        {(bibjson.eissn || bibjson.pissn) && ` ISSN: ${bibjson.eissn || bibjson.pissn}`}
                                        {journalUrl && ` Available at: ${journalUrl}`}.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            {/* Journal Type and Status */}
                            <div className="flex items-center gap-4 mb-6">
                                <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium">
                                    Open Access Journal
                                </span>
                                {bibjson.oa_start && (
                                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm">
                                        OA Start: {bibjson.oa_start}
                                    </span>
                                )}
                                {languages.length > 0 && (
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                                        Languages: {languages.slice(0, 2).join(', ')}{languages.length > 2 && '...'}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                                {bibjson.title || "Untitled Journal"}
                            </h1>

                            {/* Alternative Title */}
                            {bibjson.alternative_title && (
                                <div className="mb-6">
                                    <h2 className="text-xl text-gray-700 italic">
                                        {bibjson.alternative_title}
                                    </h2>
                                </div>
                            )}

                            {/* Publisher Information */}
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                                <div className="flex items-start">
                                    <FiUsers className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-blue-800">{publisher.name || 'Unknown Publisher'}</p>
                                        {publisher.country && (
                                            <p className="text-sm text-blue-600">Country: {publisher.country}</p>
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
                                                activeTab === 'overview' 
                                                    ? 'border-blue-500 text-blue-600' 
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                            onClick={() => setActiveTab('overview')}
                                        >
                                            Overview
                                        </button>
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
                                        <button 
                                            className={`px-4 py-3 text-sm font-medium border-b-2 ml-4 ${
                                                activeTab === 'editorial' 
                                                    ? 'border-blue-500 text-blue-600' 
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                            onClick={() => setActiveTab('editorial')}
                                        >
                                            Editorial
                                        </button>
                                        <button 
                                            className={`px-4 py-3 text-sm font-medium border-b-2 ml-4 ${
                                                activeTab === 'licensing' 
                                                    ? 'border-blue-500 text-blue-600' 
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                            onClick={() => setActiveTab('licensing')}
                                        >
                                            Licensing
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {activeTab === 'overview' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Journal Description</h3>
                                            <div className="space-y-4">
                                                <p className="text-gray-700 leading-relaxed">
                                                    {bibjson.description || editorial.description || "No description available for this journal."}
                                                </p>
                                                
                                                {/* Keywords */}
                                                {keywords.length > 0 && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-800 mb-2">Keywords</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {keywords.map((keyword, index) => (
                                                                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                                                    {keyword}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* APC Information */}
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                                                        <FiCheckCircle className="w-4 h-4 mr-2" />
                                                        Article Processing Charges (APC)
                                                    </h4>
                                                    <p className="text-gray-700">
                                                        {apc.has_apc ? 
                                                            `This journal charges APCs. ${apc.max && apc.max.length > 0 ? `Maximum charge: ${apc.max[0].price} ${apc.max[0].currency}` : ''}` :
                                                            'This journal does not charge APCs.'
                                                        }
                                                    </p>
                                                    {apc.url && (
                                                        <a href={apc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                                            More information about APCs
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Preservation */}
                                                {preservation.has_preservation && (
                                                    <div className="bg-green-50 p-4 rounded-lg">
                                                        <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                                                            <FiCheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                                            Digital Preservation
                                                        </h4>
                                                        <p className="text-gray-700 mb-2">
                                                            This journal uses digital preservation services.
                                                        </p>
                                                        {preservation.service && preservation.service.length > 0 && (
                                                            <div className="text-sm text-gray-600">
                                                                Services: {preservation.service.join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                                    {activeTab === 'editorial' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Editorial Information</h3>
                                            <div className="space-y-4">
                                                {editorial.review_process && editorial.review_process.length > 0 && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-800 mb-2">Review Process</h4>
                                                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                                                            {editorial.review_process.map((process, index) => (
                                                                <li key={index}>{process}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {editorial.review_url && (
                                                        <div>
                                                            <h4 className="font-medium text-gray-800 mb-2">Review Information</h4>
                                                            <a href={editorial.review_url} target="_blank" rel="noopener noreferrer" 
                                                               className="text-blue-600 hover:underline flex items-center">
                                                                <FiExternalLink className="w-4 h-4 mr-1" />
                                                                View Review Process
                                                            </a>
                                                        </div>
                                                    )}
                                                    
                                                    {editorial.board_url && (
                                                        <div>
                                                            <h4 className="font-medium text-gray-800 mb-2">Editorial Board</h4>
                                                            <a href={editorial.board_url} target="_blank" rel="noopener noreferrer" 
                                                               className="text-blue-600 hover:underline flex items-center">
                                                                <FiExternalLink className="w-4 h-4 mr-1" />
                                                                View Editorial Board
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                {bibjson.ref?.author_instructions && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-800 mb-2">Author Instructions</h4>
                                                        <a href={bibjson.ref.author_instructions} target="_blank" rel="noopener noreferrer" 
                                                           className="text-blue-600 hover:underline flex items-center">
                                                            <FiExternalLink className="w-4 h-4 mr-1" />
                                                            View Author Instructions
                                                        </a>
                                                    </div>
                                                )}

                                                {bibjson.ref?.aims_scope && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-800 mb-2">Aims & Scope</h4>
                                                        <a href={bibjson.ref.aims_scope} target="_blank" rel="noopener noreferrer" 
                                                           className="text-blue-600 hover:underline flex items-center">
                                                            <FiExternalLink className="w-4 h-4 mr-1" />
                                                            View Aims & Scope
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'licensing' && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">License Information</h3>
                                            <div className="space-y-4">
                                                {license.type && (
                                                    <div className="bg-blue-50 p-4 rounded-lg">
                                                        <h4 className="font-medium text-gray-800 mb-2">License Type</h4>
                                                        <p className="text-gray-700">{license.type}</p>
                                                        {license.url && (
                                                            <a href={license.url} target="_blank" rel="noopener noreferrer" 
                                                               className="text-blue-600 hover:underline text-sm flex items-center mt-2">
                                                                <FiExternalLink className="w-4 h-4 mr-1" />
                                                                View License Details
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {/* License conditions */}
                                                <div>
                                                    <h4 className="font-medium text-gray-800 mb-2">License Conditions</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className={`p-3 rounded text-center ${license.BY ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                            <div className="font-medium">Attribution</div>
                                                            <div className="text-xs">{license.BY ? 'Required' : 'Not specified'}</div>
                                                        </div>
                                                        <div className={`p-3 rounded text-center ${license.SA ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                                                            <div className="font-medium">ShareAlike</div>
                                                            <div className="text-xs">{license.SA ? 'Required' : 'Not specified'}</div>
                                                        </div>
                                                        <div className={`p-3 rounded text-center ${license.NC ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                                                            <div className="font-medium">NonCommercial</div>
                                                            <div className="text-xs">{license.NC ? 'Restricted' : 'Not specified'}</div>
                                                        </div>
                                                        <div className={`p-3 rounded text-center ${license.ND ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                                                            <div className="font-medium">NoDerivatives</div>
                                                            <div className="text-xs">{license.ND ? 'Restricted' : 'Not specified'}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {bibjson.ref?.oa_statement && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-800 mb-2">Open Access Statement</h4>
                                                        <a href={bibjson.ref.oa_statement} target="_blank" rel="noopener noreferrer" 
                                                           className="text-blue-600 hover:underline flex items-center">
                                                            <FiExternalLink className="w-4 h-4 mr-1" />
                                                            View Open Access Statement
                                                        </a>
                                                    </div>
                                                )}
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

export default DOAJJournalDetailPage;
