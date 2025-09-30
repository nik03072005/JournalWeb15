'use client';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

// Skeleton Card Component
const SkeletonCard = () => (
  <div className="bg-white shadow-md rounded-lg overflow-hidden animate-pulse h-96">
    <div className="h-48 bg-gray-300 w-full" />
    <div className="p-6 space-y-3 flex flex-col h-48">
      <div className="h-5 bg-gray-300 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-10 bg-gray-300 rounded w-32 mt-auto" />
    </div>
  </div>
);

export default function NewsHighlights() {
  const [newslater, setNewslater] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get(`/api/blog`);
        setNewslater(response.data.blogs || []);
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <section className="bg-blue-50 py-12 px-4 md:px-20">
      <style jsx>{`
        .mySwiper .swiper-slide {
          height: 24rem !important;
          display: flex !important;
        }
        .mySwiper .swiper-slide > div {
          height: 100% !important;
        }
      `}</style>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-[#003366]">
        News and Highlights
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : newslater.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No blogs available at the moment.</p>
        </div>
      ) : (
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView="auto"
          breakpoints={{
            0: { slidesPerView: 1 },
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 2500 }}
          loop={true}
          className="mySwiper"
          style={{
            '--swiper-slide-height': '24rem',
          }}
        >
          {newslater.slice(0, 6).map((blog, idx) => (
            <SwiperSlide
              key={blog._id}
              style={{ height: '24rem' }}
              className="!h-96"
            >
              <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                <div className="h-48 overflow-hidden flex-shrink-0 relative">
                  <Image
                    src={blog.bannerImage}
                    alt={blog.title}
                    width={400}
                    height={192}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded">
                    NEWS POST
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-grow h-48">
                  <h3 className="font-semibold text-lg mb-3 text-[#003366] line-clamp-2 h-14 flex-shrink-0">
                    {blog.title}
                  </h3>
                  <p className="text-gray-700 mb-4 line-clamp-3 text-sm flex-grow overflow-hidden">
                    {truncateText(stripHtml(blog.content), 120)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    <button
                     onClick={() => window.location.href = `/blog/${blog.slug}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm rounded transition-colors duration-300"
                    >
                      READ MORE →
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
