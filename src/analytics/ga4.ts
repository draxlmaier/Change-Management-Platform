import ReactGA from 'react-ga4';

const measurementId = process.env.REACT_APP_GA4_MEASUREMENT_ID!;
if (!measurementId) {
  throw new Error('Missing GA4 Measurement ID in env');
}

export function initGA() {
  ReactGA.initialize(measurementId, {
    // optionally disable automatic pageview on load
    gaOptions: { send_page_view: false }
  });
}

// send a manual page_view event
export function trackPage(path: string) {
  ReactGA.send({ hitType: 'pageview', page: path });
}

// helper for custom events
export function trackEvent(name: string, params?: Record<string, any>) {
  ReactGA.event({ category: 'Engagement', action: name, ...params });
}
