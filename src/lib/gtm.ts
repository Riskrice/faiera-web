declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

type GtmEventParams = Record<string, unknown>;

const PENDING_CHECKOUT_KEY = 'faiera_pending_checkout';

export interface PendingCheckoutEvent {
  checkout_type: string;
  currency: string;
  value: number;
  items: Array<Record<string, unknown>>;
}

export function trackEvent(event: string, params: GtmEventParams = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

export function rememberPendingCheckout(payload: PendingCheckoutEvent) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(payload));
}

export function consumePendingCheckout(): PendingCheckoutEvent | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawPayload = window.sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  if (!rawPayload) {
    return null;
  }

  window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);

  try {
    return JSON.parse(rawPayload) as PendingCheckoutEvent;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
}