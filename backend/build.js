#!/usr/bin/env node

/**
 * Build script for Crawdwall Backend
 * Prepares the application for production deployment
 */

import fs from 'fs';
import path from 'path';

console.log('🚀 Building Crawdwall Backend for Production...\n');

// Check required files
const requiredFiles = [
    'package.json',
    'src/server.js',
    'src/app.js',
    'run-migrations.js',
    'create-tables.sql'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING!`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ Build failed: Missing required files');
    process.exit(1);
}

// Check environment template
console.log('\n🔧 Checking environment configuration...');
if (fs.existsSync('.env.example')) {
    console.log('✅ .env.example exists');
} else {
    console.log('⚠️  .env.example not found');
}

if (fs.existsSync('.env.production')) {
    console.log('✅ .env.production template exists');
} else {
    console.log('⚠️  .env.production template not found');
}

// Check deployment files
console.log('\n📦 Checking deployment files...');
const deploymentFiles = [
    'render.yaml',
    'Dockerfile',
    '.dockerignore'
];

deploymentFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`⚠️  ${file} - Optional but recommended`);
    }
});

// Create uploads directory structure
console.log('\n📁 Setting up upload directories...');
const uploadDirs = [
    'uploads',
    'uploads/budgets',
    'uploads/reports'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created ${dir}/`);
    } else {
        console.log(`✅ ${dir}/ exists`);
    }
});

// Create .gitkeep files
const gitkeepFiles = [
    'uploads/.gitkeep',
    'uploads/budgets/.gitkeep',
    'uploads/reports/.gitkeep'
];

gitkeepFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '# Keep this directory in git\n');
        console.log(`✅ Created ${file}`);
    }
});

// Validate package.json
console.log('\n📋 Validating package.json...');
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    if (pkg.scripts && pkg.scripts.start) {
        console.log('✅ Start script defined');
    } else {
        console.log('❌ No start script in package.json');
        allFilesExist = false;
    }

    if (pkg.type === 'module') {
        console.log('✅ ES modules configured');
    } else {
        console.log('⚠️  Not using ES modules');
    }

    const requiredDeps = ['express', 'pg', 'bcrypt', 'jsonwebtoken', 'dotenv'];
    const missingDeps = requiredDeps.filter(dep => !pkg.dependencies[dep]);

    if (missingDeps.length === 0) {
        console.log('✅ All required dependencies present');
    } else {
        console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
        allFilesExist = false;
    }

} catch (error) {
    console.log('❌ Invalid package.json');
    allFilesExist = false;
}

// Final status
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
    console.log('🎉 Build successful! Ready for deployment.');
    console.log('\n📋 Next steps:');
    console.log('1. Commit and push all changes to GitHub');
    console.log('2. Go to Render dashboard');
    console.log('3. Create new Blueprint or Web Service');
    console.log('4. Connect your GitHub repository');
    console.log('5. Deploy!');
    console.log('\n📖 See RENDER_DEPLOYMENT_GUIDE.md for detailed instructions');
} else {
    console.log('❌ Build failed! Please fix the issues above.');
    process.exit(1);
}

console.log('='.repeat(50));