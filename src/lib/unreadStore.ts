"use client";

import { useSyncExternalStore } from 'react';

let unread = 0;
const listeners = new Set<() => void>();

/** Contador de notificaciones no leídas compartido entre la campana y /notificaciones. */
export function setUnread(value: number): void {
  if (value === unread) return;
  unread = value;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUnread(): number {
  return useSyncExternalStore(subscribe, () => unread, () => 0);
}
