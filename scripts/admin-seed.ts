import * as admin from 'firebase-admin';

function initAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } catch (e) {
      console.error('Failed to initialize firebase-admin. Ensure GOOGLE_APPLICATION_CREDENTIALS is set.');
      throw e;
    }
  }
}

async function main() {
  const uid = process.env.SEED_UID;
  if (!uid) {
    console.error('SEED_UID is required. Example: SEED_UID=test-user ts-node scripts/admin-seed.ts');
    process.exit(1);
  }

  initAdmin();
  const db = admin.firestore();

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateKey = `${yyyy}${mm}${dd}`;

  const mat = {
    title: 'Seed Material',
    subject: 'math',
    unitType: 'pages',
    totalCount: 50,
    dailyPlan: 2,
    completed: 0,
    startDate: `${yyyy}-${mm}-${dd}`,
    deadline: `${yyyy}-${mm}-${String(now.getDate() + 14).padStart(2, '0')}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const matRef = await db.collection('users').doc(uid).collection('materials').add(mat);
  await db
    .collection('users').doc(uid)
    .collection('todos').doc(dateKey)
    .collection('items').doc(matRef.id)
    .set({ title: mat.title, unitType: mat.unitType, planCount: mat.dailyPlan, done: 0 }, { merge: true });

  console.log('Seed completed', { uid, materialId: matRef.id, dateKey });
}

main().catch(err => { console.error(err); process.exit(1); });

