# CI/CD & Code Quality Setup

**Date**: 2025-10-30
**Status**: ✅ Active

---

## Overview

WynIsBuff2 now includes comprehensive CI/CD workflows and code quality tooling to maintain consistent code style, catch errors early, and automate deployment.

### Tools Integrated

1. **GitHub Actions** - Automated CI/CD workflows
2. **ESLint** - JavaScript linting and code quality
3. **Prettier** - Code formatting
4. **Husky** - Git hooks for pre-commit checks
5. **lint-staged** - Run linters on staged files only

---

## GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push to `main` and on pull requests.

**Jobs**:

- **Test** - Runs test suite on Node 18.x and 20.x
- **Lint** - Checks code with ESLint and Prettier
- **Build** - Builds production bundle
- **Security** - Runs npm audit for vulnerabilities
- **Code Quality** - Checks for duplicate code
- **Compatibility** - Verifies ES Module compatibility

**Trigger**:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

Automatically deploys to GitHub Pages on push to `main`.

**Jobs**:

- **Build** - Creates production build
- **Deploy** - Deploys to GitHub Pages

### 3. Dependency Review (`.github/workflows/dependency-review.yml`)

Scans dependencies for security vulnerabilities on pull requests.

### 4. Release Workflow (`.github/workflows/release.yml`)

Automates release process (manual trigger).

---

## Local Development Tools

### ESLint

**Purpose**: Catch bugs, enforce coding standards, maintain consistency

**Config**: `eslint.config.mjs` (ESLint 9 flat config)

**Run manually**:

```bash
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues
```

**Current Status**:

- ✅ 423 issues identified (down from 1616)
- ✅ Auto-fix applied where possible
- ⏳ Remaining issues: unused variables, missing imports

**IDE Integration**:

Install ESLint extension for your IDE:

- **VS Code**: `dbaeumer.vscode-eslint`
- **WebStorm**: Built-in ESLint support

### Prettier

**Purpose**: Automatic code formatting for consistency

**Config**: `.prettierrc.json`

**Run manually**:

```bash
npm run format            # Format all files
npm run format:check      # Check formatting without modifying
```

**Current Status**:

- ✅ All files formatted
- ✅ Ignoring build output, migration backups, tests

**IDE Integration**:

Install Prettier extension for your IDE:

- **VS Code**: `esbenp.prettier-vscode`
- **WebStorm**: Built-in Prettier support

Enable "Format on Save" for automatic formatting.

### Husky + lint-staged

**Purpose**: Run linting and formatting checks before commits

**Config**:

- `.husky/pre-commit` - Git hook script
- `.lintstagedrc.json` - Lint-staged configuration

**How it works**:

1. You stage files: `git add .`
2. You commit: `git commit -m "message"`
3. Husky runs pre-commit hook
4. lint-staged runs ESLint and Prettier on staged files only
5. If checks pass, commit proceeds
6. If checks fail, commit is aborted

**Skip hooks (use sparingly)**:

```bash
git commit -m "message" --no-verify
```

---

## Configuration Files

### ESLint Config (`eslint.config.mjs`)

**Key Rules**:

- `no-console`: warn (allows console but warns)
- `no-unused-vars`: error (must be prefixed with `_` if intentionally unused)
- `import/order`: warn (enforces import grouping)
- `prefer-const`: error (use const when possible)
- `no-var`: error (use let/const, not var)

**Globals Defined**:

- Node.js: `console`, `process`, `Buffer`, `__dirname`, `__filename`
- Browser: `window`, `document`, `navigator`, `localStorage`
- Timers: `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`
- Game libraries: `Phaser`, `Howler`, `RAPIER`

**Ignored**:

- `node_modules/`
- `dist/`, `build/`
- `tests/`
- `.migration-backup/`
- `assets/`
- `doc-analysis/`
- Generated files: `src/constants/Assets.js`

### Prettier Config (`.prettierrc.json`)

**Settings**:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 120,
  "tabWidth": 4,
  "useTabs": false
}
```

**Ignored**:

- Same as ESLint plus `.claude/`, `.codex/`, configuration files

---

## npm Scripts

| Script            | Description                      |
| ----------------- | -------------------------------- |
| `npm run lint`    | Run ESLint on codebase           |
| `npm run lint:fix`| Auto-fix ESLint issues           |
| `npm run format`  | Format code with Prettier        |
| `npm run format:check` | Check formatting (no changes) |
| `npm test`        | Run test suite                   |
| `npm run build`   | Production build (with logs)     |
| `npm run build-nolog` | Production build (no logs)   |
| `npm run dev`     | Development server (with logs)   |
| `npm run dev-nolog` | Development server (no logs) |

---

## Workflow for Developers

### Before Committing

1. **Stage your changes**:

   ```bash
   git add .
   ```

2. **Commit** (hooks run automatically):

   ```bash
   git commit -m "feat: add new feature"
   ```

3. If hooks fail:
   - Fix reported issues
   - Re-stage files: `git add .`
   - Try commit again

### Manually Run Checks

Before committing, you can manually run checks:

```bash
npm run lint:fix    # Fix linting issues
npm run format      # Format code
npm test            # Run tests
```

### Pull Request Process

1. **Create feature branch**:

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes, commit with quality checks**

3. **Push to GitHub**:

   ```bash
   git push origin feature/my-feature
   ```

4. **Create Pull Request** on GitHub

5. **CI runs automatically**:
   - Tests must pass
   - Lint checks must pass
   - Build must succeed
   - Security audit must pass

6. **Merge when CI is green** ✅

---

## Troubleshooting

### ESLint Errors

**Problem**: `no-unused-vars` error for variables you need

**Solution**: Prefix with underscore if intentionally unused

```javascript
// ❌ Error
function handleEvent(event, data) {
  console.log(event);
  // data not used
}

// ✅ Fixed
function handleEvent(event, _data) {
  console.log(event);
}
```

### Prettier Formatting Conflicts

**Problem**: ESLint and Prettier disagree on formatting

**Solution**: Prettier takes precedence (we use `eslint-config-prettier`)

Run `npm run format` then `npm run lint:fix`.

### Husky Hook Not Running

**Problem**: Pre-commit hook not triggering

**Solution**: Reinstall husky hooks

```bash
npm run prepare
```

### CI Failing on GitHub

**Problem**: Tests pass locally but fail in CI

**Solution**: Check Node version compatibility

```bash
node --version  # Should be 18.x or 20.x
```

---

## Current Status

### ESLint

- ✅ Configured and active
- ✅ 423 issues remaining (down from 1616)
- ⏳ Gradual cleanup ongoing
- ⚠️ Focus on errors first, warnings can be addressed over time

### Prettier

- ✅ All files formatted
- ✅ Consistent code style across codebase

### Husky + lint-staged

- ✅ Pre-commit hooks active
- ✅ Runs on staged files only (fast)

### GitHub Actions

- ✅ CI workflow active
- ✅ Deploy workflow active
- ⏳ Dependency review pending first PR
- ⏳ Release workflow (manual trigger)

---

## Future Improvements

1. **Code Coverage**: Add test coverage reports
2. **Performance Budgets**: Track bundle size over time
3. **Visual Regression Testing**: Catch UI changes
4. **Automated Changelog**: Generate CHANGELOG.md from commits
5. **Stricter Linting**: Gradually reduce remaining issues

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Development guide
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) - Project architecture
- [BRANCH_AUDIT_RESULTS.md](../BRANCH_AUDIT_RESULTS.md) - Branch cleanup audit

---

**Maintainer**: Claude Code AI Assistant
**Last Updated**: 2025-10-30
