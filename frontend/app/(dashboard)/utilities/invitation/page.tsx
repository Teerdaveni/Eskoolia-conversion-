'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InvitationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/utilities/chat?tab=invitation');
  }, [router]);

  return null;
}
