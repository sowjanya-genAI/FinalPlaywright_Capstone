import { test as base, APIRequestContext } from '@playwright/test';
import { Logger } from '../utils/logger';
// 1. Declare the logger type inclusion inside your custom environment
export const test = base.extend<{ loggedRequest: APIRequestContext; apiLogger: Logger }>({
  
  // Expose the logger instance to your tests
  apiLogger: async ({}, use) => {
    const loggerInstance = new Logger('api-execution.log', true);
    loggerInstance.clear(); // Wipes old logs at the start of a test run
    await use(loggerInstance);
  },

  // Map the logging interceptor over the default Playwright request actions
  loggedRequest: async ({ request, apiLogger }, use) => {
    const requestProxy: APIRequestContext = new Proxy(request, {
      get(target, propKey, receiver) {
        const originalMethod = Reflect.get(target, propKey, receiver);

        if (typeof originalMethod === 'function' && ['get', 'post', 'put','patch', 'delete'].includes(propKey as string)) {
          return async (url: string, options?: any) => {
            
            apiLogger.info(`>>> OUTGOING | METHOD: ${propKey.toUpperCase()} | URL: ${url}`);
            if (options?.data) {
              apiLogger.info(`PAYLOAD: ${JSON.stringify(options.data)}`);
            }
            
            const startTime = Date.now();
            const response = await originalMethod.apply(target, [url, options]);
            const duration = Date.now() - startTime;
            const responseText = await response.text();

            const level = response.ok() ? 'INFO' : 'ERROR';
            apiLogger.info(`<<< INCOMING | STATUS: ${response.status()} | DURATION: ${duration}ms`);
            
            if (!response.ok()) {
              apiLogger.error(`ERROR BODY: ${responseText}`);
            } else {
              apiLogger.info(`BODY: ${responseText}`);
            }
            
            return response;
          };
        }
        return originalMethod;
      }
    });

    await use(requestProxy);
  }
});

export { expect } from '@playwright/test';