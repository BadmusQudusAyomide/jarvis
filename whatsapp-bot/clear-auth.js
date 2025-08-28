import { rm } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function clearAuth() {
  try {
    const authDir = join(__dirname, 'auth_info_baileys');
    await rm(authDir, { recursive: true, force: true });
    console.log('✅ Successfully cleared WhatsApp authentication state');
  } catch (error) {
    console.error('❌ Error clearing auth state:', error.message);
  }
}

clearAuth();
