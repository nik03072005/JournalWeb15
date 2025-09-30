'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Trash2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function ManageBlog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // Fetch all blogs on mount
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get(`/api/blog`);
        setBlogs(response.data.blogs || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // Handle blog deletion
  const handleDelete = async (slug) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    setDeleting(slug);
    const toastId = toast.loading('Deleting blog...');
    try {
      await axios.delete(`/api/blog`, {
        data: { slug },
      });
      setBlogs(blogs.filter((blog) => blog.slug !== slug));
      toast.success('Blog deleted successfully!', { id: toastId });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete blog';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="h-screen bg-gray-50">
      <div className="h-screen overflow-y-auto">
        <div className="container mx-auto p-4 max-w-6xl">
      <Toaster position="top-right" reverseOrder={false} />
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Blogs</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
            >
              <div className="w-full h-48 bg-gray-200" />
              <div className="p-4 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <p className="text-gray-600 text-center">No blogs found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div
              key={blog.slug}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <img
                src={blog.bannerImage}
                alt={blog.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2 truncate">{blog.title}</h2>
                <button
                  onClick={() => handleDelete(blog.slug)}
                  disabled={deleting === blog.slug}
                  className={`w-full px-4 py-2 rounded-md text-white font-medium transition-colors ${
                    deleting === blog.slug
                      ? 'bg-red-300 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  } flex items-center justify-center gap-2`}
                >
                  {deleting === blog.slug ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Trash2 size={20} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
    </div>
  );
}