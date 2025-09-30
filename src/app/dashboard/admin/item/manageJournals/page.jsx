'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, Trash2, Edit2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

const manageItem = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [journals, setJournals] = useState([]);
  const [filteredJournals, setFilteredJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    fileUrl: '',
    subjectId: '',
    detail: {
      title: '',
      abstract: '',
      creators: [{ firstName: '', lastName: '', email: '' }],
      guides: [{ firstName: '', lastName: '', email: '' }],
      status: '',
      volume: '',
      number: '',
      pageRange: '',
      date: '',
      references: '',
      keywords: '',
      journalOrPublicationTitle: '',
      issn: '',
      officialURL: '',
      doi: '',
      conference: '',
      bookName: '',
      isbn: '',
      publisher: '',
      preface: '',
      department: '',
      semester: '',
      year: '',
      university: '',
      courseName: '',
      courseCode: '',
    },
  });
  const [file, setFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [journalLoading, setJournalLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    subjectId: '',
    title: '',
    dateFrom: '',
    dateTo: '',
  });

  // Fetch subjects and journals on mount
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [subjectsRes, journalsRes, departmentsRes] = await Promise.all([
          axios.get(`/api/subjects`),
          axios.get(`/api/journal`),
          axios.get(`/api/departments`),
        ]);
        setSubjects(subjectsRes.data.subjects || []);
        setJournals(journalsRes.data.journals || []);
        setFilteredJournals(journalsRes.data.journals || []);
        setDepartments(departmentsRes.data.departments || []);
      } catch (err) {
        setError('Failed to fetch data');
        toast.error('Failed to fetch data');
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter journals based on type, subject, title, and date range
  useEffect(() => {
    let filtered = journals;

    if (filters.type) {
      filtered = filtered.filter((journal) => journal.type === filters.type);
    }

    if (filters.subjectId) {
      filtered = filtered.filter((journal) => journal.subject?._id === filters.subjectId);
    }

    if (filters.title) {
      filtered = filtered.filter((journal) =>
        journal.detail.title.toLowerCase().includes(filters.title.toLowerCase())
      );
    }

    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter((journal) => {
        const journalDate = journal.detail.date;
        if (!journalDate) return false;
        
        // Convert journal date to Date object for comparison
        const journalDateObj = new Date(journalDate);
        
        // Check if journal date is within the specified range
        let isWithinRange = true;
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          isWithinRange = isWithinRange && journalDateObj >= fromDate;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          // Set time to end of day for 'to' date to include the entire day
          toDate.setHours(23, 59, 59, 999);
          isWithinRange = isWithinRange && journalDateObj <= toDate;
        }
        
        return isWithinRange;
      });
    }

    setFilteredJournals(filtered);
  }, [filters, journals]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Reset or adjust detail fields when type changes
  useEffect(() => {
    if (!selectedJournal) return;

    setFormData((prev) => {
      const newDetail = { ...prev.detail };

      // Clear fields not relevant to the new type
      if (prev.type !== formData.type) {
        if (formData.type !== 'Conference Proceeding') {
          newDetail.conference = '';
          newDetail.journalOrPublicationTitle = '';
          newDetail.issn = '';
        }
        if (formData.type !== 'Book Chapters' && formData.type !== 'Book') {
          newDetail.bookName = '';
          newDetail.isbn = '';
        }
        if (formData.type !== 'Book') {
          newDetail.preface = '';
        }
        if (formData.type !== 'Question Papers') {
          newDetail.department = '';
          newDetail.semester = '';
          newDetail.year = '';
          newDetail.courseName = '';
          newDetail.courseCode = '';
        }
        if (formData.type !== 'Research Papers') {
          newDetail.journalOrPublicationTitle = '';
          newDetail.issn = '';
        }
        // University is used for Thesis, Dissertation, and Question Papers
        if (!['Thesis', 'Dissertation', 'Question Papers'].includes(formData.type)) {
          newDetail.university = '';
        }
        // Guides only for Thesis/Dissertation
        if (!['Thesis', 'Dissertation'].includes(formData.type)) {
          newDetail.guides = [{ firstName: '', lastName: '', email: '' }];
        }
      }

      return { ...prev, detail: newDetail };
    });
  }, [formData.type, selectedJournal]);

  // Handle file selection and upload (with replacement support)
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    setFile(selectedFile);
    setFileLoading(true);
    setError('');

    const uploadFormData = new FormData();
    uploadFormData.append('file', selectedFile);

    try {
      const response = await axios.post(`/api/upload`, uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.url) {
        setFormData({ ...formData, fileUrl: response.data.url });
        toast.success(`File "${selectedFile.name}" uploaded successfully!`);
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to upload file';
      setError(errorMessage);
      toast.error(errorMessage);
      setFile(null);
    } finally {
      setFileLoading(false);
    }
  };

  // Remove selected file or URL
  const removeFile = () => {
    setFile(null);
    setFormData({ ...formData, fileUrl: '' });
    toast.success('File or URL removed');
  };

  // Handle URL input
  const handleUrlChange = (e) => {
    if (file) {
      toast.error('File already uploaded. Remove it to enter a URL.');
      return;
    }
    setFormData({ ...formData, fileUrl: e.target.value });
  };

  // Handle form input changes
  const handleInputChange = (e, field, index) => {
    const { name, value } = e.target;
  if (field === 'creators' || field === 'guides') {
      setFormData({
        ...formData,
        detail: {
          ...formData.detail,
          [field]: formData.detail[field].map((item, i) =>
            i === index ? { ...item, [name]: value } : item
          ),
        },
      });
    } else if (field === 'detail') {
      setFormData({
        ...formData,
        detail: { ...formData.detail, [name]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Add new creator field
  const addCreator = () => {
    setFormData({
      ...formData,
      detail: {
        ...formData.detail,
        creators: [...formData.detail.creators, { firstName: '', lastName: '', email: '' }],
      },
    });
  };

  // Add new guide field
  const addGuide = () => {
    setFormData({
      ...formData,
      detail: {
        ...formData.detail,
        guides: [...formData.detail.guides, { firstName: '', lastName: '', email: '' }],
      },
    });
  };

  // Remove creator field
  const removeCreator = (index) => {
    if (formData.detail.creators.length > 1) {
      setFormData({
        ...formData,
        detail: {
          ...formData.detail,
          creators: formData.detail.creators.filter((_, i) => i !== index),
        },
      });
      toast.success('Creator removed');
    } else {
      toast.error('At least one creator is required');
    }
  };

  // Remove guide field
  const removeGuide = (index) => {
    if (formData.detail.guides.length > 1) {
      setFormData({
        ...formData,
        detail: {
          ...formData.detail,
          guides: formData.detail.guides.filter((_, i) => i !== index),
        },
      });
      toast.success('Guide removed');
    } else {
      toast.error('At least one guide is required');
    }
  };

  // Select journal for update
  const handleSelectJournal = (journal) => {
    setSelectedJournal(journal);
    setFormData({
      type: journal.type || '',
      fileUrl: journal.fileUrl || '',
      subjectId: journal.subject?._id || '',
      detail: {
        title: journal.detail.title || '',
        abstract: journal.detail.abstract || '',
        creators: journal.detail.creators.length > 0 ? journal.detail.creators : [{ firstName: '', lastName: '', email: '' }],
        guides: journal.detail.guides?.length > 0 ? journal.detail.guides : [{ firstName: '', lastName: '', email: '' }],
        status: journal.detail.status || '',
        volume: journal.detail.volume || '',
        number: journal.detail.number || '',
        pageRange: journal.detail.pageRange || '',
        date: journal.detail.date ? new Date(journal.detail.date).toISOString().split('T')[0] : '',
        references: journal.detail.references || '',
        keywords: journal.detail.keywords || '',
        journalOrPublicationTitle: journal.detail.journalOrPublicationTitle || '',
        issn: journal.detail.issn || '',
        officialURL: journal.detail.officialURL || '',
        doi: journal.detail.doi || '',
        conference: journal.detail.conference || '',
        bookName: journal.detail.bookName || '',
        isbn: journal.detail.isbn || '',
        publisher: journal.detail.publisher || '',
        preface: journal.detail.preface || '',
        department: journal.detail.department || '',
        semester: journal.detail.semester || '',
        year: journal.detail.year || '',
  university: journal.detail.university || '',
  courseName: journal.detail.courseName || '',
  courseCode: journal.detail.courseCode || '',
      },
    });
    setFile(null);
    setStep(1);
  };

  // Update journal
  const handleUpdateJournal = async () => {
    if (!selectedJournal) {
      toast.error('No journal selected for update');
      return;
    }
    setJournalLoading(true);
    try {
      const response = await axios.put(`/api/journal`, {
        id: selectedJournal._id,
        type: formData.type,
        fileUrl: formData.fileUrl,
        subjectId: formData.subjectId,
        detail: formData.detail,
      });
      const updatedJournals = journals.map((j) => (j._id === selectedJournal._id ? response.data.journal : j));
      setJournals(updatedJournals);
      setFilteredJournals(updatedJournals);
      setSelectedJournal(null);
      setFormData({
        type: '',
        fileUrl: '',
        subjectId: '',
        detail: {
          title: '',
          abstract: '',
          creators: [{ firstName: '', lastName: '', email: '' }],
          guides: [{ firstName: '', lastName: '', email: '' }],
          status: '',
          volume: '',
          number: '',
          pageRange: '',
          date: '',
          references: '',
          keywords: '',
          journalOrPublicationTitle: '',
          issn: '',
          officialURL: '',
          doi: '',
          conference: '',
          bookName: '',
          isbn: '',
          publisher: '',
          preface: '',
          department: '',
          semester: '',
          year: '',
          university: '',
        },
      });
      setFile(null);
      setStep(1);
      toast.success('Journal updated successfully');
      router.push('/dashboard/admin');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update journal';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setJournalLoading(false);
    }
  };

  // Delete journal
  const handleDeleteJournal = async (id) => {
    setJournalLoading(true);
    try {
      await axios.delete(`/api/journal`, {
        data: { id },
      });
      const updatedJournals = journals.filter((journal) => journal._id !== id);
      setJournals(updatedJournals);
      setFilteredJournals(updatedJournals);
      toast.success('Journal deleted successfully');
    } catch (err) {
      setError('Failed to delete journal');
      toast.error('Failed to delete journal');
    } finally {
      setJournalLoading(false);
    }
  };

  // Validation for proceeding to next step
  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.type.trim() !== '';
      case 2:
        return formData.fileUrl.trim() !== '';
      case 3:
        return (
          formData.detail.title.trim() !== '' &&
          (formData.type !== 'Question Papers'
            ? formData.detail.creators.every(
                (creator) =>
                  creator.firstName.trim() !== '' &&
                  creator.lastName.trim() !== '' &&
                  creator.email.trim() !== ''
              )
            : true) &&
          (['Conference Proceeding', 'Book', 'Book Chapters', 'Research Papers', 'Thesis', 'Dissertation'].includes(formData.type)
            ? formData.detail.abstract.trim() !== ''
            : true) &&
          (formData.type === 'Conference Proceeding'
            ? formData.detail.conference.trim() !== '' &&
              formData.detail.journalOrPublicationTitle.trim() !== '' &&
              formData.detail.issn.trim() !== '' &&
              formData.detail.officialURL.trim() !== '' &&
              formData.detail.doi.trim() !== ''
            : true) &&
          (formData.type === 'Book Chapters'
            ? formData.detail.bookName.trim() !== '' &&
              formData.detail.isbn.trim() !== '' &&
              formData.detail.publisher.trim() !== '' &&
              formData.detail.doi.trim() !== ''
            : true) &&
          (formData.type === 'Book'
            ? formData.detail.isbn.trim() !== '' &&
              formData.detail.publisher.trim() !== '' &&
              formData.detail.preface.trim() !== '' &&
              formData.detail.doi.trim() !== ''
            : true) &&
          (formData.type === 'Question Papers'
            ? formData.detail.department.trim() !== '' &&
              formData.detail.semester.trim() !== '' &&
              formData.detail.year.trim() !== '' &&
              formData.detail.courseName.trim() !== '' &&
              formData.detail.courseCode.trim() !== '' &&
              formData.detail.university.trim() !== ''
            : true) &&
          (formData.type === 'Research Papers'
            ? formData.detail.journalOrPublicationTitle.trim() !== '' &&
              formData.detail.issn.trim() !== '' &&
              formData.detail.doi.trim() !== ''
            : true) &&
          (['Thesis', 'Dissertation'].includes(formData.type)
            ? formData.detail.abstract.trim() !== '' &&
              formData.detail.university.trim() !== '' &&
              formData.detail.guides.every(
                (guide) =>
                  guide.firstName.trim() !== '' &&
                  guide.lastName.trim() !== '' &&
                  guide.email.trim() !== ''
              ) &&
              formData.detail.date.trim() !== '' &&
              formData.detail.pageRange.trim() !== '' &&
              formData.detail.keywords.trim() !== ''
            : true)
        );
      case 4:
        return formData.subjectId.trim() !== '';
      default:
        return true;
    }
  };

  // Render skeleton loader
  const renderSkeleton = () => {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex justify-between items-center border p-2 rounded animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="flex gap-2">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render steps for updating journal
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Step 1: Select Type</h2>
            <select
              name="type"
              value={formData.type}
              onChange={(e) => handleInputChange(e)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Type</option>
              <option value="Conference Proceeding">Conference Proceeding</option>
              <option value="Book">Book</option>
              <option value="Book Chapters">Book Chapters</option>
              <option value="Question Papers">Question Papers</option>
              <option value="Research Papers">Research Papers</option>
              <option value="Thesis">Thesis</option>
              <option value="Dissertation">Dissertation</option>
            </select>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Step 2: Provide File or URL</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                  {formData.fileUrl ? 'Replace with New PDF File' : 'Upload PDF File'}
                </label>
                <input
                  type="file"
                  id="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {file && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <button
                    onClick={removeFile}
                    className="p-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              <div>
                <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700">
                  {formData.fileUrl && !file ? 'Replace with New File URL' : 'Or Enter File URL'}
                </label>
                <input
                  type="text"
                  id="fileUrl"
                  name="fileUrl"
                  value={formData.fileUrl}
                  onChange={handleUrlChange}
                  placeholder="Enter file URL (e.g., https://example.com/document.pdf)"
                  disabled={file}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              {fileLoading && <Loader2 className="animate-spin" size={20} />}
              {formData.fileUrl && !fileLoading && (
                <p className="text-sm text-green-500">
                  Current File URL:{' '}
                  <a
                    href={formData.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 hover:text-blue-800"
                  >
                    View File
                  </a>
                </p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Step 3: Enter Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input
                  type="text"
                  name="title"
                  value={formData.detail.title}
                  onChange={(e) => handleInputChange(e, 'detail')}
                  placeholder="Title"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
                {['Conference Proceeding', 'Book', 'Book Chapters', 'Research Papers', 'Thesis', 'Dissertation'].includes(formData.type) && (
                  <textarea
                    name="abstract"
                    value={formData.detail.abstract}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Abstract"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 h-32"
                    required
                  />
                )}
                {['Conference Proceeding', 'Book', 'Book Chapters', 'Research Papers'].includes(formData.type) && (
                  <input
                    type="number"
                    name="volume"
                    value={formData.detail.volume}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Volume"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                )}
                {['Conference Proceeding', 'Research Papers'].includes(formData.type) && (
                  <input
                    type="number"
                    name="number"
                    value={formData.detail.number}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Number"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                )}
                {['Conference Proceeding', 'Book Chapters', 'Book', 'Research Papers', 'Thesis', 'Dissertation'].includes(formData.type) && (
                  <input
                    type="text"
                    name="pageRange"
                    value={formData.detail.pageRange}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Page Range (e.g., 1-10)"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required={['Thesis', 'Dissertation'].includes(formData.type)}
                  />
                )}
                {['Conference Proceeding', 'Book Chapters', 'Book', 'Research Papers'].includes(formData.type) && (
                  <select
                    name="status"
                    value={formData.detail.status}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="In Press">In Press</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Pending">Pending</option>
                  </select>
                )}
                {['Conference Proceeding', 'Book Chapters', 'Book', 'Research Papers', 'Thesis', 'Dissertation'].includes(formData.type) && (
                  <input
                    type="date"
                    name="date"
                    value={formData.detail.date}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Submitted Date"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required={['Thesis', 'Dissertation'].includes(formData.type)}
                  />
                )}
                {formData.type === 'Conference Proceeding' && (
                  <input
                    type="text"
                    name="conference"
                    value={formData.detail.conference}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Conference"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
                {formData.type === 'Question Papers' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      name="department"
                      value={formData.detail.department}
                      onChange={(e) => handleInputChange(e, 'detail')}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Department</option>
                      {(departments || []).map((dept) => (
                        <option key={dept.id} value={dept.departmentName}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {formData.type === 'Question Papers' && (
                  <>
                    <input
                      type="text"
                      name="courseName"
                      value={formData.detail.courseName}
                      onChange={(e) => handleInputChange(e, 'detail')}
                      placeholder="Course Name"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      name="courseCode"
                      value={formData.detail.courseCode}
                      onChange={(e) => handleInputChange(e, 'detail')}
                      placeholder="Course Code"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </>
                )}
                {['Question Papers', 'Thesis', 'Dissertation'].includes(formData.type) && (
                  <input
                    type="text"
                    name="university"
                    value={formData.detail.university}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="University"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
              </div>
              <div className="space-y-4">
                {['Conference Proceeding', 'Research Papers'].includes(formData.type) && (
                  <input
                    type="text"
                    name="journalOrPublicationTitle"
                    value={formData.detail.journalOrPublicationTitle}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Journal or Publication Title"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
                {['Conference Proceeding', 'Research Papers'].includes(formData.type) && (
                  <input
                    type="text"
                    name="issn"
                    value={formData.detail.issn}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="ISSN"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
                {['Book Chapters', 'Book'].includes(formData.type) && (
                  <input
                    type="text"
                    name="bookName"
                    value={formData.detail.bookName}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Book Name"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
                {['Book Chapters', 'Book'].includes(formData.type) && (
                  <input
                    type="text"
                    name="isbn"
                    value={formData.detail.isbn}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="ISBN"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
                {['Book Chapters', 'Book', 'Research Papers'].includes(formData.type) && (
                  <input
                    type="text"
                    name="publisher"
                    value={formData.detail.publisher}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Publisher"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
                {formData.type === 'Book' && (
                  <input
                    type="text"
                    name="preface"
                    value={formData.detail.preface}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Preface"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
                {formData.type === 'Question Papers' && (
                  <>
                    <input
                      type="text"
                      name="semester"
                      value={formData.detail.semester}
                      onChange={(e) => handleInputChange(e, 'detail')}
                      placeholder="Semester"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      name="year"
                      value={formData.detail.year}
                      onChange={(e) => handleInputChange(e, 'detail')}
                      placeholder="Year"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </>
                )}
                {['Conference Proceeding', 'Book Chapters', 'Book', 'Research Papers'].includes(formData.type) && (
                  <input
                    type="text"
                    name="officialURL"
                    value={formData.detail.officialURL}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Official URL"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                )}
                {['Conference Proceeding', 'Book Chapters', 'Book', 'Research Papers'].includes(formData.type) && (
                  <input
                    type="text"
                    name="doi"
                    value={formData.detail.doi}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="DOI"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                )}
                {['Conference Proceeding', 'Book Chapters', 'Book', 'Research Papers'].includes(formData.type) && (
                  <textarea
                    name="references"
                    value={formData.detail.references}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="References"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 h-32"
                  />
                )}
                {['Conference Proceeding', 'Book Chapters', 'Book', 'Question Papers', 'Research Papers', 'Thesis', 'Dissertation'].includes(formData.type) && (
                  <input
                    type="text"
                    name="keywords"
                    value={formData.detail.keywords}
                    onChange={(e) => handleInputChange(e, 'detail')}
                    placeholder="Keywords (comma-separated)"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required={['Thesis', 'Dissertation'].includes(formData.type)}
                  />
                )}
              </div>
            </div>
            {formData.type !== 'Question Papers' && (
              <div className="space-y-4 mt-6">
                <h3 className="font-semibold">Creators</h3>
                {formData.detail.creators.map((creator, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 border p-4 rounded items-center">
                    <input
                      type="text"
                      name="firstName"
                      value={creator.firstName}
                      onChange={(e) => handleInputChange(e, 'creators', index)}
                      placeholder="First Name"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      name="lastName"
                      value={creator.lastName}
                      onChange={(e) => handleInputChange(e, 'creators', index)}
                      placeholder="Last Name"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      value={creator.email}
                      onChange={(e) => handleInputChange(e, 'creators', index)}
                      placeholder="Email"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {formData.detail.creators.length > 1 && (
                      <button
                        onClick={() => removeCreator(index)}
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addCreator}
                  className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={20} /> Add Creator
                </button>
              </div>
            )}
            {['Thesis', 'Dissertation'].includes(formData.type) && (
              <div className="space-y-4 mt-6">
                <h3 className="font-semibold">Guides</h3>
                {formData.detail.guides.map((guide, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 border p-4 rounded items-center">
                    <input
                      type="text"
                      name="firstName"
                      value={guide.firstName}
                      onChange={(e) => handleInputChange(e, 'guides', index)}
                      placeholder="First Name"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      name="lastName"
                      value={guide.lastName}
                      onChange={(e) => handleInputChange(e, 'guides', index)}
                      placeholder="Last Name"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      value={guide.email}
                      onChange={(e) => handleInputChange(e, 'guides', index)}
                      placeholder="Email"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {formData.detail.guides.length > 1 && (
                      <button
                        onClick={() => removeGuide(index)}
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addGuide}
                  className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={20} /> Add Guide
                </button>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Step 4: Select Subject</h2>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={(e) => handleInputChange(e)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Step 5: Review and Update</h2>
            <p>Please review your information before updating.</p>
            <button
              onClick={handleUpdateJournal}
              disabled={journalLoading || fileLoading}
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 flex items-center gap-2 cursor-pointer"
            >
              {journalLoading || fileLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
              Update Journal
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gray-50">
      <div className="h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg m-6">
      <Toaster position="top-right" reverseOrder={false} />
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Items</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Filter Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Filter Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="filterType" className="block text-sm font-medium text-gray-700">
              Filter by Type
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={dataLoading}
            >
              <option value="">All Types</option>
              <option value="Conference Proceeding">Conference Proceeding</option>
              <option value="Book">Book</option>
            university: '',
            courseName: '',
            courseCode: '',
              <option value="Question Papers">Question Papers</option>
              <option value="Research Papers">Research Papers</option>
              <option value="Thesis">Thesis</option>
              <option value="Dissertation">Dissertation</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterSubject" className="block text-sm font-medium text-gray-700">
              Filter by Subject
            </label>
            <select
              name="subjectId"
              value={filters.subjectId}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={dataLoading}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterTitle" className="block text-sm font-medium text-gray-700">
              Search by Title
            </label>
            <input
              type="text"
              name="title"
              value={filters.title}
              onChange={handleFilterChange}
              placeholder="Enter title..."
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={dataLoading}
            />
          </div>
          <div>
            <label htmlFor="filterDateFrom" className="block text-sm font-medium text-gray-700">
              Date From
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={dataLoading}
            />
          </div>
          <div>
            <label htmlFor="filterDateTo" className="block text-sm font-medium text-gray-700">
              Date To
            </label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              disabled={dataLoading}
            />
          </div>
        </div>
      </div>

      {/* Manage Journals */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Items</h2>
        {dataLoading ? (
          renderSkeleton()
        ) : (
          <div className="space-y-2">
            {filteredJournals.map((journal, i) => (
              <div key={journal._id || i} className="flex justify-between items-center border p-2 rounded">
                <span>{journal.detail.title} ({journal.type})</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelectJournal(journal)}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 cursor-pointer"
                    disabled={journalLoading}
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteJournal(journal._id)}
                    disabled={journalLoading}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {filteredJournals.length === 0 && (
              <p className="text-gray-500">No items match the selected filters.</p>
            )}
          </div>
        )}
      </div>

      {/* Update Item Form */}
      {selectedJournal && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Update Item: {selectedJournal.detail.title}</h2>
          <div className="mb-6">
            <p className="text-sm text-gray-600">Step {step} of 5</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              ></div>
            </div>
          </div>
          {renderStep()}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2 cursor-pointer"
              >
                Previous
              </button>
            )}
            {step < 5 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2 cursor-pointer"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
  );
};

export default manageItem;