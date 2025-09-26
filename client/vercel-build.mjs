import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

const runCommand = (command, errorMessage, options = {}) => {
  try {
    log(`Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit',
      ...options
    });
    return true;
  } catch (error) {
    console.error(`❌ ${errorMessage}:`, error.message);
    return false;
  }
};

async function main() {
  log('🚀 Starting Vercel build process...');
  
  // Install production dependencies only
  log('📦 Installing dependencies...');
  if (!runCommand('npm ci --prefer-offline --no-audit --legacy-peer-deps', 'Error installing dependencies')) {
    process.exit(1);
  }

  // Install required polyfills
  log('📦 Installing polyfills...');
  const polyfills = [
    'buffer',
    'process',
    'stream-browserify',
    'path-browserify',
    'util',
    'crypto-browserify',
    'stream-http',
    'https-browserify',
    'os-browserify',
    'assert'
  ];
  
  if (!runCommand(`npm install --no-save ${polyfills.join(' ')}`, 'Error installing polyfills')) {
    process.exit(1);
  }

  // Run the build
  log('🔨 Building application...');
  if (!runCommand('vite build --mode production', 'Error during build')) {
    process.exit(1);
  }

  // Create _redirects file for client-side routing
  log('📝 Creating _redirects file...');
  try {
    const distPath = join(process.cwd(), 'dist');
    
    // Ensure dist directory exists
    if (!existsSync(distPath)) {
      log('ℹ️ Creating dist directory...');
      mkdirSync(distPath, { recursive: true });
    }
    
    const redirectsPath = join(distPath, '_redirects');
    const redirectsContent = '/* /index.html 200';
    
    writeFileSync(redirectsPath, redirectsContent);
    log('✅ _redirects file created successfully');
  } catch (error) {
    console.error('❌ Error creating _redirects file:', error);
    process.exit(1);
  }

  log('🎉 Vercel build process completed successfully!');
}

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error in build process:', error);
  process.exit(1);
});
