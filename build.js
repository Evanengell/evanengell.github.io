import * as esbuild from 'esbuild';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Clean dist and assets directories
const cleanDirs = () => {
  console.log('🧹 Cleaning dist and assets directories...');

  // Clean dist
  try {
    const distFiles = readdirSync(join(__dirname, 'dist'));
    distFiles.forEach(file => {
      if (file !== '.gitkeep') {
        unlinkSync(join(__dirname, 'dist', file));
      }
    });
  } catch (e) {
    mkdirSync(join(__dirname, 'dist'), { recursive: true });
  }

  // Clean dist/assets
  try {
    const distAssetsFiles = readdirSync(join(__dirname, 'dist/assets'));
    distAssetsFiles.forEach(file => {
      unlinkSync(join(__dirname, 'dist/assets', file));
    });
  } catch (e) {
    mkdirSync(join(__dirname, 'dist/assets'), { recursive: true });
  }

  // Clean root assets (only .js and .css)
  try {
    const assetsFiles = readdirSync(join(__dirname, 'assets'));
    assetsFiles.forEach(file => {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        unlinkSync(join(__dirname, 'assets', file));
      }
    });
  } catch (e) {
    mkdirSync(join(__dirname, 'assets'), { recursive: true });
  }

  console.log('✅ Cleaned successfully');
};

// Generate hash for content-based filenames
const generateHash = (content) => {
  return createHash('md5').update(content).digest('hex').substring(0, 8);
};

// Build the application
const build = async () => {
  console.log('🚀 Building with esbuild...');

  // Clean before build
  cleanDirs();

  try {
    // Build JavaScript bundle
    const result = await esbuild.build({
      entryPoints: ['src/main.jsx'],
      bundle: true,
      minify: true,
      sourcemap: false,
      format: 'esm',
      target: ['es2020'],
      loader: {
        '.jsx': 'jsx',
        '.js': 'jsx'
      },
      outdir: 'dist/assets',
      entryNames: '[name]-temp',
      splitting: false,
      write: false, // We'll write manually with hash
      jsx: 'automatic',
      jsxImportSource: 'react',
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });

    // Write JS file with content hash
    const jsOutput = result.outputFiles.find(f => f.path.endsWith('.js'));
    const jsHash = generateHash(jsOutput.contents);
    const jsFileName = `index-${jsHash}.js`;
    writeFileSync(join(__dirname, 'dist/assets', jsFileName), jsOutput.contents);
    console.log(`✅ JavaScript: ${jsFileName} (${(jsOutput.contents.length / 1024).toFixed(2)} KB)`);

    // Build CSS
    const cssResult = await esbuild.build({
      entryPoints: ['src/index.css'],
      bundle: true,
      minify: true,
      loader: {
        '.css': 'css'
      },
      outdir: 'dist/assets',
      entryNames: '[name]-temp',
      write: false
    });

    // Write CSS file with content hash
    const cssOutput = cssResult.outputFiles.find(f => f.path.endsWith('.css'));
    const cssHash = generateHash(cssOutput.contents);
    const cssFileName = `index-${cssHash}.css`;
    writeFileSync(join(__dirname, 'dist/assets', cssFileName), cssOutput.contents);
    console.log(`✅ CSS: ${cssFileName} (${(cssOutput.contents.length / 1024).toFixed(2)} KB)`);

    // Read template index.html
    const indexTemplate = readFileSync(join(__dirname, 'index.template.html'), 'utf-8');

    // Replace placeholders with hashed filenames
    const indexHtml = indexTemplate
      .replace('{{JS_FILE}}', `./assets/${jsFileName}`)
      .replace('{{CSS_FILE}}', `./assets/${cssFileName}`);

    // Write to dist/index.html
    writeFileSync(join(__dirname, 'dist/index.html'), indexHtml);
    console.log('✅ index.html created');

    // Copy dist/index.html to root
    copyFileSync(join(__dirname, 'dist/index.html'), join(__dirname, 'index.html'));
    console.log('✅ index.html copied to root');

    // Copy assets to root/assets
    copyFileSync(
      join(__dirname, 'dist/assets', jsFileName),
      join(__dirname, 'assets', jsFileName)
    );
    copyFileSync(
      join(__dirname, 'dist/assets', cssFileName),
      join(__dirname, 'assets', cssFileName)
    );
    console.log('✅ Assets copied to root/assets');

    console.log('\n🎉 Build completed successfully!');
    console.log(`📦 Bundle size: ${((jsOutput.contents.length + cssOutput.contents.length) / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
};

// Run build
build();
