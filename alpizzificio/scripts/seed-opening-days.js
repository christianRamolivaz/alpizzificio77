const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAnrfps9kaZ7DApGIp70nmz-y-B4M6OVMU",
  authDomain: "alpizzificio77-c69ca.firebaseapp.com",
  projectId: "alpizzificio77-c69ca",
  storageBucket: "alpizzificio77-c69ca.firebasestorage.app",
  messagingSenderId: "1032374523401",
  appId: "1:1032374523401:web:4e4578222e377ccfcc8ad8",
  measurementId: "G-C5X5VGGM7R"
};

const DEFAULT_OPENING_DAYS = [
  { dayOfWeek: 0, dayName: 'Domenica', isOpen: true, isWeekend: true },
  { dayOfWeek: 1, dayName: 'Lunedì', isOpen: false, isWeekend: false },
  { dayOfWeek: 2, dayName: 'Martedì', isOpen: true, isWeekend: false },
  { dayOfWeek: 3, dayName: 'Mercoledì', isOpen: true, isWeekend: false },
  { dayOfWeek: 4, dayName: 'Giovedì', isOpen: true, isWeekend: false },
  { dayOfWeek: 5, dayName: 'Venerdì', isOpen: true, isWeekend: true },
  { dayOfWeek: 6, dayName: 'Sabato', isOpen: true, isWeekend: true },
];

const DAY_DOC_IDS = [
  '0_domenica',
  '1_lunedi',
  '2_martedi',
  '3_mercoledi',
  '4_giovedi',
  '5_venerdi',
  '6_sabato'
];

async function run() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('⏳ Creazione/aggiornamento collezione "opening_days" su Firestore...');

  try {
    for (const day of DEFAULT_OPENING_DAYS) {
      const docId = DAY_DOC_IDS[day.dayOfWeek];
      await setDoc(doc(db, 'opening_days', docId), day, { merge: true });
      console.log(` ✅ Creato record: opening_days/${docId} (isOpen: ${day.isOpen}, isWeekend: ${day.isWeekend})`);
    }
    console.log('\n🎉 Collezione "opening_days" popolata con successo su Firestore!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.error('\n❌ ERRORE: PERMISSION_DENIED');
      console.error('Assicurati di aver aggiunto la regola per "opening_days" su Firebase Console:');
      console.error('match /opening_days/{document=**} { allow read, write: if true; }\n');
    } else {
      console.error('\n❌ Errore durante la scrittura su Firestore:', error);
    }
    process.exit(1);
  }
}

run();
