'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BlockedUsersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/utilities/chat?tab=blocked');
  }, [router]);

  return null;
}
