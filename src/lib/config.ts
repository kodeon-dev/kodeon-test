export function getConfig() {
  'use client';

  return {
    webWorkers: {
      supported: !!window.Worker,
    },
    // serviceWorkers:
    //   'serviceWorker' in window.navigator
    //     ? {
    //         supported: 'serviceWorker' in window.navigator,
    //         enabled: !!navigator.serviceWorker?.controller,
    //       }
    //     : {
    //         supported: false,
    //         enabled: false,
    //       },
  };
}
