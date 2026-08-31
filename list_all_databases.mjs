import { GoogleAuth } from 'google-auth-library';

async function listDatabases() {
  const projectId = 'studio-2569273626-e2093';
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform'
  });
  const client = await auth.getClient();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;
  
  try {
    const res = await client.request({ url });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Erreur:', err.message);
  }
}

listDatabases();
