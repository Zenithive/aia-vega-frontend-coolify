import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for infinite scroll functionality.
 * Handles IntersectionObserver setup and automatic page loading.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.isLoading - Whether data is currently loading
 * @param {number} options.currentPage - Current page number
 * @param {number} options.totalPages - Total number of pages
 * @param {Function} options.onLoadMore - Callback function when more data should be loaded
 * @param {string} [options.rootMargin='200px 0px'] - IntersectionObserver root margin
 * @param {number} [options.threshold=0.01] - IntersectionObserver threshold
 * @param {boolean} [options.enabled=true] - Whether the observer is enabled
 * @param {boolean} [options.requireUserScroll=false] - Ignore the first intersection until the user scrolls
 * @param {number} [options.minScrollDistance=0] - Wheel or swipe distance that counts as a hard scroll
 * @param {string|number} [options.resetKey=''] - Resets the scroll gate when this value changes
 * 
 * @returns {Object} - Returns sentinel ref to attach to a DOM element
 * 
 * @example
 * const sentinelRef = useInfiniteScroll({
 *   isLoading,
 *   currentPage,
 *   totalPages,
 *   onLoadMore: () => dispatch(loadMoreAction()),
 *   enabled: isAutoMode
 * });
 * 
 * return <div ref={sentinelRef} className="sentinel" />
 */
export const useInfiniteScroll = ({
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onLoadMore = () => {},
  rootMargin = '200px 0px',
  threshold = 0.01,
  enabled = true,
  requireUserScroll = false,
  minScrollDistance = 0,
  resetKey = '',
} = {}) => {
  const sentinelRef = useRef(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const allowLoadRef = useRef(!requireUserScroll);
  const lockRef = useRef(false);
  const minScrollDistanceRef = useRef(minScrollDistance);
  const gestureDistanceRef = useRef(0);
  const gestureTimerRef = useRef(null);
  const gestureArmedRef = useRef(true);
  const touchStartYRef = useRef(null);
  const lastScrollYRef = useRef(0);
  minScrollDistanceRef.current = minScrollDistance;

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!isLoading) lockRef.current = false;
  }, [isLoading]);

  useEffect(() => {
    allowLoadRef.current = !requireUserScroll;
    lockRef.current = false;
  }, [requireUserScroll, resetKey]);

  useEffect(() => {
    if (!requireUserScroll) return;
    allowLoadRef.current = false;
    lockRef.current = false;
    gestureDistanceRef.current = 0;
    gestureArmedRef.current = true;
    lastScrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0;
  }, [requireUserScroll, resetKey, currentPage]);

  const sentinelInView = () => {
    const node = sentinelRef.current;
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  const requestNextPage = useCallback(() => {
    if (!enabled || isLoading || lockRef.current || currentPage >= totalPages) return;
    if (requireUserScroll && !allowLoadRef.current) return;
    if (requireUserScroll) allowLoadRef.current = false;
    lockRef.current = true;
    onLoadMoreRef.current();
  }, [enabled, isLoading, currentPage, totalPages, requireUserScroll]);

  useEffect(() => {
    if (!requireUserScroll) return undefined;

    const commitHardScroll = () => {
      if (!gestureArmedRef.current || !sentinelInView()) return;
      gestureDistanceRef.current = 0;
      const wasLocked = lockRef.current;
      allowLoadRef.current = true;
      requestNextPage();
      if (lockRef.current && !wasLocked) {
        gestureArmedRef.current = false;
        return;
      }
      allowLoadRef.current = false;
    };

    const noteDownwardGesture = (delta) => {
      if (!gestureArmedRef.current || delta <= 0) return;
      const requiredDistance = minScrollDistanceRef.current;
      gestureDistanceRef.current += delta;
      if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
      gestureTimerRef.current = setTimeout(() => {
        gestureDistanceRef.current = 0;
        gestureArmedRef.current = true;
      }, 280);

      if (requiredDistance > 0 && gestureDistanceRef.current < requiredDistance) return;
      if (requiredDistance <= 0 && gestureDistanceRef.current < 8) return;
      commitHardScroll();
    };

    const wheelPixels = (event) => {
      if (event.deltaMode === 1) return event.deltaY * 16;
      if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
      return event.deltaY;
    };

    const onWheel = (event) => {
      if (!event.isTrusted) return;
      noteDownwardGesture(wheelPixels(event));
    };

    const onScroll = (event) => {
      if (!event.isTrusted) return;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const delta = y - lastScrollYRef.current;
      lastScrollYRef.current = y;
      noteDownwardGesture(delta);
    };

    const onTouchStart = (event) => {
      touchStartYRef.current = event.touches?.[0]?.clientY ?? null;
    };

    const onTouchMove = (event) => {
      if (!event.isTrusted || touchStartYRef.current == null) return;
      const currentY = event.touches?.[0]?.clientY;
      if (currentY == null) return;
      const delta = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;
      noteDownwardGesture(delta);
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    };
  }, [requireUserScroll, requestNextPage]);

  useEffect(() => {
    // Don't observe if disabled, loading, at last page, or no callback
    if (!enabled || isLoading || currentPage >= totalPages) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Check if sentinel is intersecting
        if (!entries[0]?.isIntersecting) return;
        requestNextPage();
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [enabled, isLoading, currentPage, totalPages, rootMargin, threshold, requestNextPage, resetKey]);

  return sentinelRef;
};

export default useInfiniteScroll;
