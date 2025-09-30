"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import Navbar2 from '@/components/Navbar2';
import Footer from '@/components/Footer';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug;
  
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogBySlug = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/blog?slug=${slug}`);
        
        if (response.data.success && response.data.blog) {
          setBlog(response.data.blog);
        } else {
          setError('Blog not found');
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to fetch blog');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlogBySlug();
    }
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar2 />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading blog...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !blog) {
    return (
      <>
        <Navbar2 />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">{error || 'Blog not found'}</p>
            <button 
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer/>
      </>
    );
  }

  return (
    <>
      <Navbar2 />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Hero Section */}
        <div className="relative h-[60vh] md:h-[70vh] bg-gray-900 overflow-hidden">
          <Image
            src={blog.bannerImage}
            alt={blog.title}
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-5xl mx-auto">
              <div className="mb-6">
                <span className="inline-block bg-blue-600/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-4 border border-white/20">
                  📖 BLOG POST
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
                {blog.title}
              </h1>
              <div className="flex items-center justify-center gap-6 text-sm md:text-base">
                {blog.createdAt && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                    <span>📅</span>
                    <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <span>⏱️</span>
                  <span>{Math.ceil(blog.content.replace(/<[^>]*>/g, '').length / 200)} min read</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 py-16 relative">
          {/* Floating decoration */}
          <div className="absolute top-8 right-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-8 left-8 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden relative">
            {/* Content header */}
            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-8 border-b border-gray-200/50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">📝</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Article Content</h2>
                    <p className="text-gray-600 text-sm">Published content and insights</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Published</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Featured</span>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12">
              {/* Enhanced Blog Content */}
              <div 
                className="prose prose-lg max-w-none
                  prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h1:mb-6 prose-h2:mb-4 prose-h3:mb-3
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                  prose-a:text-blue-600 prose-a:hover:text-blue-800 prose-a:underline-offset-4
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-gray-200
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-gradient-to-r prose-blockquote:from-blue-50 prose-blockquote:to-transparent prose-blockquote:p-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:border prose-pre:border-gray-700
                  prose-ul:space-y-2 prose-ol:space-y-2
                  prose-li:text-gray-700"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>
          </div>

          {/* Enhanced Navigation */}
          <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <button 
              onClick={() => window.history.back()}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>←</span>
              <span>Go Back</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600 text-sm">Thanks for reading!</span>
            </div>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏠 Home
            </button>
          </div>

          {/* Enhanced Share Section */}
          <div className="mt-8 bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-6 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white">📤</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Share this article</h3>
                  <p className="text-gray-600 text-sm">Spread the knowledge with your network</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('✅ Link copied to clipboard!');
                  }}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span>📋</span>
                  <span>Copy Link</span>
                </button>
                <button 
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(blog.title)}`, '_blank')}
                  className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span>🐦</span>
                  <span>Twitter</span>
                </button>
                <button 
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span>📘</span>
                  <span>Facebook</span>
                </button>
                <button 
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span>💼</span>
                  <span>LinkedIn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
