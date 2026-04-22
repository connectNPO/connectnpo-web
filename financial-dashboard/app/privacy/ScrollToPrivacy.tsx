'use client';

import { useEffect } from 'react';

export function ScrollToPrivacy() {
  useEffect(() => {
    const el = document.getElementById('privacy');
    if (el) el.scrollIntoView({ block: 'start' });
  }, []);
  return null;
}
