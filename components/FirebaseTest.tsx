'use client';

import { useEffect, useState } from 'react';

export default function FirebaseTest() {
  const [status, setStatus] = useState<string>('Testing Firebase connection...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testFirebase = async () => {
      try {
        // Test 1: Check Firebase config
        console.log('=== Firebase Test ===');
        console.log('Firebase Config:', process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
        console.log('Project ID:', process.env.NEXT_PUBLIC_GCP_PROJECT_ID);
        console.log('Emulator Mode:', process.env.NEXT_PUBLIC_EMULATOR);
        
        // Test 2: Import and initialize
        const { db } = await import('@/lib/firebase');
        console.log('Firestore instance:', db);
        
        // Test 3: Check Auth
        const { auth } = await import('@/lib/firebase');
        console.log('Auth instance:', auth);
        console.log('Current user:', auth.currentUser);
        
        // Test 4: Try anonymous auth first
        const { signInAnonymously } = await import('firebase/auth');
        try {
          console.log('Attempting anonymous sign in...');
          const userCred = await signInAnonymously(auth);
          console.log('Anonymous sign in successful:', userCred.user.uid);
        } catch (authError: any) {
          console.warn('Anonymous auth failed:', authError.message);
        }
        
        // Test 5: Simple write operation
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        
        const testDocRef = doc(db, 'test_connection', 'test_doc');
        console.log('Attempting to write test document...');
        
        await setDoc(testDocRef, {
          message: 'Firebase connection test',
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent,
          authUser: auth.currentUser?.uid || 'none'
        });
        
        console.log('Test document written successfully!');
        setStatus('✅ Firebase connection successful!');
        
        // Clean up test document
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(testDocRef);
        console.log('Test document cleaned up');
        
        // Sign out if we signed in anonymously
        if (auth.currentUser?.isAnonymous) {
          await auth.signOut();
          console.log('Signed out anonymous user');
        }
        
      } catch (err: any) {
        console.error('Firebase test failed:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        console.error('Full error:', err);
        
        setError(`Error: ${err.code || 'Unknown'} - ${err.message || 'Connection failed'}`);
        setStatus('❌ Firebase connection failed');
      }
    };

    testFirebase();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg border max-w-sm">
      <h3 className="font-bold mb-2">Firebase Connection Test</h3>
      <p className={error ? 'text-red-600' : 'text-green-600'}>{status}</p>
      {error && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-gray-600">Error details</summary>
          <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">{error}</pre>
        </details>
      )}
    </div>
  );
}