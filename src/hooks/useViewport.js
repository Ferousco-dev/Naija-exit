import { useEffect, useState } from "react";

const getWindowWidth = () => {
  if (typeof window === "undefined") return 1280;
  return window.innerWidth;
};

export const useViewport = () => {
  const [width, setWidth] = useState(getWindowWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    width,
    isMobile: width < 920,
    isTablet: width >= 920 && width < 1280,
    isDesktop: width >= 1280,
  };
};
