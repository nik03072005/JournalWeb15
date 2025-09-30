'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar2 from '@/components/Navbar2';
import { 
    User, 
    Calendar, 
    Activity, 
    BookOpen, 
    FileText, 
    Book,
    Eye,
    Clock,
    TrendingUp,
    BarChart3,
    Heart,
    Trash2,
    X
} from 'lucide-react';
import useAuthStore from '@/utility/justAuth';

const Dashboard = () => {
    // const [user, setUser] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('activity');
    const router = useRouter();

    const { isLoggedIn, user, hasHydrated } = useAuthStore();
    

    // Wait for hydration before checking authentication
    useEffect(() => {
        if (hasHydrated) {
            if (!isLoggedIn) {
                router.push('/auth');
            }
        }
        // setUser(userData);
    }, [hasHydrated, isLoggedIn, router]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                
                // Fetch user profile, recent activity, favorites, and analytics in parallel
                const [ activityRes, favoritesRes, analyticsRes] = await Promise.allSettled([
                    // axios.get('/api/user/profile'),
                    axios.get('/api/user/activity?limit=10'),
                    axios.get('/api/user/favourite'),
                    axios.get('/api/user/analytics')
                ]);

                // if (profileRes.status === 'fulfilled' && profileRes.value.data.success) {
                //     // setUser(profileRes.value.data.data);
                //     console.log(profileRes.value.data.data," User profile fetched successfully");
                // }

                if (activityRes.status === 'fulfilled' && activityRes.value.data.success) {
                    setRecentActivity(activityRes.value.data.data.activities);
                }

                if (favoritesRes.status === 'fulfilled' && favoritesRes.value.data.success) {
                    setFavorites(favoritesRes.value.data.data);
                }

                if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data.success) {
                    setAnalytics(analyticsRes.value.data.data);
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getItemTypeIcon = (itemType) => {
        switch (itemType) {
            case 'doaj':
                return <FileText size={16} className="text-green-600" />;
            case 'doab':
                return <Book size={16} className="text-purple-600" />;
            case 'local':
            case 'journal':
            case 'paper':
                return <BookOpen size={16} className="text-blue-600" />;
            default:
                return <FileText size={16} className="text-gray-600" />;
        }
    };

    const getItemTypeBadge = (itemType) => {
        const badges = {
            doaj: 'bg-green-100 text-green-800',
            doab: 'bg-purple-100 text-purple-800',
            local: 'bg-blue-100 text-blue-800',
            journal: 'bg-blue-100 text-blue-800',
            paper: 'bg-blue-100 text-blue-800',
            book: 'bg-purple-100 text-purple-800'
        };
        
        return badges[itemType] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActivityStats = () => {
        if (!recentActivity.length) return { total: 0, byType: {} };
        
        const total = recentActivity.length;
        const byType = recentActivity.reduce((acc, activity) => {
            acc[activity.itemType] = (acc[activity.itemType] || 0) + 1;
            return acc;
        }, {});
        
        return { total, byType };
    };

    const removeFavorite = async (favoriteId, itemId) => {
        try {
            const response = await axios.delete('/api/user/favourite', {
                data: { itemId }
            });
            
            if (response.data.success !== false) {
                // Remove from local state
                setFavorites(favorites.filter(fav => fav._id !== favoriteId));
                console.log('Favorite removed successfully');
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    const getFavoriteStats = () => {
        if (!favorites.length) return { total: 0, byType: {} };
        
        const total = favorites.length;
        const byType = favorites.reduce((acc, favorite) => {
            acc[favorite.itemType] = (acc[favorite.itemType] || 0) + 1;
            return acc;
        }, {});
        
        return { total, byType };
    };

    if (loading || !hasHydrated) {
        return (
            <>
                <Navbar2 />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">
                            {!hasHydrated ? 'Initializing...' : 'Loading dashboard...'}
                        </p>
                    </div>
                </div>
            </>
        );
    }

    const stats = getActivityStats();
    const favoriteStats = getFavoriteStats();

    return (
        <>
            <Navbar2 />
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="mt-2 text-gray-600">
                            {
                                console.log(user,"ds")
                            }
                            Welcome back, {user?.firstName || 'User'}! Here's your academic activity overview.
                        </p>
                    </div>

                    {/* User Profile Card */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900"> {user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : 'User Name'}</h2>
                                <p className="text-gray-600">{user?.email}</p>
                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={16} />
                                        Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User size={16} />
                                        {user?.role?.charAt(0)?.toUpperCase() + user?.role?.slice(1) || 'User'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Eye className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Favorites</p>
                                    <p className="text-2xl font-bold text-gray-900">{favoriteStats.total}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <Heart className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">DOAJ Articles</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.byType.doaj || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">DOAB Books</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.byType.doab || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Book className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabbed Content Section */}
                    <div className="bg-white rounded-lg shadow-md">
                        {/* Tab Headers */}
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-8 px-6" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('activity')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'activity'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        Recent Activity
                                        {recentActivity.length > 0 && (
                                            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs">
                                                {recentActivity.length}
                                            </span>
                                        )}
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('favorites')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'favorites'
                                            ? 'border-red-500 text-red-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Heart className="w-4 h-4" />
                                        My Favorites
                                        {favorites.length > 0 && (
                                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                                                {favorites.length}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'activity' && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                                        <button 
                                            onClick={() => router.push('/dashboard/activity')}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            View All
                                        </button>
                                    </div>
                                    
                                    {recentActivity.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <h4 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h4>
                                            <p className="text-gray-600 mb-4">
                                                Start exploring articles and books to see your activity here.
                                            </p>
                                            <button 
                                                onClick={() => router.push('/')}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                Start Exploring
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {recentActivity.slice(0, 10).map((activity, index) => (
                                                <div key={index} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getItemTypeIcon(activity.itemType)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getItemTypeBadge(activity.itemType)}`}>
                                                                {activity.itemType.toUpperCase()}
                                                            </span>
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Clock size={12} />
                                                                {formatDate(activity.timestamp)}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                                                            {activity.itemTitle}
                                                        </h4>
                                                        <a 
                                                            href={activity.itemUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:text-blue-800 truncate block"
                                                        >
                                                            View Item →
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'favorites' && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900">My Favorites</h3>
                                        <span className="text-sm text-gray-500">
                                            {favoriteStats.total} item{favoriteStats.total !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    
                                    {favorites.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <h4 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h4>
                                            <p className="text-gray-600 mb-4">
                                                Add articles and books to your favorites to see them here.
                                            </p>
                                            <button 
                                                onClick={() => router.push('/')}
                                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                                            >
                                                Start Exploring
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {favorites.map((favorite) => (
                                                <div key={favorite._id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getItemTypeIcon(favorite.itemType)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getItemTypeBadge(favorite.itemType)}`}>
                                                                {favorite.itemType.toUpperCase()}
                                                            </span>
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Heart size={12} className="text-red-500" />
                                                                Added {formatDate(favorite.createdAt)}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                                                            {favorite.itemTitle}
                                                        </h4>
                                                        <a 
                                                            href={favorite.itemUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:text-blue-800 truncate block"
                                                        >
                                                            View Item →
                                                        </a>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFavorite(favorite._id, favorite.itemId)}
                                                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Remove from favorites"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
