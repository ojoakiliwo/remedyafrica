import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { uniqueIds } from './booking';

export async function getPractitionerLookupIds(uid: string) {
  const ids = uniqueIds(uid);

  try {
    const own = await getDoc(doc(db, 'practitioners', uid));
    if (own.exists()) ids.push(uid);
  } catch {
    // Directory read can fail if the session is still loading.
  }

  try {
    const linked = await getDocs(query(collection(db, 'practitioners'), where('userId', '==', uid)));
    linked.docs.forEach((item) => ids.push(item.id));
  } catch {
    // Missing index or rules should not hide the login uid query.
  }

  return uniqueIds(...ids);
}
