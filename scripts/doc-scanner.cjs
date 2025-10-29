#!/usr/bin/env node

/**
 * Documentation Scanner for WynIsBuff2
 * Analyzes all project documentation for issues and improvements
 */

const fs = require('fs');
const path = require('path');

const SCAN_DIRS = ['docs', 'AIProjectDocs', '.claude'];
const ROOT_MD_FILES = fs.readdirSync('.')
  .filter(f => f.endsWith('.md') && !f.includes('node_modules'));

// Patterns to detect
const PATTERNS = {
  // Outdated references
  outdated: [
    /BaseScene/gi,
    /EventEmitter3/gi,
    /old.*architecture/gi,
    /deprecated/gi,
    /\btodo\b/gi,
    /\bfixme\b/gi,
    /in progress/gi,
  ],

  // Duplicate indicators
  duplicate_titles: [
    /^#\s+(.+)$/gm,
  ],

  // Broken or suspicious links
  links: /\[([^\]]+)\]\(([^)]+)\)/g,

  // Date stamps
  dates: /\b(20\d{2}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]20\d{2})\b/g,

  // Code blocks
  code_blocks: /```[\s\S]*?```/g,
};

class DocScanner {
  constructor() {
    this.files = [];
    this.issues = {
      outdated: [],
      duplicates: new Map(),
      broken_links: [],
      old_dates: [],
      empty_or_tiny: [],
      no_headers: [],
      too_long: [],
    };
    this.stats = {
      total_files: 0,
      total_size: 0,
      total_lines: 0,
    };
    this.titleMap = new Map(); // Track duplicate titles
  }

