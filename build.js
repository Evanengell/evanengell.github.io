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

// Generate category pages
const generateCategoryPages = () => {
  console.log('📁 Generating category pages...');

  const categoryTemplate = readFileSync(join(__dirname, 'category-template.html'), 'utf-8');

  const categoryInfo = {
    classic: { name: 'Класичні', icon: '🌟', slug: 'classic' },
    quick: { name: 'Швидкі', icon: '⚡', slug: 'quick' },
    love: { name: 'Любовні', icon: '❤️', slug: 'love' },
    career: { name: 'Кар\'єра', icon: '💼', slug: 'career' },
    spiritual: { name: 'Духовні', icon: '🔮', slug: 'spiritual' },
    forecast: { name: 'Прогнози', icon: '📅', slug: 'forecast' },
    special: { name: 'Спеціальні', icon: '🎯', slug: 'special' }
  };

  let generatedCount = 0;

  Object.keys(categoryInfo).forEach(categoryKey => {
    const category = categoryInfo[categoryKey];
    const categoryData = categoriesPhilosophy[categoryKey];

    // Find all spreads in this category
    const spreadsInCategory = Object.keys(spreadsData).filter(
      spreadId => spreadsData[spreadId].category === categoryKey
    );

    // Generate spread cards HTML
    const spreadCardsHtml = spreadsInCategory.map(spreadId => {
      const spread = spreadsData[spreadId];
      return `
          <div class="spread-card rounded-2xl p-6 fade-in">
            <div class="mb-4">
              <h3 class="text-2xl font-bold text-purple-700 mb-2">${spread.name}</h3>
              <p class="text-sm text-gray-600">${spread.cards} карт</p>
            </div>
            <p class="text-gray-700 mb-4 italic">"${spread.gnosticEssence}"</p>
            <div class="mb-4">
              <div class="flex flex-wrap gap-2">
                ${spread.keywords.map(kw => `<span class="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">${kw}</span>`).join('\n                ')}
              </div>
            </div>
            <a href="/rozklady/${spread.slug}.html" class="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-full font-semibold transition-all transform hover:scale-105 shadow-md">
              Дізнатися більше →
            </a>
          </div>`;
    }).join('\n        ');

    // Prepare SEO data
    const title = `${category.name} розклади Таро онлайн | Гностичне тлумачення`;
    const description = categoryData ? categoryData.description : `${spreadsInCategory.length} ${category.name.toLowerCase()} розкладів Таро для онлайн гадання`;
    const keywords = `${category.name.toLowerCase()} таро, розклади таро ${category.name.toLowerCase()}, гадання таро онлайн`;

    // Replace placeholders
    let html = categoryTemplate
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{DESCRIPTION\}\}/g, description)
      .replace(/\{\{KEYWORDS\}\}/g, keywords)
      .replace(/\{\{CATEGORY_NAME\}\}/g, category.name)
      .replace(/\{\{CATEGORY_ICON\}\}/g, category.icon)
      .replace(/\{\{CATEGORY_SLUG\}\}/g, category.slug)
      .replace(/\{\{CATEGORY_DESCRIPTION\}\}/g, categoryData ? categoryData.description : description)
      .replace(/\{\{SPREADS_COUNT\}\}/g, spreadsInCategory.length)
      .replace(/\{\{SPREADS_CARDS\}\}/g, spreadCardsHtml);

    // Write file
    const filename = `${category.slug}.html`;
    const filepath = join(__dirname, 'rozklady', filename);
    writeFileSync(filepath, html);
    generatedCount++;
  });

  console.log(`✅ Generated ${generatedCount} category pages in /rozklady/`);
};

// Build the application
const build = async () => {
  console.log('🚀 Building with esbuild...');

  // Clean before build
  cleanDirs();

  try {
    // Build JavaScript bundle with Preact
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
      jsxImportSource: 'preact',
      alias: {
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime'
      },
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

    // Generate category pages
    generateCategoryPages();

    console.log('\n🎉 Build completed successfully!');
    console.log(`📦 Bundle size: ${((jsOutput.contents.length + cssOutput.contents.length) / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
};

// Run build
build();
