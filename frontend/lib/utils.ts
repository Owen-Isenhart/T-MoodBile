import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useRequireName() {
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    // This logic only runs on client
    const stored = typeof window !== 'undefined' ? localStorage.getItem('tmoodbile_user_name') : null;
    if (!stored) {
      router.replace('/landing');
    } else {
      setUserName(stored);
    }
  }, [router]);
  return userName;
}
