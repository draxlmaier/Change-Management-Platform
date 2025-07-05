import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPage } from './ga4';

export function RouterTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPage(location.pathname + location.search);
  }, [location]);
  return null;
}
