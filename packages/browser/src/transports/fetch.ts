import { SentryEvent, SentryResponse, Status } from '@sentry/types';
import { getGlobalObject } from '@sentry/utils/misc';
import { serialize } from '@sentry/utils/object';
import { supportsReferrerPolicy } from '@sentry/utils/supports';
import { BaseTransport } from './base';

const global: any = getGlobalObject();

/** `fetch` based transport */
export class FetchTransport extends BaseTransport {
  /**
   * @inheritDoc
   */
  public async send(event: SentryEvent): Promise<SentryResponse> {
    const defaultOptions: RequestInit = {
      body: serialize(event),
      keepalive: true,
      method: 'POST',
      // Despite all stars in the sky saying that Edge supports old draft syntax, aka 'never', 'always', 'origin' and 'default
      // https://caniuse.com/#feat=referrer-policy
      // It doesn't. And it throw exception instead of ignoring this parameter...
      // REF: https://github.com/getsentry/raven-js/issues/1233
      referrerPolicy: (supportsReferrerPolicy()
        ? 'origin'
        : '') as ReferrerPolicy,
    };

    const response = await (global as Window).fetch(this.url, defaultOptions);

    return {
      code: response.status,
      event_id: event.event_id,
      status: Status.fromHttpCode(response.status),
    };
  }
}
