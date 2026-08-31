const isProduction = process.env.NODE_ENV === 'production';
const databaseId = isProduction 
  ? 'ai-studio-ivoirexpressfabi-76a4a3d0-f988-4d5a-95c0-db2daf7a6b58' 
  : '(default)';

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Selected Database:', databaseId);

if (process.env.NODE_ENV === 'development' && databaseId === '(default)') {
  console.log('✅ DEV OK');
} else if (process.env.NODE_ENV === 'production' && databaseId === 'ai-studio-ivoirexpressfabi-76a4a3d0-f988-4d5a-95c0-db2daf7a6b58') {
  console.log('✅ PROD OK');
} else {
  console.log('❌ MISMATCH');
}
