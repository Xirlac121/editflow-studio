import { getStoredCloudCredentials } from './supabase';
import { Project, StudioSettings } from '../types/studio';

export interface PortalCloudToken {
  u: string; // Supabase URL
  k: string; // Supabase public anon key
}

export interface PortalSnapshotFallback {
  project: Project;
  studioName: string;
  editorName: string;
  currency: string;
  clientName?: string;
}

function encodeBase64Url(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBase64Url<T>(encoded: string): T | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function buildClientPortalUrl(
  project: Project,
  settings: StudioSettings,
  clientName?: string
): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams();
  params.set('portal', project.id);

  const creds = getStoredCloudCredentials();
  if (creds.url && creds.anonKey) {
    const token: PortalCloudToken = { u: creds.url, k: creds.anonKey };
    params.set('c', encodeBase64Url(token));
  } else {
    const fallback: PortalSnapshotFallback = {
      project,
      studioName: settings.studioName,
      editorName: settings.editorName,
      currency: settings.currency,
      clientName,
    };
    params.set('d', encodeBase64Url(fallback));
  }

  return `${base}?${params.toString()}`;
}
