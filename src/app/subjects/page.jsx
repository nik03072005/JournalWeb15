'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiBook, FiSearch, FiTrendingUp } from 'react-icons/fi';

// Alphabet letters
const ALPHABETS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

const SubjectsPage = () => {
    const [selectedLetter, setSelectedLetter] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Default subject categories with descriptions (fallback data)
    const defaultSubjects = [
        { name: 'Computer Science', description: 'Software engineering, algorithms, AI, machine learning, and programming' },
        { name: 'Engineering', description: 'Mechanical, electrical, civil, chemical, and aerospace engineering' },
        { name: 'Medicine', description: 'Medical research, clinical studies, healthcare, and biomedical sciences' },
        { name: 'Physics', description: 'Theoretical physics, quantum mechanics, astrophysics, and particle physics' },
        { name: 'Chemistry', description: 'Organic, inorganic, physical chemistry, and materials science' },
        { name: 'Biology', description: 'Molecular biology, genetics, ecology, and life sciences' },
        { name: 'Mathematics', description: 'Pure mathematics, applied mathematics, statistics, and computational math' },
        { name: 'Psychology', description: 'Cognitive psychology, behavioral studies, and mental health research' },
        { name: 'Economics', description: 'Microeconomics, macroeconomics, behavioral economics, and finance' },
        { name: 'Environmental Science', description: 'Climate change, sustainability, ecology, and environmental policy' },
        { name: 'Materials Science', description: 'Nanotechnology, polymers, ceramics, and advanced materials' },
        { name: 'Biotechnology', description: 'Genetic engineering, bioinformatics, and bioprocessing' },
        { name: 'Artificial Intelligence', description: 'Machine learning, deep learning, neural networks, and AI applications' },
        { name: 'Data Science', description: 'Big data, analytics, data mining, and statistical modeling' },
        { name: 'Renewable Energy', description: 'Solar, wind, hydroelectric, and sustainable energy technologies' },
    ];

    // Fetch subjects from API
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/subjects');
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.subjects && Array.isArray(data.subjects)) {
                        // Transform API subjects to match our format
                        const apiSubjects = data.subjects.map(subject => ({
                            id: subject.id,
                            name: subject.subjectName,
                            description: `Explore research and academic papers in ${subject.subjectName}`,
                            isFromAPI: true
                        }));
                        
                        // Combine API subjects with default subjects
                        const combinedSubjects = [...apiSubjects];
                        
                        // Add default subjects that are not already in API data
                        defaultSubjects.forEach(defaultSubject => {
                            const exists = apiSubjects.some(apiSubject => 
                                apiSubject.name.toLowerCase() === defaultSubject.name.toLowerCase()
                            );
                            if (!exists) {
                                combinedSubjects.push({
                                    ...defaultSubject,
                                    isFromAPI: false
                                });
                            }
                        });
                        
                        setSubjects(combinedSubjects);
                    } else {
                        // Fallback to default subjects if API fails
                        setSubjects(defaultSubjects.map(subject => ({ ...subject, isFromAPI: false })));
                    }
                } else {
                    // Fallback to default subjects if API fails
                    setSubjects(defaultSubjects.map(subject => ({ ...subject, isFromAPI: false })));
                }
            } catch (error) {
                console.error('Error fetching subjects:', error);
                // Fallback to default subjects
                setSubjects(defaultSubjects.map(subject => ({ ...subject, isFromAPI: false })));
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    // Sort subjects alphabetically
    const sortedSubjects = [...subjects].sort((a, b) => a.name.localeCompare(b.name));

    // Filtered by selected alphabet
    const filteredSubjects = selectedLetter
        ? sortedSubjects.filter(subject => subject.name.toUpperCase().startsWith(selectedLetter))
        : sortedSubjects;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="max-w-7xl mx-auto px-6 py-12">

                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Research by Subject</h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Explore academic papers, journals, and books organized by subject areas.
                        Find the latest research in your field of interest.
                    </p>
                </div>

                {/* Alphabet Filter */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    <button
                        onClick={() => setSelectedLetter('')}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${selectedLetter === '' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        All
                    </button>
                    {ALPHABETS.map(letter => (
                        <button
                            key={letter}
                            onClick={() => setSelectedLetter(letter)}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${selectedLetter === letter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            {letter}
                        </button>
                    ))}
                </div>

                {/* Statistics Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                        <FiBook className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{subjects.length}+</h3>
                        <p className="text-gray-600">Subject Areas</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                        <FiSearch className="w-12 h-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">1000+</h3>
                        <p className="text-gray-600">Research Papers</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                        <FiTrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">50+</h3>
                        <p className="text-gray-600">Academic Journals</p>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading subjects...</span>
                    </div>
                ) : (
                    <>
                        {/* Subjects Grid */}
                        {filteredSubjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredSubjects.map((subject, index) => (
                                    <Link
                                        key={subject.id || subject.name}
                                        href={`/subjects/${encodeURIComponent(subject.name.toLowerCase().replace(/\s+/g, '-'))}`}
                                        className="group"
                                    >
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                            {/* Header with book icon */}
                                            <div className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 relative">
                                                <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                                                <div className="absolute bottom-4 left-6">
                                                    <FiBook className="w-8 h-8 text-white" />
                                                </div>
                                                {subject.isFromAPI && (
                                                    <div className="absolute top-2 right-2">
                                                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                                            Live
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                                                    {subject.name}
                                                </h3>
                                                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                                    {subject.description}
                                                </p>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
                                                        Explore Research →
                                                    </span>
                                                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                        <FiSearch className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <FiBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No subjects found</h3>
                                <p className="text-gray-600">
                                    No subjects match the selected filter. Try selecting a different letter or "All".
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Call to Action */}
                <div className="mt-16 text-center">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Can't find your subject?</h2>
                        <p className="text-gray-600 mb-6">
                            Use our advanced search to find research across all subjects and databases.
                        </p>
                        <Link
                            href="/advanceSearch"
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            <FiSearch className="w-5 h-5" />
                            Advanced Search
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectsPage;
