'use client';

import { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Database, 
  TrendingUp, 
  Settings, 
  Eye,
  Plus,
  Edit,
  Shield,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Library,
  ChevronRight,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [extSubscription, setExtSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  //run auto update for admin subscription
  useEffect(() => {
    fetchStats();
  fetchExternalSubscription();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/stats');
      setStats(response.data.data);
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // External subscription check (authoritative for start/end/remaining)
  const fetchExternalSubscription = async () => {
    try {
      if (typeof window === 'undefined') return;
      const domain = window.location.hostname;
      // const domain = 'coemorigaon.digitallib.in';
      const res = await axios.get('https://api.digitallib.in/api/subscriptions/check', {
        params: { domain }
      });
      if (res.data?.exists && res.data?.active) {
        setExtSubscription({
          startDate: res.data.startDate,
          endDate: res.data.endDate,
          status: res.data.status,
          websiteName: res.data.websiteName,
          domain: res.data.domain
        });
      }
    } catch (err) {
      console.warn('External subscription check failed', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Chart configurations
  const contentTypeChart = {
    labels: ['Articles', 'Books', 'Other'],
    datasets: [{
      label: 'Number of Items',
      data: [
        stats?.contentTypeComparison?.articles || 0,
        stats?.contentTypeComparison?.books || 0,
        stats?.contentTypeComparison?.other || 0
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 101, 101, 0.8)'
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 101, 101, 1)'
      ],
      borderWidth: 2
    }]
  };

  const typeBreakdownChart = {
    labels: Object.keys(stats?.localTypeBreakdown || {}),
    datasets: [{
      data: Object.values(stats?.localTypeBreakdown || {}),
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
      ],
      borderWidth: 0
    }]
  };

  const userRoleChart = {
    labels: Object.keys(stats?.userRoleBreakdown || {}),
    datasets: [{
      data: Object.values(stats?.userRoleBreakdown || {}),
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Quick action items
  const quickActions = [
    {
      title: 'Manage Journals',
      description: 'Add, edit, or delete journal entries',
      href: '/dashboard/admin/item/manageJournals',
      icon: BookOpen,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Manage Subjects',
      description: 'Add or modify subject categories',
      href: '/dashboard/admin/item/setting/manageSubject',
      icon: FileText,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Manage Departments',
      description: 'Add or modify department list',
  href: '/dashboard/admin/item/setting/manageDepartment',
      icon: Database,
      color: 'bg-teal-500 hover:bg-teal-600'
    },
    {
      title: 'User Management',
      description: 'View and manage registered users',
      href: '/dashboard/admin/users/manageusers',
      icon: Users,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      href: '/dashboard/admin/analytics/visitors',
      icon: BarChart3,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'FAQ Management',
      description: 'Manage frequently asked questions',
      href: '/dashboard/admin/faq/manage',
      icon: Shield,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Edit News & Highlights Management',
      description: 'Create and manage blog posts',
      href: '/dashboard/admin/blog/editblog',
      icon: Edit,
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="h-screen overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Digital Library of  Vidya Bharati International School, Tinsukia - Administrative Overview
          </p>
        </div>

        {/* Subscription Details */}
        {extSubscription && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                  Subscription Details
                </h2>
                <div className="flex items-center">
                  { extSubscription?.status === 'active' && (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-1" />
                  )}
                  { extSubscription?.status === 'inactive' && (
                    <XCircle className="h-5 w-5 text-red-600 mr-1" />
                  )}
                  { extSubscription?.status === 'suspended' && (
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-1" />
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    extSubscription?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : extSubscription?.status === 'inactive'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(extSubscription?.status || '').charAt(0).toUpperCase() + (extSubscription?.status || '').slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Start Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(extSubscription?.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">End Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(extSubscription?.endDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Days Remaining</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(() => {
                      const end = new Date(extSubscription?.endDate);
                      const now = new Date();
                      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return Math.max(0, diff);
                    })()} days
                  </p>
                </div>
              </div>
              {extSubscription?.websiteName && (
                <div className="mt-4 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Institution:</span> {extSubscription.websiteName} ({extSubscription.domain})
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Local Items</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.overview?.totalLocalItems || 0}</p>
                <p className="text-sm text-blue-600 mt-1">In local database</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Library className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registered Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.overview?.totalUsers || 0}</p>
                <p className="text-sm text-green-600 mt-1">Active accounts</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Local Articles</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.overview?.totalLocalArticles || 0}</p>
                <p className="text-sm text-purple-600 mt-1">Research papers</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Subject Categories</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.overview?.totalSubjects || 0}</p>
                <p className="text-sm text-orange-600 mt-1">Available subjects</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Content Type Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Content Type Distribution</h3>
            </div>
            <div className="h-64">
              <Bar data={contentTypeChart} options={chartOptions} />
            </div>
          </div>

          {/* Local Content Types */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <PieChart className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Local Content Types</h3>
            </div>
            <div className="h-64">
              <Doughnut data={typeBreakdownChart} options={doughnutOptions} />
            </div>
          </div>

          {/* User Roles Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">User Roles Distribution</h3>
            </div>
            <div className="h-64">
              <Doughnut data={userRoleChart} options={doughnutOptions} />
            </div>
          </div>

          {/* Local Library Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Library className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Local Library Overview</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">Research Articles</p>
                  <p className="text-sm text-blue-600">Academic papers and journals</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">{stats?.overview?.totalLocalArticles || 0}</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">Books & Publications</p>
                  <p className="text-sm text-green-600">Books and book chapters</p>
                </div>
                <p className="text-2xl font-bold text-green-700">{stats?.overview?.totalLocalBooks || 0}</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-purple-900">Total Items</p>
                  <p className="text-sm text-purple-600">All content in library</p>
                </div>
                <p className="text-2xl font-bold text-purple-700">{stats?.overview?.totalLocalItems || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Activity className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group block p-4 rounded-lg border border-gray-200 hover:border-transparent hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start space-x-3">
                  <div className={`${action.color} rounded-lg p-2 transition-colors duration-300`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                      {action.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors duration-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Subject Statistics */}
        {stats?.subjectBreakdown && Object.keys(stats.subjectBreakdown).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <div className="flex items-center mb-6">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Content by Subject</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(stats.subjectBreakdown).map(([subject, count]) => (
                <div key={subject} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-700 truncate">{subject}</p>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}