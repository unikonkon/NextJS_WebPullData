'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const login = false; // สมมติว่า login = false

  useEffect(() => {
    if (!login) {
      router.push('/home');
    }
  }, [login, router]);

  return <></>;
}