  // Scan all documentation files
  scan() {
    console.log('🔍 Scanning documentation...\n');

    // Scan root MD files
    ROOT_MD_FILES.forEach(file => this.scanFile(file));

    // Scan directories
    SCAN_DIRS.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir);
      }
    });

    this.analyze();
    this.report();
  }

  scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && entry.name !== 'node_modules') {
        this.scanDirectory(fullPath);
      } else if (entry.name.endsWith('.md')) {
        this.scanFile(fullPath);
      }
    });
  }

  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    const lines = content.split('\n');

    this.files.push({
      path: filePath,
      content,
      lines,
      size: stats.size,
      modified: stats.mtime,
    });

    this.stats.total_files++;
    this.stats.total_size += stats.size;
    this.stats.total_lines += lines.length;
  }

  analyze() {
    console.log('📊 Analyzing documentation...\n');

    this.files.forEach(file => {
      this.checkOutdated(file);
      this.checkDuplicates(file);
      this.checkLinks(file);
      this.checkDates(file);
      this.checkSize(file);
      this.checkStructure(file);
    });
  }

  checkOutdated(file) {
    PATTERNS.outdated.forEach(pattern => {
      const matches = file.content.match(pattern);
      if (matches) {
        this.issues.outdated.push({
          file: file.path,
          pattern: pattern.source,
          count: matches.length,
          sample: matches.slice(0, 3),
        });
      }
    });
  }

  checkDuplicates(file) {
    const titleMatches = [...file.content.matchAll(PATTERNS.duplicate_titles[0])];
    titleMatches.forEach(match => {
      const title = match[1].trim();
      if (!this.titleMap.has(title)) {
        this.titleMap.set(title, []);
      }
      this.titleMap.get(title).push(file.path);
    });
  }

  checkLinks(file) {
    const links = [...file.content.matchAll(PATTERNS.links)];
    links.forEach(match => {
      const [fullMatch, text, url] = match;

      // Check for broken internal links
      if (!url.startsWith('http') && !url.startsWith('#')) {
        const linkedPath = path.join(path.dirname(file.path), url);
        if (!fs.existsSync(linkedPath)) {
          this.issues.broken_links.push({
            file: file.path,
            link: url,
            text,
          });
        }
      }
    });
  }

  checkDates(file) {
    const dates = [...file.content.matchAll(PATTERNS.dates)];
    if (dates.length > 0) {
      // Check if dates are old (before 2025)
      const oldDates = dates.filter(d => {
        const year = parseInt(d[0].match(/20\d{2}/)[0]);
        return year < 2025;
      });

      if (oldDates.length > 0) {
        this.issues.old_dates.push({
          file: file.path,
          dates: oldDates.map(d => d[0]),
        });
      }
    }
  }

  checkSize(file) {
    if (file.size < 100) {
      this.issues.empty_or_tiny.push({
        file: file.path,
        size: file.size,
        lines: file.lines.length,
      });
    } else if (file.lines.length > 1000) {
      this.issues.too_long.push({
        file: file.path,
        lines: file.lines.length,
      });
    }
  }

  checkStructure(file) {
    const hasHeaders = file.content.match(/^#+ /m);
    if (!hasHeaders) {
      this.issues.no_headers.push(file.path);
    }
  }

  report() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DOCUMENTATION SCAN REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Stats
    console.log('📈 STATISTICS:');
    console.log(`  Total files: ${this.stats.total_files}`);
    console.log(`  Total size: ${(this.stats.total_size / 1024).toFixed(1)} KB`);
    console.log(`  Total lines: ${this.stats.total_lines.toLocaleString()}`);
    console.log(`  Average size: ${(this.stats.total_size / this.stats.total_files / 1024).toFixed(1)} KB per file\n`);

    // Issues
    console.log('🚨 ISSUES FOUND:\n');

    // Outdated references
    if (this.issues.outdated.length > 0) {
      console.log(`⚠️  OUTDATED REFERENCES (${this.issues.outdated.length}):`);
      this.issues.outdated.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue.file}`);
        console.log(`    Pattern: ${issue.pattern} (${issue.count} matches)`);
      });
      if (this.issues.outdated.length > 10) {
        console.log(`  ... and ${this.issues.outdated.length - 10} more\n`);
      } else {
        console.log('');
      }
    }

    // Duplicate titles
    const duplicates = Array.from(this.titleMap.entries())
      .filter(([title, files]) => files.length > 1);

    if (duplicates.length > 0) {
      console.log(`🔁 DUPLICATE TITLES (${duplicates.length}):`);
      duplicates.slice(0, 10).forEach(([title, files]) => {
        console.log(`  - "${title}" appears in:`);
        files.forEach(file => console.log(`    • ${file}`));
      });
      if (duplicates.length > 10) {
        console.log(`  ... and ${duplicates.length - 10} more\n`);
      } else {
        console.log('');
      }
    }

    // Broken links
    if (this.issues.broken_links.length > 0) {
      console.log(`🔗 BROKEN LINKS (${this.issues.broken_links.length}):`);
      this.issues.broken_links.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue.file}`);
        console.log(`    Link: ${issue.link}`);
      });
      if (this.issues.broken_links.length > 10) {
        console.log(`  ... and ${this.issues.broken_links.length - 10} more\n`);
      } else {
        console.log('');
      }
    }

    // Old dates
    if (this.issues.old_dates.length > 0) {
      console.log(`📅 OLD DATES (${this.issues.old_dates.length}):`);
      this.issues.old_dates.slice(0, 10).forEach(issue => {
        console.log(`  - ${issue.file}`);
        console.log(`    Dates: ${issue.dates.join(', ')}`);
      });
      if (this.issues.old_dates.length > 10) {
        console.log(`  ... and ${this.issues.old_dates.length - 10} more\n`);
      } else {
        console.log('');
      }
    }

    // Size issues
    if (this.issues.empty_or_tiny.length > 0) {
      console.log(`📄 TINY/EMPTY FILES (${this.issues.empty_or_tiny.length}):`);
      this.issues.empty_or_tiny.forEach(issue => {
        console.log(`  - ${issue.file} (${issue.size} bytes, ${issue.lines} lines)`);
      });
      console.log('');
    }

    if (this.issues.too_long.length > 0) {
      console.log(`📚 VERY LONG FILES (${this.issues.too_long.length}):`);
      this.issues.too_long.forEach(issue => {
        console.log(`  - ${issue.file} (${issue.lines} lines)`);
      });
      console.log('');
    }

    // No headers
    if (this.issues.no_headers.length > 0) {
      console.log(`📋 NO HEADERS (${this.issues.no_headers.length}):`);
      this.issues.no_headers.forEach(file => {
        console.log(`  - ${file}`);
      });
      console.log('');
    }

    // Generate JSON report
    this.saveReport();
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      issues: {
        outdated: this.issues.outdated,
        duplicates: Array.from(this.titleMap.entries())
          .filter(([title, files]) => files.length > 1)
          .map(([title, files]) => ({ title, files })),
        broken_links: this.issues.broken_links,
        old_dates: this.issues.old_dates,
        empty_or_tiny: this.issues.empty_or_tiny,
        too_long: this.issues.too_long,
        no_headers: this.issues.no_headers,
      },
      all_files: this.files.map(f => ({
        path: f.path,
        size: f.size,
        lines: f.lines.length,
        modified: f.modified,
      })),
    };

    fs.writeFileSync('doc-scan-report.json', JSON.stringify(report, null, 2));
    console.log('💾 Full report saved to: doc-scan-report.json\n');
  }
}

// Run scanner
const scanner = new DocScanner();
scanner.scan();
