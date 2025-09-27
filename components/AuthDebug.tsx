'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AuthDebug() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          isAnonymous: user.isAnonymous,
          email: user.email,
          providerId: user.providerId,
          providerData: user.providerData,
        });
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  if (!user) return <div className="p-2 bg-red-100 text-red-800">Not authenticated</div>;

  return (
    <div className="p-2 bg-green-100 text-green-800 text-xs">
      <div>UID: {user.uid}</div>
      <div>Anonymous: {user.isAnonymous ? 'Yes' : 'No'}</div>
      <div>Provider: {user.providerId}</div>
    </div>
  );
}