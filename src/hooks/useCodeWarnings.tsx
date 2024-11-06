import type { ReactNode } from 'react';
import type { getConfig } from '@/lib/config';

export function useCodeWarnings(config: ReturnType<typeof getConfig>) {
  const warnings: ReactNode[] = [];

  if (config.webWorkers.supported === false) {
    warnings.push(
      <code key="web-workers-not-supported" className="text-red-700">
        Web workers are not supported - your code will not execute.
      </code>,
    );
  }

  if (config.serviceWorkers.supported === false) {
    warnings.push(
      <code key="service-workers-not-supported" className="text-yellow-500">
        Service workers are not supported - you will not be able to enter input into your code.
      </code>,
    );
  } else if (config.serviceWorkers.enabled === false) {
    warnings.push(
      <code key="service-workers-not-enabled" className="text-yellow-500">
        Service workers are not enabled{' - '}
        <a className="underline decoration-dashed" href="#" onClick={() => window.location.reload()}>
          refresh your page
        </a>{' '}
        to restart them.
      </code>,
    );
  }

  return warnings;
}
