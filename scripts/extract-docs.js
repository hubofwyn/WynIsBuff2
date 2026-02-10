#!/usr/bin/env node
/**
 * Documentation Extraction Script
 *
 * Scans JavaScript files for JSDoc comments and extracts them into
 * structured API reference documentation.
 *
 * Usage: node scripts/extract-docs.js [path]
 *
 * Examples:
 *   node scripts/extract-docs.js src/modules/level
 *   node scripts/extract-docs.js src/core/BaseManager.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Extract JSDoc blocks from source code
 */
function extractJSDoc(content, filePath) {
    const jsdocPattern = /\/\*\*\s*\n([^*]|\*(?!\/))*\*\//g;
    const classPattern = /export\s+class\s+(\w+)/g;
    const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    const methodPattern = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g;

    const docs = [];
    let match;

    // Find all JSDoc blocks
    const jsdocBlocks = [];
    while ((match = jsdocPattern.exec(content)) !== null) {
        jsdocBlocks.push({
            text: match[0],
            index: match.index,
            endIndex: match.index + match[0].length,
        });
    }

    // Find classes
    const classes = [];
    while ((match = classPattern.exec(content)) !== null) {
        classes.push({
            name: match[1],
            index: match.index,
        });
    }

    // Find functions
    const functions = [];
    while ((match = functionPattern.exec(content)) !== null) {
        functions.push({
            name: match[1],
            index: match.index,
            type: 'function',
        });
    }

    // Match JSDoc to classes/functions
    jsdocBlocks.forEach((block) => {
        const nextClass = classes.find(
            (c) => c.index > block.endIndex && c.index - block.endIndex < 100
        );
        const nextFunction = functions.find(
            (f) => f.index > block.endIndex && f.index - block.endIndex < 100
        );

        if (nextClass) {
            docs.push({
                type: 'class',
                name: nextClass.name,
                doc: block.text,
                file: filePath,
            });
        } else if (nextFunction) {
            docs.push({
                type: 'function',
                name: nextFunction.name,
                doc: block.text,
                file: filePath,
            });
        }
    });

    return docs;
}

/**
 * Clean JSDoc text for markdown
 */
function cleanJSDoc(jsdoc) {
    return jsdoc
        .replace(/\/\*\*|\*\//g, '')
        .split('\n')
        .map((line) => line.replace(/^\s*\*\s?/, ''))
        .join('\n')
        .trim();
}

/**
 * Generate markdown documentation
 */
function generateMarkdown(docs, sourcePath) {
    const relativePath = path.relative(PROJECT_ROOT, sourcePath);
    const moduleName = path.basename(sourcePath, '.js');

    let md = `# ${moduleName} API Reference\n\n`;
    md += `**Source**: \`${relativePath}\`\n`;
    md += `**Generated**: ${new Date().toISOString().split('T')[0]}\n\n`;
    md += `---\n\n`;

    // Group by type
    const classes = docs.filter((d) => d.type === 'class');
    const functions = docs.filter((d) => d.type === 'function');

    if (classes.length > 0) {
        md += `## Classes\n\n`;
        classes.forEach((cls) => {
            md += `### ${cls.name}\n\n`;
            md += cleanJSDoc(cls.doc) + '\n\n';
            md += `**File**: [\`${path.relative(PROJECT_ROOT, cls.file)}\`](../../../${path.relative(PROJECT_ROOT, cls.file)})\n\n`;
        });
    }

    if (functions.length > 0) {
        md += `## Functions\n\n`;
        functions.forEach((fn) => {
            md += `### ${fn.name}()\n\n`;
            md += cleanJSDoc(fn.doc) + '\n\n';
            md += `**File**: [\`${path.relative(PROJECT_ROOT, fn.file)}\`](../../../${path.relative(PROJECT_ROOT, fn.file)})\n\n`;
        });
    }

    return md;
}

/**
 * Process a single file
 */
function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const docs = extractJSDoc(content, filePath);

    if (docs.length === 0) {
        return null;
    }

    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const moduleName = path.basename(filePath, '.js');
    const outputPath = path.join(
        PROJECT_ROOT,
        'docs',
        'reference',
        'api',
        `${moduleName.toLowerCase()}_reference.md`
    );

    const markdown = generateMarkdown(docs, filePath);

    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, markdown);

    return {
        source: relativePath,
        output: path.relative(PROJECT_ROOT, outputPath),
        items: docs.length,
    };
}

/**
 * Process directory recursively
 */
function processDirectory(dirPath) {
    const results = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            // Skip node_modules, dist, etc.
            if (!['node_modules', 'dist', '.git', 'docs'].includes(entry.name)) {
                results.push(...processDirectory(fullPath));
            }
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            const result = processFile(fullPath);
            if (result) {
                results.push(result);
            }
        }
    }

    return results;
}

/**
 * Main execution
 */
function main() {
    const args = process.argv.slice(2);
    const targetPath = args[0] || 'src';
    const fullPath = path.resolve(PROJECT_ROOT, targetPath);

    console.log('📚 Documentation Extraction');
    console.log('===========================\n');
    console.log(`Target: ${targetPath}`);
    console.log(`Full path: ${fullPath}\n`);

    if (!fs.existsSync(fullPath)) {
        console.error(`❌ Path not found: ${fullPath}`);
        process.exit(1);
    }

    const stats = fs.statSync(fullPath);
    let results;

    if (stats.isDirectory()) {
        results = processDirectory(fullPath);
    } else if (stats.isFile()) {
        const result = processFile(fullPath);
        results = result ? [result] : [];
    } else {
        console.error(`❌ Invalid path type: ${fullPath}`);
        process.exit(1);
    }

    // Summary
    console.log('\nResults:');
    console.log('--------');
    results.forEach((r) => {
        console.log(`✅ ${r.source}`);
        console.log(`   → ${r.output} (${r.items} items)`);
    });

    console.log(`\n📊 Total: ${results.length} files processed`);
    console.log(`📄 Total items: ${results.reduce((sum, r) => sum + r.items, 0)}`);
}

main();
