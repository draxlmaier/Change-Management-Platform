import { getCLS, getFID, getLCP } from 'web-vitals';
import { trackEvent } from './ga4';

function sendToGA(metric: { name: string; delta: number; id: string }) {
  const { name, delta, id } = metric;
  trackEvent('Web Vitals', {
    event_label: id,
    value: Math.round(name === 'CLS' ? delta * 1000 : delta), 
    non_interaction: true,
    metric_name: name,
  });
}

export function reportWebVitals() {
  getCLS(sendToGA);
  getFID(sendToGA);
  getLCP(sendToGA);
}
