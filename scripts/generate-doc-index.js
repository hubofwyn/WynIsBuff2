#!/usr/bin/env node
/**
 * Documentation Index Generator
 *
 * Scans source code and documentation to update doc_index.yaml
 * with current cross-references and metadata.
 *
 * Usage: node scripts/generate-doc-index.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DOC_INDEX_PATH = path.join(PROJECT_ROOT, 'docs', 'meta', 'doc_index.yaml');

/**
 * Scan directory for files
 */
function scanDirectory(dirPath, extension = '.js') {
    const files = [];

    function scan(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (!['node_modules', 'dist', '.git', 'docs'].includes(entry.name)) {
                    scan(fullPath);
                }
            } else if (entry.isFile() && entry.name.endsWith(extension)) {
                files.push(fullPath);
            }
        }
    }

    scan(dirPath);
    return files;
}

/**
 * Extract metadata from file
 */
function extractFileMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    // Extract class names
    const classPattern = /export\s+class\s+(\w+)/g;
    const classes = [];
    let match;
    while ((match = classPattern.exec(content)) !== null) {
        classes.push(match[1]);
    }

    // Extract imports to determine dependencies
    const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    while ((match = importPattern.exec(content)) !== null) {
        imports.push(match[1]);
    }

    // Look for @doc tags in comments
    const docTagPattern = /@doc:\s*(\S+)/g;
    const docTags = [];
    while ((match = docTagPattern.exec(content)) !== null) {
        docTags.push(match[1]);
    }

    // Extract keywords from comments
    const keywordPattern = /@keywords?:\s*([^\n]+)/g;
    const keywords = [];
    while ((match = keywordPattern.exec(content)) !== null) {
        keywords.push(...match[1].split(',').map((k) => k.trim()));
    }

    return {
        path: relativePath,
        classes,
        imports,
        docTags,
        keywords,
        lastModified: fs.statSync(filePath).mtime.toISOString().split('T')[0],
    };
}

/**
 * Scan documentation files
 */
function scanDocumentation() {
    const docsDir = path.join(PROJECT_ROOT, 'docs');
    const mdFiles = scanDirectory(docsDir, '.md');

    return mdFiles.map((filePath) => {
        const relativePath = path.relative(PROJECT_ROOT, filePath);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract links to source files
        const sourceLinkPattern = /\[.*?\]\((\.\.\/)*src\/[^)]+\)/g;
        const sourceLinks = [];
        let match;
        while ((match = sourceLinkPattern.exec(content)) !== null) {
            sourceLinks.push(match[0]);
        }

        return {
            path: relativePath,
            sourceLinks: sourceLinks.length,
            lastModified: fs.statSync(filePath).mtime.toISOString().split('T')[0],
        };
    });
}

/**
 * Build cross-reference graph
 */
function buildCrossReferences(systems) {
    const refs = {};

    systems.forEach((system) => {
        refs[system.id] = [];

        // Find related systems based on imports
        systems.forEach((other) => {
            if (system.id !== other.id) {
                // Check if system imports from other
                const hasRelation = system.source.some((srcPath) => {
                    return other.source.some((otherPath) => {
                        // Simplified check - could be more sophisticated
                        return srcPath.includes(path.dirname(otherPath));
                    });
                });

                if (hasRelation && !refs[system.id].includes(other.id)) {
                    refs[system.id].push(other.id);
                }
            }
        });
    });

    return refs;
}

/**
 * Update doc_index.yaml
 */
function updateDocIndex() {
    console.log('📚 Updating Documentation Index');
    console.log('================================\n');

    // Load existing index
    let existingIndex = {};
    if (fs.existsSync(DOC_INDEX_PATH)) {
        const content = fs.readFileSync(DOC_INDEX_PATH, 'utf-8');
        existingIndex = yaml.parse(content);
        console.log('✅ Loaded existing doc_index.yaml');
    } else {
        console.log('⚠️  No existing index found, creating new one');
    }

    // Scan source code
    console.log('\n🔍 Scanning source code...');
    const srcFiles = scanDirectory(path.join(PROJECT_ROOT, 'src'));
    console.log(`   Found ${srcFiles.length} source files`);

    // Extract metadata from key files
    const coreFiles = srcFiles.filter((f) => f.includes('/core/'));
    const moduleFiles = srcFiles.filter((f) => f.includes('/modules/'));
    const sceneFiles = srcFiles.filter((f) => f.includes('/scenes/'));

    console.log(`   - Core: ${coreFiles.length}`);
    console.log(`   - Modules: ${moduleFiles.length}`);
    console.log(`   - Scenes: ${sceneFiles.length}`);

    // Scan documentation
    console.log('\n📄 Scanning documentation...');
    const docs = scanDocumentation();
    console.log(`   Found ${docs.length} documentation files`);

    // Update last modified dates in existing systems
    if (existingIndex.systems) {
        existingIndex.systems.forEach((system) => {
            if (system.source) {
                const sourcePaths = Array.isArray(system.source) ? system.source : [system.source];
                const latestMod = sourcePaths
                    .map((src) => {
                        const fullPath = path.join(PROJECT_ROOT, src);
                        if (fs.existsSync(fullPath)) {
                            return fs.statSync(fullPath).mtime;
                        }
                        return null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => b - a)[0];

                if (latestMod) {
                    system.updated = latestMod.toISOString().split('T')[0];
                }
            }
        });
    }

    // Build cross-references
    if (existingIndex.systems) {
        console.log('\n🔗 Building cross-references...');
        const crossRefs = buildCrossReferences(existingIndex.systems);
        existingIndex.cross_references = crossRefs;
        console.log(`   Generated ${Object.keys(crossRefs).length} cross-reference entries`);
    }

    // Update version info
    existingIndex.version = existingIndex.version || '1.0.0';
    existingIndex.schema_version = '1.1.0';
    existingIndex.last_generated = new Date().toISOString();

    // Write updated index
    const yamlContent = yaml.stringify(existingIndex, {
        indent: 2,
        lineWidth: 0, // Don't wrap lines
    });

    fs.writeFileSync(DOC_INDEX_PATH, yamlContent);
    console.log(`\n✅ Documentation index updated`);
    console.log(`   Output: ${path.relative(PROJECT_ROOT, DOC_INDEX_PATH)}`);

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Systems: ${existingIndex.systems?.length || 0}`);
    console.log(`   Patterns: ${existingIndex.patterns?.length || 0}`);
    console.log(`   Schemas: ${existingIndex.schemas?.length || 0}`);
    console.log(`   Scenes: ${existingIndex.scenes?.length || 0}`);
    console.log(`   Guides: ${existingIndex.guides?.length || 0}`);
    console.log(`   Cross-refs: ${Object.keys(existingIndex.cross_references || {}).length}`);
}

/**
 * Main execution
 */
function main() {
    try {
        updateDocIndex();
        console.log('\n✅ Complete!\n');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
