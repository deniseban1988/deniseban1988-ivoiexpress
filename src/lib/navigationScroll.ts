import React, { useEffect } from 'react';

/**
 * Options for navigation scroll behavior
 */
export interface NavigationScrollOptions {
  targetId?: string;
  smooth?: boolean;
  offset?: number;
}

/**
 * Resets the scroll position of the window, document, main content area,
 * and any nested scrollable containers to the top (scrollTop = 0).
 * If a targetId or anchor is provided, safely preserves anchor navigation.
 */
export function resetScrollToTop(options?: NavigationScrollOptions): void {
  if (typeof window === 'undefined') return;

  // If a specific anchor or target ID is requested, preserve anchor navigation
  if (options?.targetId) {
    const cleanId = options.targetId.replace(/^#/, '');
    const targetElement = document.getElementById(cleanId) || document.querySelector(`[name="${cleanId}"]`);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: options.smooth ? 'smooth' : 'auto',
        block: 'start'
      });
      return;
    }
  }

  // Universal scroll reset across browser environments (Mobile, Tablet, Desktop)
  const performReset = () => {
    try {
      // 1. Primary window scroll reset
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: options?.smooth ? 'smooth' : ('instant' as ScrollBehavior)
      });
    } catch {
      window.scrollTo(0, 0);
    }

    // 2. Document element and body reset
    if (document.documentElement && document.documentElement.scrollTop > 0) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body && document.body.scrollTop > 0) {
      document.body.scrollTop = 0;
    }

    // 3. Main content wrappers and identified scroll containers
    const scrollContainers = document.querySelectorAll<HTMLElement>(
      'main, #main-content, [data-scroll-container], .overflow-y-auto, .overflow-y-scroll'
    );

    scrollContainers.forEach((container) => {
      // Avoid resetting small dropdowns or popovers while resetting all major view containers
      if (container && container.scrollTop > 0 && container.clientHeight > 150) {
        container.scrollTop = 0;
      }
    });
  };

  // Immediate reset
  performReset();

  // Secondary execution in next frame / tick to catch asynchronous component renders
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      performReset();
    });
  } else {
    setTimeout(performReset, 10);
  }
}

/**
 * React Hook that automatically scrolls to the top of the section whenever navigation dependencies change.
 */
export function useScrollToTopOnNav(dependencies: React.DependencyList, options?: NavigationScrollOptions): void {
  useEffect(() => {
    resetScrollToTop(options);
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps
}
