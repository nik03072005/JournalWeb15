"use client";
import React, { useState, useEffect } from "react";
import { useParams,useRouter, usePathname } from "next/navigation";
import axios from "axios";
import Navbar2 from "../../../components/Navbar2";
import { FiDownload, FiExternalLink, FiCalendar, FiUser, FiBook, FiTag, FiCopy, FiShare2, FiMapPin, FiHeart } from "react-icons/fi";
import PdfModal from "@/components/PdfModal";
import VisitorCounter from "@/components/VisitorCounter";
import useActivityTracker from "@/hooks/useActivityTracker";
import useAuthStore from "@/utility/justAuth";
import toast from "react-hot-toast";

const PaperDetailPage = () => {
    const { paperId } = useParams();
    const { trackPageView } = useActivityTracker();
    // console.log(paperId, "Paper ID from Params");
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPdf, setShowPdf] = useState(false);
    const [activeTab, setActiveTab] = useState('abstract');
    const [isFavorited, setIsFavorited] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Use Zustand store for authentication
    const { isLoggedIn, hasHydrated } = useAuthStore();
    const isAuthenticated = hasHydrated && isLoggedIn;

    // const [activeTab, setActiveTab] = useState('en');

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                setLoading(true);
                
                // Check if paperId is undefined or empty
                if (!paperId || paperId.trim() === '') {
                    setPaper(null);
                    setLoading(false);
                    return;
                }
                
                // Fetch from local API
                const response = await axios.get(
                    `/api/journal`,{
                   params: { id: paperId }
                    }
                );
                console.log(response.data, "Fetched Paper Data");
                setPaper(response.data.journal);
                
                // Track activity for local paper
                if (response.data.journal) {
                    trackPageView(
                        'local',
                        paperId,
                        response.data.journal.detail?.title || response.data.journal.title || 'Local Paper'
                    );
                }
            } catch (error) {
                console.error("Error fetching paper:", error);
                if (error.response?.status === 404) {
                    setError("Paper not found. The requested paper ID does not exist.");
                } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
                    setError("Network error. Please check your internet connection and try again.");
                } else {
                    setError("Failed to load paper details. Please try again later.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (paperId && paperId.trim() !== '') {
            fetchPaper();
        } else {
            setPaper(null);
            setLoading(false);
        }
    }, [paperId]);

    // Check favorite status when paper and authentication state change
    useEffect(() => {
        if (paper && isAuthenticated && paperId && paperId.trim() !== '') {
            checkFavoriteStatus();
        }
    }, [paper, isAuthenticated, paperId]);

    // Set default tab based on paper type
    useEffect(() => {
        if (paper) {
            const isQuestionPaper = paper.type === "Question Papers";
            if (isQuestionPaper && activeTab === 'abstract') {
                // Set default to keywords if available, otherwise details
                const keywordArray = (paper.detail?.keywords || paper.keywords || "")
                    ? (paper.detail?.keywords || paper.keywords || "").split(',').map(k => k.trim()).filter(k => k)
                    : [];
                setActiveTab(keywordArray.length > 0 ? 'keywords' : 'details');
            }
        }
    }, [paper, activeTab]);

    console.log(paper, "Fetched Paper Data");

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        // You can add a toast notification here
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: detail.title || paper?.title || "Research Paper",
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    // Check if paper is favorited
    const checkFavoriteStatus = async () => {
        if (!isAuthenticated || !paper || !paperId || paperId.trim() === '') return;
        
        try {
            const response = await axios.get('/api/user/favourite');
            if (response.data.success) {
                const favorites = response.data.data;
                // For local papers, use the paperId
                const itemId = paperId;
                const itemType = 'local';
                
                const isFav = favorites.some(fav => 
                    fav.itemType === itemType && fav.itemId === itemId
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

        if (!paper || !paperId || paperId.trim() === '') {
            toast.error('Invalid paper ID');
            return;
        }

        setFavoriteLoading(true);
        try {
            // Determine item ID and type for local papers
            const itemId = paperId;
            const itemType = 'local';
            const itemTitle = paper.detail?.title || paper.title || 'Unknown Paper';
            
            if (isFavorited) {
                // Remove from favorites
                const response = await axios.delete('/api/user/favourite', {
                    data: {
                        itemId: itemId
                    }
                });
                
                if (response.data.success !== false) {
                    setIsFavorited(false);
                    toast.success('Removed from favorites');
                }
            } else {
                // Add to favorites
                const favoriteData = {
                    itemType: itemType,
                    itemId: itemId,
                    itemTitle: itemTitle,
                    itemUrl: window.location.href,
                    action: 'bookmark'
                };

                const response = await axios.post('/api/user/favourite', favoriteData);
                
                if (response.data.success) {
                    setIsFavorited(true);
                    toast.success('Added to favorites');
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error('Failed to update favorites');
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
                        <p className="text-gray-600">Loading paper details...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error || !paper) {
        return (
            <>
                
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto px-4">
                        <div className="mb-4">
                            <FiBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                            Paper Not Found
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error || (!paperId || paperId.trim() === '' 
                                ? "No paper ID provided." 
                                : "The requested paper could not be found.")}
                        </p>
                        <button
                            onClick={() => router.back()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const detail = paper.detail || {};
    const creators = detail.creators || paper.creators || [];
    const keywords = detail.keywords || paper.keywords || "";
    const keywordArray = keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : [];
    const isQuestionPaper = paper.type === "Question Papers";

    return (
      <>
        
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Access Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center mb-4">
                    <div className="text-center">
                      <FiBook className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium text-sm">
                        Research Paper
                      </p>
                      <p className="text-gray-500 text-xs">
                        Academic Paper
                      </p>
                    </div>
                  </div>
                 {(paper.fileUrl || detail.officialURL) && (
  <div className="space-y-2">
    <button
     onClick={() => {
    if (isAuthenticated) {
      setShowPdf(true);
    } else {
      // Redirect to login with redirect back to current page
      router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
    }
  }}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
    >
      <FiExternalLink className="w-4 h-4 mr-2" />
      View PDF
    </button>

    {(detail.officialURL || paper.officialURL) && (
      <a
        href={detail.officialURL || paper.officialURL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      >
        <FiExternalLink className="w-4 h-4 mr-2" />
        View Original
      </a>
    )}

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
)}
                </div>

                {/* Publication Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Publication Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600 block">Published:</span>
                      <span className="font-medium">
                        {detail.date
                          ? new Date(detail.date).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 block">{paper.type}</span>
                      <span className="font-medium">
                        {detail.title ||
                          paper.journalOrPublicationTitle ||
                          "Unknown Journal"}
                      </span>
                    </div>
                    {detail.volume && (
                      <div>
                        <span className="text-gray-600 block">Volume:</span>
                        <span className="font-medium">{detail.volume}</span>
                      </div>
                    )}
                    {detail.number && (
                      <div>
                        <span className="text-gray-600 block">Issue:</span>
                        <span className="font-medium">{detail.number}</span>
                      </div>
                    )}
                    {detail.pages && (
                      <div>
                        <span className="text-gray-600 block">Pages:</span>
                        <span className="font-medium">{detail.pages}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visitor Statistics */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Article Statistics
                  </h3>
                  <VisitorCounter
                    paperId={paperId}
                    paperType="local"
                  />
                </div>

                {/* Identifiers */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Identifiers
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">HAL Id:</span>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {paper._id
                            ? `hal-${paper._id.slice(-8)}`
                            : "hal-00000000"}
                          , version 1
                        </span>
                        <button
                          onClick={() => handleCopyId(paper._id)}
                          className="text-blue-600 hover:text-blue-800 ml-2"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                   {(detail.issn || paper.issn || detail.doi) && (
  <div>
    <span className="text-sm text-gray-600">
      DOI:
    </span>
    <div className="flex items-center justify-between">
      <a
        href={detail.doi || paper.doi || paper.issn}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-sm text-blue-600 hover:underline max-w-[200px] truncate"
        title={detail.doi}
      >
        {detail.doi || paper.issn}
      </a>
      <button
        onClick={() => handleCopyId(detail.issn || paper.issn)}
        className="text-blue-600 hover:text-blue-800 ml-2"
      >
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
                    <h3 className="text-lg font-semibold text-gray-800">
                      Cite
                    </h3>
                    <button
                      onClick={() =>
                        handleCopyId(
                          `${creators.map((a) => `${a.firstName} ${a.lastName}`).join(", ")}. ${detail.title || paper.title}. ${detail.journalOrPublicationTitle || paper.journalOrPublicationTitle}. ${detail.date ? new Date(detail.date).getFullYear() : ""}.`
                        )
                      }
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <p>
                      {creators.map((author, index) => (
                        <span key={index}>
                          {author.firstName} {author.lastName}
                          {index < creators.length - 1 && ", "}
                        </span>
                      )) || "Unknown Author"}
                      . {detail.title || paper.title || "Untitled"}.
                      <em>
                        {" "}
                        {detail.title ||
                          paper.journalOrPublicationTitle ||
                          "Unknown paper"}
                      </em>
                      {detail.volume && ` Vol. ${detail.volume}`}
                      {detail.number && `, No. ${detail.number}`}
                      {detail.publisher && `, ${detail.publisher}`}
                      {detail.pages && `, pp.${detail.pages}`}
                      {detail.date &&
                        `, ${new Date(detail.date).getFullYear()}`}
                      {detail.issn && ` (${detail.issn})`}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Article Type and Year */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium">
                    {paper.type || "Research Paper"}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm">
                    Year:{" "}
                    {detail.date ? new Date(detail.date).getFullYear() : "2021"}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  {detail.title || paper.title || "Untitled Paper"}
                </h1>

                {/* Display based on paper type */}
                {isQuestionPaper ? (
                  /* Question Paper Details */
                  <div className="mb-6">
                    <div className="space-y-2">
                      <div className="flex gap-4">
                          <div>
                        <span className="text-sm font-semibold text-gray-800">Course Name: </span>
                        <span className="text-sm text-gray-700">{detail?.courseName || "Unknown Course"}</span>
                      </div>
                       <div>
                        <span className="text-sm font-semibold text-gray-800">Course Code: </span>
                        <span className="text-sm text-gray-700">{detail?.courseCode || "Unknown Course"}</span>
                      </div>
                      </div>
                      

                      <div>
                        <span className="text-lg font-semibold text-gray-800">Subject: </span>
                        <span className="text-lg text-gray-700">{paper.subject?.subjectName || "Unknown Subject"}</span>
                      </div>
                      <div>
                        <span className="text-lg font-semibold text-gray-800">Department: </span>
                        <span className="text-lg text-gray-700">{detail.department || "Unknown Department"}</span>
                      </div>
                      <div>
                        <span className="text-lg font-semibold text-gray-800">Semester: </span>
                        <span className="text-lg text-gray-700">{detail.semester || "Unknown Semester"}</span>
                      </div>
                      <div>
                        <span className="text-lg font-semibold text-gray-800">Year: </span>
                        <span className="text-lg text-gray-700">{detail.year || "Unknown Year"}</span>
                      </div>
                      {detail.university && (
                        <div>
                          <span className="text-lg font-semibold text-gray-800">University / Institute: </span>
                          <span className="text-lg text-gray-700">
                            {detail.university}
                          </span>
                        </div>
                      )}
                      {keywordArray.length > 0 && (
                        <div>
                          <span className="text-lg font-semibold text-gray-800">Keywords: </span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {keywordArray.map((keyword, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Regular Paper Authors */
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {creators.map((author, index) => (
                        <div
                          key={index}
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          <span className="font-medium">
                            {author.firstName} {author.lastName}
                          </span>
                          {author.affiliation && (
                            <div className="text-xs text-gray-600 mt-1">
                              <FiMapPin className="w-3 h-3 inline mr-1" />
                              {author.affiliation}
                            </div>
                          )}
                          {index < creators.length - 1 && (
                            <span className="text-gray-400">,</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Journal Information */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <div className="flex items-start">
                    <FiBook className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-800">
                        {detail.title ||
                          paper.journalOrPublicationTitle ||
                          "Unknown paper"}
                      </p>
                      {(detail.publisher || paper.publisher) && (
                        <p className="text-sm text-blue-600">
                          Published by {detail.publisher || paper.publisher}
                        </p>
                      )}
                      {(detail.institution || paper.institution) && (
                        <p className="text-sm text-blue-600">
                          Institution: {detail.institution || paper.institution}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                  <div className="border-b border-gray-200">
                    <div className="flex">
                      {!isQuestionPaper && (
                        <button
                          className={`px-4 py-3 text-sm font-medium border-b-2 ${
                            activeTab === "abstract"
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                          onClick={() => setActiveTab("abstract")}
                        >
                          Abstract
                        </button>
                      )}
                      {keywordArray.length > 0 && (
                        <button
                          className={`px-4 py-3 text-sm font-medium border-b-2 ${!isQuestionPaper ? 'ml-4' : ''} ${
                            activeTab === "keywords"
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                          onClick={() => setActiveTab("keywords")}
                        >
                          Keywords
                        </button>
                      )}
                      <button
                        className={`px-4 py-3 text-sm font-medium border-b-2 ${(!isQuestionPaper || keywordArray.length > 0) ? 'ml-4' : ''} ${
                          activeTab === "details"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setActiveTab("details")}
                      >
                        Publication Details
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {activeTab === "abstract" && !isQuestionPaper && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Abstract
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {detail.abstract ||
                            paper.abstract ||
                            "No abstract available for this paper."}
                        </p>
                      </div>
                    )}
                    {activeTab === "keywords" && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Keywords
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {keywordArray.map((keyword, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {activeTab === "details" && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Publication Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(detail.journalOrPublicationTitle ||
                            paper.journalOrPublicationTitle) && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                Journal/Publication
                              </span>
                              <span className="font-medium">
                                {detail.journalOrPublicationTitle ||
                                  paper.journalOrPublicationTitle}
                              </span>
                            </div>
                          )}
                          {(detail.publisher || paper.publisher) && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                Publisher
                              </span>
                              <span className="font-medium">
                                {detail.publisher || paper.publisher}
                              </span>
                            </div>
                          )}
                          {detail.volume && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                Volume
                              </span>
                              <span className="font-medium">
                                {detail.volume}
                              </span>
                            </div>
                          )}
                          {detail.number && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                Number
                              </span>
                              <span className="font-medium">
                                {detail.number}
                              </span>
                            </div>
                          )}
                          {detail.pages && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                Pages
                              </span>
                              <span className="font-medium">
                                {detail.pages}
                              </span>
                            </div>
                          )}
                          {detail.date && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                Publication Date
                              </span>
                              <span className="font-medium">
                                {new Date(detail.date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {(detail.status || paper.status) && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                Status
                              </span>
                              <span className="font-medium">
                                {detail.status || paper.status}
                              </span>
                            </div>
                          )}
                          {paper.subject?.subjectName && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                Subject
                              </span>
                              <span className="font-medium">
                                {paper.subject.subjectName}
                              </span>
                            </div>
                          )}
                          {isQuestionPaper && detail.department && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                Department
                              </span>
                              <span className="font-medium">
                                {detail.department}
                              </span>
                            </div>
                          )}
                          {isQuestionPaper && detail.semester && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                Semester
                              </span>
                              <span className="font-medium">
                                {detail.semester}
                              </span>
                            </div>
                          )}
                          {isQuestionPaper && detail.year && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                Academic Year
                              </span>
                              <span className="font-medium">
                                {detail.year}
                              </span>
                            </div>
                          )}
          {isQuestionPaper && detail.university && (
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="text-sm text-gray-600 block">
                                University / Institute
                              </span>
                              <span className="font-medium">
            {detail.university}
                              </span>
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
        {showPdf && (
          <PdfModal
            fileUrl={paper.fileUrl || detail.officialURL}
            onClose={() => setShowPdf(false)}
          />
        )}
      </>
    );
};

export default PaperDetailPage;
