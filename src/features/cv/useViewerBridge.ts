import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { RefObject } from 'react';
import { asset } from '@/site.config';

/* =============================================================================
   The bridge to the PDF viewer.

   The viewer itself is the self-contained PDF.js build in public/cv-viewer/, loaded in an
   iframe and spoken to over postMessage. Keeping it a separate document is deliberate: it
   owns its own rendering, its own keyboard handling and its own worker, and the host only
   has to drive it and reflect its state.
   ========================================================================== */

const HELLO_TIMEOUT = 15_000;
const IDLE_TIMEOUT = 45_000;

export type ViewerStatus = 'loading' | 'ready' | 'error' | 'unsupported';

export interface ViewerState {
  status: ViewerStatus;
  page: number;
  total: number;
  percent: number | null;
  mode: 'auto' | 'fit' | string;
  canZoomIn: boolean;
  canZoomOut: boolean;
  /** 0..1, driving the hairline under the toolbar. */
  progress: number;
  printing: boolean;
}

export type ViewerCommand =
  | 'zoomIn'
  | 'zoomOut'
  | 'fitWidth'
  | 'auto'
  | 'prev'
  | 'next'
  | 'print';

const INITIAL: ViewerState = {
  status: 'loading',
  page: 1,
  total: 0,
  percent: null,
  mode: 'auto',
  canZoomIn: true,
  canZoomOut: true,
  progress: 0,
  printing: false,
};

type Action =
  | { type: 'reset' }
  | { type: 'progress'; value: number }
  | { type: 'state'; value: Partial<ViewerState> }
  | { type: 'printing'; value: boolean }
  | { type: 'fail'; status: Extract<ViewerStatus, 'error' | 'unsupported'> };

function reducer(state: ViewerState, action: Action): ViewerState {
  switch (action.type) {
    case 'reset':
      return { ...INITIAL, progress: 0.08 };
    case 'progress':
      return { ...state, progress: Math.max(state.progress, action.value) };
    case 'state': {
      const next = { ...state, ...action.value };
      if (action.value.status === 'ready') next.progress = 1;
      return next;
    }
    case 'printing':
      return { ...state, printing: action.value };
    case 'fail':
      return { ...state, status: action.status, progress: 1 };
    default:
      return state;
  }
}

export interface ViewerLabels {
  region: string;
  page: string;
  link: string;
}

export interface UseViewerBridge {
  state: ViewerState;
  /** Bump this to force the iframe to reload on a retry. */
  attempt: number;
  send: (command: ViewerCommand) => void;
  retry: () => void;
  src: string;
}

export function useViewerBridge(options: {
  frameRef: RefObject<HTMLIFrameElement>;
  pdf: string;
  theme: 'light' | 'dark';
  dir: 'ltr' | 'rtl';
  labels: ViewerLabels;
}): UseViewerBridge {
  const { frameRef, pdf, theme, dir, labels } = options;
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const attemptRef = useRef(0);
  const [, forceAttempt] = useReducer((n: number) => n + 1, 0);
  const helloTimer = useRef(0);
  const idleTimer = useRef(0);
  const gotHello = useRef(false);
  // The labels change with the language; the message handler must not be rebuilt for that.
  const config = useRef({ theme, dir, labels });
  config.current = { theme, dir, labels };

  const post = useCallback(
    (cmd: string, extra?: Record<string, unknown>) => {
      frameRef.current?.contentWindow?.postMessage(
        { source: 'cv-host', cmd, ...extra },
        window.location.origin,
      );
    },
    [frameRef],
  );

  const sendConfig = useCallback(() => {
    const { theme: th, dir: d, labels: l } = config.current;
    post('theme', { value: th });
    post('dir', { value: d });
    post('labels', { value: { region: l.region, page: l.page, link: l.link } });
  }, [post]);

  const armIdle = useCallback(() => {
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      dispatch({ type: 'fail', status: 'error' });
    }, IDLE_TIMEOUT);
  }, []);

  const retry = useCallback(() => {
    attemptRef.current += 1;
    gotHello.current = false;
    dispatch({ type: 'reset' });
    forceAttempt();
  }, []);

  // Listen once; the handler reads the latest config out of the ref.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = event.data as { source?: string; type?: string; [key: string]: unknown };
      if (!message || message.source !== 'cv-viewer') return;
      armIdle();

      switch (message.type) {
        case 'hello':
          gotHello.current = true;
          window.clearTimeout(helloTimer.current);
          sendConfig();
          dispatch({ type: 'progress', value: 0.2 });
          break;
        case 'progress': {
          const total = Number(message.total ?? 0);
          const loaded = Number(message.loaded ?? 0);
          if (total > 0) {
            dispatch({ type: 'progress', value: 0.2 + 0.7 * Math.min(1, loaded / total) });
          }
          break;
        }
        case 'state': {
          const { type: _type, source: _source, ...rest } = message;
          if (rest.status === 'ready') window.clearTimeout(idleTimer.current);
          dispatch({ type: 'state', value: rest as Partial<ViewerState> });
          break;
        }
        case 'printing':
          dispatch({ type: 'printing', value: Boolean(message.value) });
          break;
        case 'error':
          if (message.fatal === false) break;
          dispatch({ type: 'fail', status: 'error' });
          break;
        case 'unsupported':
          dispatch({ type: 'fail', status: 'unsupported' });
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [frameRef, sendConfig, armIdle]);

  // A viewer that never says hello is a viewer that failed to boot.
  useEffect(() => {
    gotHello.current = false;
    window.clearTimeout(helloTimer.current);
    helloTimer.current = window.setTimeout(() => {
      if (!gotHello.current) dispatch({ type: 'fail', status: 'error' });
    }, HELLO_TIMEOUT);
    armIdle();
    return () => {
      window.clearTimeout(helloTimer.current);
      window.clearTimeout(idleTimer.current);
    };
  }, [armIdle]);

  // Theme and direction follow the host's own toggles while the viewer is live.
  useEffect(() => {
    if (gotHello.current) sendConfig();
  }, [theme, dir, labels, sendConfig]);

  const send = useCallback((command: ViewerCommand) => post(command), [post]);

  const params = new URLSearchParams({ src: pdf, theme, dir });
  if (attemptRef.current > 0) params.set('attempt', String(attemptRef.current));

  return {
    state,
    attempt: attemptRef.current,
    send,
    retry,
    src: `${asset('cv-viewer/index.html')}?${params.toString()}`,
  };
}
