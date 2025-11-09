import * as esbuild from 'esbuild';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spreadsData, categoriesPhilosophy } from './spreads-data.js';

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

// Generate spread pages
const generateSpreadPages = () => {
  console.log('📄 Generating spread pages...');

  // Create rozklady directory if it doesn't exist
  const rozkladyDir = join(__dirname, 'rozklady');
  if (!existsSync(rozkladyDir)) {
    mkdirSync(rozkladyDir, { recursive: true });
  }

  // Read spread template
  const spreadTemplate = readFileSync(join(__dirname, 'spread-template.html'), 'utf-8');

  // Category name mapping
  const categoryNames = {
    classic: 'Класичні',
    quick: 'Швидкі',
    love: 'Любов',
    career: 'Кар\'єра',
    spiritual: 'Духовність',
    forecast: 'Прогнози',
    special: 'Спеціальні'
  };

  let generatedCount = 0;

  // Generate a page for each spread
  Object.keys(spreadsData).forEach(spreadId => {
    const spread = spreadsData[spreadId];

    // Generate positions HTML
    const positionsHtml = spread.positions
      .map((pos, idx) => `<div class="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg">
              <span class="font-semibold text-purple-700">${idx + 1}.</span> ${pos}
            </div>`)
      .join('\n            ');

    // Generate keywords HTML
    const keywordsHtml = spread.keywords
      .map(keyword => `<span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">${keyword}</span>`)
      .join('\n            ');

    // Prepare SEO data
    const title = `${spread.name} - розклад Таро онлайн | Гностичне тлумачення`;
    const description = `${spread.name} (${spread.cards} карт) - ${spread.gnosticEssence}. ${spread.philosophyIntro.substring(0, 150)}...`;
    const keywords = `${spread.name} таро, розклад ${spread.slug}, ${spread.keywords.join(', ')}, таро онлайн, гадання таро`;

    // Replace placeholders
    let html = spreadTemplate
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{DESCRIPTION\}\}/g, description)
      .replace(/\{\{KEYWORDS\}\}/g, keywords)
      .replace(/\{\{NAME\}\}/g, spread.name)
      .replace(/\{\{SLUG\}\}/g, spread.slug)
      .replace(/\{\{SPREAD_ID\}\}/g, spreadId)
      .replace(/\{\{GNOSTIC_ESSENCE\}\}/g, spread.gnosticEssence)
      .replace(/\{\{PHILOSOPHY_INTRO\}\}/g, spread.philosophyIntro)
      .replace(/\{\{DEEPER_MEANING\}\}/g, spread.deeperMeaning)
      .replace(/\{\{PRACTICAL_WISDOM\}\}/g, spread.practicalWisdom)
      .replace(/\{\{FOR_WHOM\}\}/g, spread.forWhom)
      .replace(/\{\{CATEGORY_NAME\}\}/g, categoryNames[spread.category] || spread.category)
      .replace(/\{\{CARDS\}\}/g, spread.cards)
      .replace(/\{\{POSITIONS_HTML\}\}/g, positionsHtml)
      .replace(/\{\{KEYWORDS_HTML\}\}/g, keywordsHtml);

    // Write file
    const filename = `${spread.slug}.html`;
    const filepath = join(rozkladyDir, filename);
    writeFileSync(filepath, html);
    generatedCount++;
  });

  console.log(`✅ Generated ${generatedCount} spread pages in /rozklady/`);
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

    // Generate spread pages
    generateSpreadPages();

    console.log('\n🎉 Build completed successfully!');
    console.log(`📦 Bundle size: ${((jsOutput.contents.length + cssOutput.contents.length) / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
};

// Run build
build();
