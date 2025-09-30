'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ firstname: '', lastname: '', mobileNumber: '', role: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
      console.log(response, " fetched users successfully");
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch users');
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user._id);
    setFormData({
      firstname: user.firstname,
      lastname: user.lastname,
      mobileNumber: user.mobileNumber,
      role: user.role,
      password: '',
    });
  };

  const handleUpdate = async (userId) => {
    try {
      // Only include password in the update if it's non-empty
      const updateData = { userId, firstname: formData.firstname, lastname: formData.lastname, mobileNumber: formData.mobileNumber, role: formData.role };
      if (formData.password) {
        updateData.password = formData.password;
      }
      await axios.put('/api/users', updateData);
      toast.success('User updated successfully');
      setEditingUser(null);
      setFormData({ firstname: '', lastname: '', mobileNumber: '', role: '', password: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete('/api/users', { data: { userId } });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
    
    if (term === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.firstname.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }
  };

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const handleExportCSV = () => {
    try {
      const headers = ['First Name', 'Last Name', 'Email', 'Mobile Number', 'Role'];
      const rows = (filteredUsers || []).map(u => [
        escapeCSV(u.firstname || ''),
        escapeCSV(u.lastname || ''),
        escapeCSV(u.email || ''),
        escapeCSV(u.mobileNumber || ''),
        escapeCSV(u.role || ''),
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'users.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed', err);
      toast.error('Failed to export CSV');
    }
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        <Toaster />
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Admin User Management</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-2 sm:px-4 sm:py-3 border text-left">First Name</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 border text-left">Last Name</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 border text-left">Email</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 border text-left">Mobile Number</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 border text-left">Role</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 border text-left">Password</th>
                <th className="px-2 py-2 sm:px-4 sm:py-3 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-2 py-2 sm:px-4 sm:py-3 border">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                  <td className="px-2 py-2 sm:px-4 sm:py-3 border">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                  <td className="px-2 py-2 sm:px-4 sm:py-3 border">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                  <td className="px-2 py-2 sm:px-4 sm:py-3 border">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                  <td className="px-2 py-2 sm:px-4 sm:py-3 border">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </td>
                  <td className="px-2 py-2 sm:px-4 sm:py-3 border">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </td>
                  <td className="px-2 py-2 sm:px-4 sm:py-3 border">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <Toaster />
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Admin User Management</h1>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
          title="Export filtered users to CSV"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>
      
      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by first name or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border-2 border-gray-300 text-sm sm:text-base shadow-lg rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <th className="px-2 py-3 sm:px-4 sm:py-4 border border-gray-300 text-left font-semibold text-gray-700">First Name</th>
              <th className="px-2 py-3 sm:px-4 sm:py-4 border border-gray-300 text-left font-semibold text-gray-700">Last Name</th>
              <th className="px-2 py-3 sm:px-4 sm:py-4 border border-gray-300 text-left font-semibold text-gray-700">Email</th>
              <th className="px-2 py-3 sm:px-4 sm:py-4 border border-gray-300 text-left font-semibold text-gray-700">Mobile Number</th>
              <th className="px-2 py-3 sm:px-4 sm:py-4 border border-gray-300 text-left font-semibold text-gray-700">Role</th>
              <th className="px-2 py-3 sm:px-4 sm:py-4 border border-gray-300 text-left font-semibold text-gray-700">Password</th>
              <th className="px-2 py-3 sm:px-4 sm:py-4 border border-gray-300 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user._id} className="hover:bg-blue-50 transition-colors duration-150">
                <td className="px-2 py-2 sm:px-4 sm:py-3 border border-gray-300">
                  {editingUser === user._id ? (
                    <input
                      type="text"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleInputChange}
                      className="w-full p-1 sm:p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{user.firstname}</span>
                  )}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 border border-gray-300">
                  {editingUser === user._id ? (
                    <input
                      type="text"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleInputChange}
                      className="w-full p-1 sm:p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{user.lastname}</span>
                  )}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 border border-gray-300 truncate max-w-[150px] sm:max-w-[200px]">
                  <span className="text-blue-600 font-medium">{user.email}</span>
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 border border-gray-300">
                  {editingUser === user._id ? (
                    <input
                      type="text"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      className="w-full p-1 sm:p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <span className="text-gray-700">{user.mobileNumber}</span>
                  )}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 border border-gray-300">
                  {editingUser === user._id ? (
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full p-1 sm:p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="teachingStaff">Teaching Staff</option>
                      <option value="student">Student</option>
                      <option value="nonTeachingStaff">Non-Teaching Staff</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : user.role === 'teachingStaff'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'teachingStaff' ? 'Teaching Staff' : 
                       user.role === 'nonTeachingStaff' ? 'Non-Teaching Staff' : 
                       user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 border border-gray-300">
                  {editingUser === user._id ? (
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter new password (optional)"
                      className="w-full p-1 sm:p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <span className="text-gray-500 font-mono">••••••••</span>
                  )}
                </td>
                <td className="px-2 py-2 sm:px-4 sm:py-3 border border-gray-300">
                  {editingUser === user._id ? (
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => handleUpdate(user._id)}
                        className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 text-sm font-medium transition-colors duration-200"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 text-sm font-medium transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
                        title="Edit user"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                        title="Delete user"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`p-2 rounded-md transition-colors duration-200 ${
              currentPage === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md transition-colors duration-200 ${
              currentPage === totalPages 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}