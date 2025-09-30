'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import toast, { Toaster } from 'react-hot-toast';

// Skeleton Loader Component
const JournalSkeletonCard = () => (
  <div className="bg-white text-[#003366] rounded shadow-md overflow-hidden w-full h-[320px] animate-pulse">
    <div className="p-6 space-y-4 flex flex-col justify-between h-full">
      <div>
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
      </div>
      <div className="h-10 bg-gray-300 rounded w-full mt-4"></div>
    </div>
  </div>
);

export default function CollectionsCarouselSwiper() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchJournals = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/journal`);
        const limitedJournals = response.data.journals.slice(0, 8);
        setJournals(limitedJournals || []);
      } catch (err) {
        setError('Failed to fetch journals');
        toast.error('Failed to fetch journals');
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, []);

  return (
    <section className="bg-[#0077a5] py-12 px-4 md:px-20 text-white">
      <Toaster position="top-right" reverseOrder={false} />
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">Recent Publish</h2>
      <div className="w-16 h-1 bg-yellow-400 mx-auto mb-8"></div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
            <JournalSkeletonCard key={idx} />
          ))}
        </div>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={24}
          breakpoints={{
            0: { slidesPerView: 1 },
            640: { slidesPerView: 1.2 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
        >
          {journals.map((journal, idx) => (
            <SwiperSlide key={journal._id || idx}>
              <div className="bg-white text-[#003366] rounded shadow-md overflow-hidden max-w-sm mx-auto h-[320px]">
                <div className="p-6 flex flex-col justify-between h-full">
                  <div className="flex flex-col flex-grow">
                    <h3 className="font-bold text-lg mb-2">
                      {journal.detail.title
                        ? journal.detail.title.length > 50
                          ? journal.detail.title.substring(0, 50) + '...'
                          : journal.detail.title
                        : 'No title available'}
                    </h3>
                    <div className="text-blue-600 text-sm mb-2">
                      {journal?.detail?.creators?.map((author, index) => (
                        <span key={index}>
                          <span className="hover:underline cursor-pointer">
                            {author?.firstName} {author?.lastName}
                          </span>
                          {index < journal.detail.creators.length - 1 && ", "}
                        </span>
                      )) || "Unknown Author"}
                    </div>
                    <div className="text-gray-700 text-sm mb-2 italic">
                      <span className="font-medium">
                        {journal.detail?.journalOrPublicationTitle?.length > 50
                          ? journal.detail.journalOrPublicationTitle.substring(0, 50) + '...'
                          : journal.detail?.journalOrPublicationTitle || journal.detail?.title}
                      </span>
                      {journal.detail?.volume && <span> Vol. {journal.detail.volume}</span>}
                      {journal.detail?.publisher && (
                        <span>, {journal.isDoabBook ? 'Publisher' : 'Book Publisher'} {journal.detail.publisher.length > 30 ? journal.detail.publisher.substring(0, 30) + '...' : journal.detail.publisher}</span>
                      )}
                      {(journal.detail?.publicationDate || journal.detail?.date) && (
                        <span> ({new Date(journal.detail.publicationDate || journal.detail.date).getFullYear()})</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto">
                    <button
                      onClick={() => router.push(`/paper/${journal._id}`)}
                      className="bg-yellow-400 cursor-pointer text-[#003366] font-bold py-2 px-4 rounded text-center block w-full hover:bg-yellow-500 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}