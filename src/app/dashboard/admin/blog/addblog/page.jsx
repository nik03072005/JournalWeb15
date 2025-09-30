'use client';

import React, { useState, useRef, useEffect } from 'react';
import 'quill/dist/quill.snow.css';
import axios from 'axios';
import { Loader2, Trash2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Add custom CSS to style images in Quill editor
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
    padding-bottom: 50px; /* Ensure space at the bottom for writing */
  }
`;

export default function CreateBlog() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [error, setError] = useState('');
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  // Inject custom styles for Quill editor
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);

    const initializeEditor = async () => {
      if (typeof window !== 'undefined' && quillRef.current && !editorRef.current) {
        const Quill = (await import('quill')).default;
        await import('quill/dist/quill.snow.css');

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

        editorRef.current.on('text-change', () => {
          setContent(editorRef.current.root.innerHTML);
        });
      }
    };

    initializeEditor();

    // Cleanup styles on component unmount
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

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
          // Move cursor to the next line after inserting the image
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

  // Handle banner file change and upload
  const handleBannerChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (bannerUrl) {
      toast.error('Banner URL already provided. Remove it to upload a new file.');
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(selectedFile.type)) {
      toast.error('Please select a JPEG or PNG image');
      return;
    }

    setBannerFile(selectedFile);
    setFileLoading(true);
    setError('');

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
        setBannerUrl(response.data.url);
        toast.success(`Banner "${selectedFile.name}" uploaded successfully!`);
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to upload banner';
      setError(errorMessage);
      toast.error(errorMessage);
      setBannerFile(null);
    } finally {
      setFileLoading(false);
    }
  };

  // Remove uploaded banner
  const removeBanner = () => {
    setBannerFile(null);
    setBannerUrl('');
    toast.success('Banner removed');
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!title || !content || !bannerUrl) {
      toast.error('Please fill all fields and upload a banner image');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Creating blog...');
    try {
      const response = await axios.post(
        `/api/blog`,
        {
          title,
          content,
          bannerImage: bannerUrl,
        }
      );

      toast.success(response.data.message || 'Blog created successfully!', { id: toastId });
      // Reset form
      setTitle('');
      setContent('');
      setBannerUrl('');
      setBannerFile(null);
      editorRef.current.root.innerHTML = '';
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error creating blog';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Toaster position="top-right" reverseOrder={false} />
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create a New Blog</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="space-y-6">
        {/* Blog Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Blog Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 p-3 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter blog title"
            required
          />
        </div>

        {/* Banner Image Upload */}
        <div>
          <label htmlFor="banner" className="block text-sm font-medium text-gray-700">
            Banner Image
          </label>
          <input
            type="file"
            id="banner"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleBannerChange}
            disabled={bannerUrl && !fileLoading}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          {bannerFile && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">{bannerFile.name}</span>
              <button
                onClick={removeBanner}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
          {fileLoading && <Loader2 className="animate-spin mt-2" size={20} />}
          {bannerUrl && !fileLoading && (
            <div className="mt-2">
              <p className="text-sm text-green-500">Banner URL: {bannerUrl}</p>
              <img
                src={bannerUrl}
                alt="Banner Preview"
                className="mt-2 h-48 object-cover rounded-md"
              />
            </div>
          )}
        </div>

        {/* Quill Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Blog Content</label>
          <div ref={quillRef} className="mt-1 border rounded-md"></div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className={`w-full sm:w-auto px-6 py-3 rounded-md text-white font-medium transition-colors ${
            isSubmitting || fileLoading
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isSubmitting || fileLoading}
        >
          {isSubmitting || fileLoading ? (
            <Loader2 className="animate-spin inline-block mr-2" size={20} />
          ) : null}
          {isSubmitting ? 'Creating...' : 'Create Blog'}
        </button>
      </div>
    </div>
  );
}