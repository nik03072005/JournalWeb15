'use client';

import React, { useState, useEffect, useRef } from 'react';
import 'quill/dist/quill.snow.css';
import axios from 'axios';
import { Loader2, Trash2, Edit, Save, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Custom CSS for Quill editor
const customStyles = `
  .ql-editor img {
    max-width: 100%;
    max-height: 300px;
    width: auto;
    height: auto;
    margin: 10px 0;
    display: block;
  }
  .ql-editor {
    min-height: 300px;
    padding-bottom: 30px;
  }
  .edit-section .ql-toolbar {
    border-top-left-radius: 0.375rem;
    border-top-right-radius: 0.375rem;
  }
  .edit-section .ql-container {
    border-bottom-left-radius: 0.375rem;
    border-bottom-right-radius: 0.375rem;
  }
`;

export default function EditBlog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 5;
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    bannerImage: ''
  });
  const [bannerFile, setBannerFile] = useState(null);
  
  // Quill editor refs
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  // Inject custom styles
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);

    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  // Fetch blogs
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

  // Initialize Quill editor when editing
  useEffect(() => {
    const initializeEditor = async () => {
      if (isEditing && quillRef.current && !editorRef.current) {
        const Quill = (await import('quill')).default;
        
        editorRef.current = new Quill(quillRef.current, {
          theme: 'snow',
          modules: {
            toolbar: {
              container: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                ['image', 'code-block'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
                ['clean'],
              ],
              handlers: {
                image: handleImageUpload,
              },
            },
          },
        });

        // Set initial content
        editorRef.current.root.innerHTML = editForm.content;
        
        editorRef.current.on('text-change', () => {
          setEditForm(prev => ({
            ...prev,
            content: editorRef.current.root.innerHTML
          }));
        });
      }
    };

    initializeEditor();
  }, [isEditing]);

  // Handle image uploads in Quill editor
  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/jpeg,image/jpg,image/png');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
          toast.error('Please select a JPEG or PNG image');
          return;
        }

        setFileLoading(true);
        const toastId = toast.loading('Uploading image...');
        try {
          const formData = new FormData();
          formData.append('image', file);

          const response = await axios.post(
            `/api/blog/upload-image`,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );

          const imageUrl = response.data.url;
          const range = editorRef.current.getSelection() || { index: 0 };
          editorRef.current.insertEmbed(range.index, 'image', imageUrl);
          editorRef.current.setSelection(range.index + 1, 0);
          toast.success('Image uploaded successfully!', { id: toastId });
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to upload image';
          toast.error(errorMessage, { id: toastId });
        } finally {
          setFileLoading(false);
        }
      }
    };
  };

  // Handle banner file upload
  const handleBannerChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(selectedFile.type)) {
      toast.error('Please select a JPEG or PNG image');
      return;
    }

    setBannerFile(selectedFile);
    setFileLoading(true);

    const uploadFormData = new FormData();
    uploadFormData.append('image', selectedFile);

    try {
      const response = await axios.post(
        `/api/blog/upload-image`,
        uploadFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.url) {
        setEditForm(prev => ({ ...prev, bannerImage: response.data.url }));
        toast.success(`Banner "${selectedFile.name}" uploaded successfully!`);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to upload banner';
      toast.error(errorMessage);
      setBannerFile(null);
    } finally {
      setFileLoading(false);
    }
  };

  // Remove banner
  const removeBanner = () => {
    setBannerFile(null);
    setEditForm(prev => ({ ...prev, bannerImage: '' }));
    toast.success('Banner removed');
  };

  // Handle blog selection
  const handleSelectBlog = (blog) => {
    setSelectedBlog(blog);
    setIsEditing(false);
    setEditForm({
      title: blog.title,
      content: blog.content,
      bannerImage: blog.bannerImage
    });
    setBannerFile(null);
    editorRef.current = null;
  };

  // Start editing
  const startEditing = () => {
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    if (selectedBlog) {
      setEditForm({
        title: selectedBlog.title,
        content: selectedBlog.content,
        bannerImage: selectedBlog.bannerImage
      });
    }
    setBannerFile(null);
    editorRef.current = null;
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editForm.title.trim() || !editForm.content.trim() || !editForm.bannerImage.trim()) {
      toast.error('All fields are required');
      return;
    }

    setUpdating(true);
    const toastId = toast.loading('Updating blog...');
    try {
      const response = await axios.put(`/api/blog`, {
        slug: selectedBlog.slug,
        title: editForm.title,
        content: editForm.content,
        bannerImage: editForm.bannerImage
      });

      // Update the blog in local state
      const updatedBlog = { ...selectedBlog, ...response.data.blog };
      setBlogs(blogs.map(blog => 
        blog.slug === selectedBlog.slug ? updatedBlog : blog
      ));
      setSelectedBlog(updatedBlog);
      setIsEditing(false);
      editorRef.current = null;

      toast.success('Blog updated successfully!', { id: toastId });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update blog';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete
  const handleDelete = async (blog) => {
    if (!confirm(`Are you sure you want to delete "${blog.title}"?`)) return;

    setDeleting(blog.slug);
    const toastId = toast.loading('Deleting blog...');
    try {
      await axios.delete(`/api/blog`, {
        data: { slug: blog.slug },
      });
      
      setBlogs(blogs.filter(b => b.slug !== blog.slug));
      if (selectedBlog && selectedBlog.slug === blog.slug) {
        setSelectedBlog(null);
        setIsEditing(false);
      }
      
      toast.success('Blog deleted successfully!', { id: toastId });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete blog';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setDeleting(null);
    }
  };

  // Pagination logic
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = blogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(blogs.length / blogsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <Toaster position="top-right" reverseOrder={false} />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit News & Highlights</h1>
          <p className="text-gray-600">Select a News & Highlights from the table to view and edit its content</p>
        </div>

        {/* Skeleton for Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">News & Highlights Posts</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-16 w-24 bg-gray-200 rounded-md"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-7 w-16 bg-blue-200 rounded"></div>
                        <div className="h-7 w-16 bg-red-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit News & Highlights</h1>
        <p className="text-gray-600">Select a News & Highlights from the table to view and edit its content</p>
      </div>

      {/* Blogs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">News & Highlights Posts</h2>
        </div>
        
        {blogs.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-600">
            No News & Highlights found.
          </div>
        ) : loading ? (
          // Skeleton Loading for Table
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-16 w-24 bg-gray-200 rounded-md"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-7 w-16 bg-gray-200 rounded"></div>
                        <div className="h-7 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Banner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentBlogs.map((blog) => (
                    <tr 
                      key={blog.slug}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedBlog && selectedBlog.slug === blog.slug ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleSelectBlog(blog)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={blog.bannerImage}
                          alt={blog.title}
                          className="h-16 w-24 object-cover rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {blog.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectBlog(blog);
                              // Scroll to detail section
                              setTimeout(() => {
                                const detailSection = document.querySelector('.blog-detail-section');
                                if (detailSection) {
                                  detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }, 100);
                            }}
                            className="px-3 py-1 rounded text-white text-xs bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1"
                            title="Select and view details"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Select</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(blog);
                            }}
                            disabled={deleting === blog.slug}
                            className={`px-3 py-1 rounded text-white text-xs ${
                              deleting === blog.slug
                                ? 'bg-red-300 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                            } flex items-center gap-1`}
                            title="Delete blog"
                          >
                            {deleting === blog.slug ? (
                              <Loader2 className="animate-spin h-3 w-3" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            <span>{deleting === blog.slug ? 'Deleting' : 'Delete'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {indexOfFirstBlog + 1} to {Math.min(indexOfLastBlog, blogs.length)} of {blogs.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>      {/* Selected Blog Content */}
      {selectedBlog && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 blog-detail-section">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">News & Highlights Content</h2>
              <p className="text-sm text-gray-600">Viewing: {selectedBlog.title}</p>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={updating || fileLoading}
                    className={`px-4 py-2 rounded-md text-white transition-colors flex items-center gap-2 ${
                      updating || fileLoading
                        ? 'bg-blue-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {updating ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    {updating ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {isEditing ? (
              // Edit Mode
              <div className="edit-section space-y-6">
                {/* Title Edit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Banner Edit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Image
                  </label>
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleBannerChange}
                      disabled={fileLoading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    
                    {editForm.bannerImage && (
                      <div className="relative inline-block">
                        <img
                          src={editForm.bannerImage}
                          alt="Banner"
                          className="h-32 w-48 object-cover rounded-md border"
                        />
                        <button
                          onClick={removeBanner}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Edit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <div ref={quillRef}></div>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-6">
                {/* Title Display */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedBlog.title}</h3>
                </div>

                {/* Banner Display */}
                <div>
                  <img
                    src={selectedBlog.bannerImage}
                    alt={selectedBlog.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>

                {/* Content Display */}
                <div>
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
                    dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
