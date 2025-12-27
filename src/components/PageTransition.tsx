import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsVisible(false);
    
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timeout);
  }, [location.pathname, children]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={`page-transition ${isVisible ? 'page-visible' : 'page-hidden'}`}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;
