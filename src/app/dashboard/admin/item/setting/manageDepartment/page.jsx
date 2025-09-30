'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ManageDepartments = () => {
	const [departments, setDepartments] = useState([]);
	const [newDepartment, setNewDepartment] = useState('');
	const [editDepartment, setEditDepartment] = useState({ id: '', name: '' });
	const [selectedDepartment, setSelectedDepartment] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await axios.get('/api/departments');
				setDepartments(res.data.departments || []);
			} catch (err) {
				setError('Failed to fetch departments');
				toast.error('Failed to fetch departments');
			}
		};
		fetchData();
	}, []);

	const handleAdd = async () => {
		if (!newDepartment.trim()) {
			toast.error('Please enter a department name');
			return;
		}
		setLoading(true);
		try {
			const res = await axios.post('/api/departments', { departmentName: newDepartment.trim() });
			setDepartments([...(departments || []), res.data.department]);
			setNewDepartment('');
			toast.success('Department added successfully');
		} catch (err) {
			setError('Failed to add department');
			toast.error(err.response?.data?.message || 'Failed to add department');
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async () => {
		if (!editDepartment.id || !editDepartment.name.trim()) {
			toast.error('Please select a department and enter a name');
			return;
		}
		setLoading(true);
		try {
			const res = await axios.put('/api/departments', { id: editDepartment.id, departmentName: editDepartment.name.trim() });
			setDepartments(departments.map(d => d.id === editDepartment.id ? res.data.department : d));
			setEditDepartment({ id: '', name: '' });
			setSelectedDepartment(null);
			toast.success('Department updated successfully');
		} catch (err) {
			setError('Failed to update department');
			toast.error(err.response?.data?.message || 'Failed to update department');
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id) => {
		setLoading(true);
		try {
			await axios.delete('/api/departments', { data: { id } });
			setDepartments(departments.filter(d => d.id !== id));
			setSelectedDepartment(null);
			setEditDepartment({ id: '', name: '' });
			toast.success('Department deleted successfully');
		} catch (err) {
			setError('Failed to delete department');
			toast.error(err.response?.data?.message || 'Failed to delete department');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-lg">
			<Toaster position="top-right" reverseOrder={false} />
			<h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Departments</h1>
			{error && <p className="text-red-500 mb-4">{error}</p>}

			<div className="mb-8">
				<h2 className="text-xl font-bold mb-4">Add New Department</h2>
				<div className="flex gap-2 mb-4">
					<input
						type="text"
						value={newDepartment}
						onChange={(e) => setNewDepartment(e.target.value)}
						placeholder="Add new department"
						className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
					/>
					<button
						onClick={handleAdd}
						disabled={loading}
						className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2 cursor-pointer"
					>
						{loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
					</button>
				</div>

				<h2 className="text-xl font-bold mb-4">Edit or Delete Department</h2>
				<div className="flex gap-2 mb-4">
					<select
						value={editDepartment.id}
						onChange={(e) => {
							const selected = departments.find((d) => d.id === e.target.value);
							setEditDepartment({ id: e.target.value, name: selected?.departmentName || '' });
							setSelectedDepartment(selected || null);
						}}
						className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Select Department to Edit/Delete</option>
						{(departments || []).map((d) => (
							<option key={d.id} value={d.id}>
								{d.departmentName}
							</option>
						))}
					</select>
				</div>
				{selectedDepartment && (
					<div className="flex gap-2 items-center border p-2 rounded">
						<input
							type="text"
							value={editDepartment.name}
							onChange={(e) => setEditDepartment({ ...editDepartment, name: e.target.value })}
							placeholder="New department name"
							className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
						/>
						<button
							onClick={handleUpdate}
							disabled={loading}
							className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2 cursor-pointer"
						>
							{loading ? <Loader2 className="animate-spin" size={20} /> : <Edit2 size={20} />}
						</button>
						<button
							onClick={() => handleDelete(selectedDepartment.id)}
							disabled={loading}
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

export default ManageDepartments;
