import React from 'react';
import MostVisitedPapers from '@/components/MostVisitedPapers';
import { FiTrendingUp, FiAward, FiStar } from 'react-icons/fi';

const PopularPapersPage = () => {
    return (
        <div className="h-screen bg-gray-50">
            <div className="h-screen overflow-y-auto">
                <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <FiAward className="w-6 h-6 text-gold-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Popular Papers</h1>
                </div>
                <p className="text-gray-600">
                    Discover the most popular and trending papers in your repository based on visitor engagement.
                </p>
            </div>

            {/* Top Performers Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Top Local Papers */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <FiStar className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-800">Top Local Papers</h2>
                    </div>
                    <MostVisitedPapers limit={10} paperType="local" />
                </div>

                {/* Top DOAJ Articles */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <FiStar className="w-5 h-5 text-green-600" />
                        <h2 className="text-xl font-semibold text-gray-800">Top DOAJ Articles</h2>
                    </div>
                    <MostVisitedPapers limit={10} paperType="doaj" />
                </div>

                {/* Top DOAJ Journals */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <FiStar className="w-5 h-5 text-cyan-600" />
                        <h2 className="text-xl font-semibold text-gray-800">Top DOAJ Journals</h2>
                    </div>
                    <MostVisitedPapers limit={10} paperType="doaj-journal" />
                </div>
            </div>

            {/* Second row for DOAB and Overall */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top DOAB Books */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <FiStar className="w-5 h-5 text-purple-600" />
                        <h2 className="text-xl font-semibold text-gray-800">Top DOAB Books</h2>
                    </div>
                    <MostVisitedPapers limit={10} paperType="doab" />
                </div>

                {/* Overall Top Papers */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <FiTrendingUp className="w-5 h-5 text-orange-600" />
                        <h2 className="text-xl font-semibold text-gray-800">Overall Most Popular</h2>
                    </div>
                    <MostVisitedPapers limit={15} paperType="all" />
                </div>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Content Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
                    <div>
                        <h4 className="font-medium mb-2">Optimization Tips:</h4>
                        <ul className="space-y-1">
                            <li>• Promote high-performing papers on your homepage</li>
                            <li>• Use popular keywords from top papers in new content</li>
                            <li>• Create similar content to high-traffic papers</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2">Marketing Opportunities:</h4>
                        <ul className="space-y-1">
                            <li>• Share popular papers on social media</li>
                            <li>• Feature trending papers in newsletters</li>
                            <li>• Use popular content for SEO optimization</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        </div>
        </div>
    );
};

export default PopularPapersPage;
