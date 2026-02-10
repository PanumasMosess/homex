"use client";

import { useEffect, useState, useCallback } from 'react';
import { signOut } from 'next-auth/react';

export function useIdleTimeout(timeout: number) {
  const [idle, setIdle] = useState(false);

  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: '/' });
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(handleSignOut, timeout);
    };

    // ตั้งค่า event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // เริ่ม timer ครั้งแรก
    resetTimer();

    // Cleanup function: จะทำงานเมื่อ component unmount
    return () => {
      clearTimeout(timer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [timeout, handleSignOut]);

  return idle;
}