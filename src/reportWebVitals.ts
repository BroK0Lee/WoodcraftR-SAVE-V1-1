type WebVitalsCallback = (metric: unknown) => void;

const reportWebVitals = (onPerfEntry?: WebVitalsCallback) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import("web-vitals").then((mod) => {
      const metrics = mod as unknown as {
        getCLS: (cb: WebVitalsCallback) => void;
        getFID: (cb: WebVitalsCallback) => void;
        getFCP: (cb: WebVitalsCallback) => void;
        getLCP: (cb: WebVitalsCallback) => void;
        getTTFB: (cb: WebVitalsCallback) => void;
      };
      metrics.getCLS(onPerfEntry);
      metrics.getFID(onPerfEntry);
      metrics.getFCP(onPerfEntry);
      metrics.getLCP(onPerfEntry);
      metrics.getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
