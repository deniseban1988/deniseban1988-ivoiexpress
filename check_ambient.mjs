import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

try {
  const app = initializeApp();
  console.log('Ambient Project ID:', app.options.projectId);
} catch (err) {
  console.error('Error:', err.message);
}
