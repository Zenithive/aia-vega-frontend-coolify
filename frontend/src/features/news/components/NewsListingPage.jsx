'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadAllNews, loadNewsByCategory, setCategory } from '@/features/news/newsSlice';
import {
  selectNewsList,
  selectNewsLoading,
  selectCurrentPage,
  selectTotalPages,
  selectCurrentCategory,
} from '@/features/news/newsSelectors';
import { fetchNewsCategories } from '@/features/news/newsAPI';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import NewsCard from './NewsCard';
import Loader from '@/components/common/Loader';
import PageHeader from '@/components/common/PageHeader';
import PageSection from '@/components/common/PageSection';
import Select from '@/components/ui/select';

const PAGE_SIZE = 24;

export default function NewsListingPage() {
  const dispatch = useAppDispatch();
  const newsList = useAppSelector(selectNewsList);
  const isLoading = useAppSelector(selectNewsLoading);
  const currentPage = useAppSelector(selectCurrentPage);
  const totalPages = useAppSelector(selectTotalPages);
  const selectedCategory = useAppSelector(selectCurrentCategory);

  const [categories, setCategories] = useState([]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Restore category from URL on mount
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory) {
      dispatch(setCategory(urlCategory));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchNewsCategories()
      .then((list) => setCategories(list || []))
      .catch(() => setCategories([]));
  }, []);

  // Load first page when component mounts or category changes
  useEffect(() => {
    if (selectedCategory === 'All Categories' || !selectedCategory) {
      dispatch(loadAllNews({ page: 1, pageSize: PAGE_SIZE }));
    } else {
      dispatch(loadNewsByCategory({ category: selectedCategory, page: 1, pageSize: PAGE_SIZE }));
    }
  }, [dispatch, selectedCategory]);

  // Handle loading next page
  const handleLoadMore = useCallback(() => {
    const nextPage = currentPage + 1;
    if (selectedCategory === 'All Categories' || !selectedCategory) {
      dispatch(loadAllNews({ page: nextPage, pageSize: PAGE_SIZE }));
    } else {
      dispatch(loadNewsByCategory({ category: selectedCategory, page: nextPage, pageSize: PAGE_SIZE }));
    }
  }, [dispatch, currentPage, selectedCategory]);

  // Set up infinite scroll with custom hook
  const sentinelRef = useInfiniteScroll({
    isLoading,
    currentPage,
    totalPages,
    onLoadMore: handleLoadMore,
  });

  // Handle category change
  const handleCategoryChange = (value) => {
    dispatch(setCategory(value === '' ? 'All Categories' : value));
  };

  // ── Sync category → URL search params (persistence across refresh) ──
  const isFirstCategorySync = useRef(true);
  useEffect(() => {
    if (isFirstCategorySync.current) {
      isFirstCategorySync.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'All Categories') {
      params.set('category', selectedCategory);
    }
    const qs = params.toString();
    const newUrl = `${pathname}${qs ? `?${qs}` : ''}`;
    router.replace(newUrl, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, pathname, router]);

  const categoryOptions = [
    { label: 'All Categories', value: 'All Categories' },
    ...categories.map((c) => ({ label: c.name, value: c.name })),
  ];

  const newsBgStyle = {
    backgroundImage: 'url(/feedback-form-bg.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'right center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div className="min-h-screen bg-background" style={newsBgStyle}>
      <PageHeader
        title="News"
        breadcrumbs={[{ label: 'News' }]}
        showBreadcrumbSeparator
        right={
          <div className="w-50">
            <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              options={categoryOptions}
              placeholder="All Categories"
              variant="filter"
            />
          </div>
        }
      />

      <main>
        <PageSection>
          {isLoading && currentPage === 1 ? (
            <div className="flex items-center justify-center py-20">
              <Loader size="lg" />
            </div>
          ) : newsList.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-body text-gray-medium">No news found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(500px,1fr))] gap-6">
                {newsList.map((news) => (
                  <NewsCard key={String(news.documentId ?? news.id)} news={news} />
                ))}
              </div>

              {/* Sentinel — triggers next page load when scrolled into view */}
              <div ref={sentinelRef} className="py-4 flex justify-center">
                {isLoading && <Loader size="sm" />}
              </div>
            </>
          )}
        </PageSection>
      </main>
    </div>
  );
}
