/* scripts/seed.ts
   Firestore にテストデータを一括投入するユーティリティ */
   import { initializeApp } from 'firebase/app';
   import {
     getFirestore,
     collection,
     doc,
     setDoc,
   } from 'firebase/firestore';
   import { firebaseConfig } from '@/lib/firebase'; // ← lib/firebase.ts で export している config を再利用
   
   // 1. 初期化
   const app = initializeApp(firebaseConfig);
   const db  = getFirestore(app);
   
   // 2. パラメータ
   const uid      = 'demoUser';
   const dateKey  = '20250426';               // ← 今日の日付を8桁で
   const baseCol  = collection(db, 'users', uid, 'todos', dateKey, 'items');
   
   // 3. データ投入
   await Promise.all([
     setDoc(doc(baseCol, 'taskA'), {
       id:'taskA',  title:'参考書A', unitType:'pages',    planCount:10, done:0,
     }),
     setDoc(doc(baseCol, 'taskB'), {
       id:'taskB',  title:'参考書B', unitType:'problems', planCount:20, done:0,
     }),
     setDoc(doc(baseCol, 'taskC'), {
       id:'taskC',  title:'参考書C', unitType:'pages',    planCount:5,  done:0,
     })
   ]);
   
   console.log('✅ Firestore seeding complete');
   process.exit();
   