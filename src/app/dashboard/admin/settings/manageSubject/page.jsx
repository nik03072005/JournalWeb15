'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [editSubject, setEditSubject] = useState({ id: '', name: '' });
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const subjectsRes = await axios.get('/api/subjects');
        setSubjects(subjectsRes.data.subjects || []);
      } catch (err) {
        setError('Failed to fetch subjects');
        toast.error('Failed to fetch subjects');
      }
    };
    fetchData();
  }, []);

  const handleAddSubject = async () => {
    if (!newSubject) {
      toast.error('Please enter a subject name');
      return;
    }
    setSubjectLoading(true);
    try {
      const res = await axios.post('/api/subjects', { subjectName: newSubject });
      setSubjects([...(subjects || []), res.data.subject]);
      setNewSubject('');
      toast.success('Subject added successfully');
    } catch (err) {
      setError('Failed to add new subject');
      toast.error('Failed to add new subject');
    } finally {
      setSubjectLoading(false);
    }
  };

  const handleUpdateSubject = async () => {
    if (!editSubject.id || !editSubject.name) {
      toast.error('Please select a subject and enter a name');
      return;
    }
    setSubjectLoading(true);
    try {
      const res = await axios.put('/api/subjects', {
        id: editSubject.id,
        subjectName: editSubject.name,
      });
      setSubjects((subjects || []).map((subject) => (subject.id === editSubject.id ? res.data.subject : subject)));
      setEditSubject({ id: '', name: '' });
      setSelectedSubject(null);
      toast.success('Subject updated successfully');
    } catch (err) {
      setError('Failed to update subject');
      toast.error('Failed to update subject');
    } finally {
      setSubjectLoading(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    setSubjectLoading(true);
    try {
      await axios.delete('/api/subjects', {
        data: { id },
      });
      setSubjects((subjects || []).filter((subject) => subject.id !== id));
      setSelectedSubject(null);
      setEditSubject({ id: '', name: '' });
      toast.success('Subject deleted successfully');
    } catch (err) {
      setError('Failed to delete subject');
      toast.error('Failed to delete subject');
    } finally {
      setSubjectLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <Toaster position="top-right" reverseOrder={false} />
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Subjects</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Add New Subject</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Add new subject"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddSubject}
            disabled={subjectLoading}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2 cursor-pointer"
          >
            {subjectLoading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
          </button>
        </div>
        <h2 className="text-xl font-bold mb-4">Edit or Delete Subject</h2>
        <div className="flex gap-2 mb-4">
          <select
            value={editSubject.id}
            onChange={(e) => {
              const selected = (subjects || []).find((subject) => subject.id === e.target.value);
              setEditSubject({ id: e.target.value, name: selected?.subjectName || '' });
              setSelectedSubject(selected || null);
            }}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Subject to Edit/Delete</option>
            {(subjects || []).map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subjectName}
              </option>
            ))}
          </select>
        </div>
        {selectedSubject && (
          <div className="flex gap-2 items-center border p-2 rounded">
            <input
              type="text"
              value={editSubject.name}
              onChange={(e) => setEditSubject({ ...editSubject, name: e.target.value })}
              placeholder="New subject name"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleUpdateSubject}
              disabled={subjectLoading}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2 cursor-pointer"
            >
              {subjectLoading ? <Loader2 className="animate-spin" size={20} /> : <Edit2 size={20} />}
            </button>
            <button
              onClick={() => handleDeleteSubject(selectedSubject.id)}
              disabled={subjectLoading}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSubjects;
