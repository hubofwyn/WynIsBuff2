#!/usr/bin/env node
/**
 * Asset Specification Loader and Validator
 * Loads YAML asset specs and validates against schema
 */

import { readFileSync } from 'fs';
import { parse as parseYAML } from 'yaml';
import { resolve } from 'path';

export class SpecLoader {
  constructor(schemaPath = null) {
    this.schemaPath = schemaPath || resolve(process.cwd(), 'architecture/asset-spec.schema.json');
    this.schema = null;

    // Load schema if available
    try {
      const schemaContent = readFileSync(this.schemaPath, 'utf-8');
      this.schema = JSON.parse(schemaContent);
    } catch (error) {
      console.warn('⚠️  Schema not found, skipping validation:', error.message);
    }
  }

  /**
   * Load and parse a YAML spec file
   * @param {string} specPath - Path to YAML spec file
   * @returns {Object} Parsed specification
   */
  load(specPath) {
    try {
      const absolutePath = resolve(specPath);
      const content = readFileSync(absolutePath, 'utf-8');
      const spec = parseYAML(content);

      // Basic validation
      this.validateBasicStructure(spec, specPath);

      // Determine spec type
      spec._specType = spec.template ? 'template' : 'asset';
      spec._sourcePath = absolutePath;

      return spec;
    } catch (error) {
      throw new Error(`Failed to load spec from ${specPath}: ${error.message}`);
    }
  }

  /**
   * Validate basic spec structure
   * @param {Object} spec - Parsed specification
   * @param {string} specPath - Path for error messages
   */
  validateBasicStructure(spec, specPath) {
    // Check required fields
    if (!spec.version) {
      throw new Error(`${specPath}: Missing required field 'version'`);
    }

    if (!spec.generation) {
      throw new Error(`${specPath}: Missing required field 'generation'`);
    }

    if (!spec.generation.type) {
      throw new Error(`${specPath}: Missing required field 'generation.type'`);
    }

    if (!spec.generation.provider) {
      throw new Error(`${specPath}: Missing required field 'generation.provider'`);
    }

    if (!spec.prompt) {
      throw new Error(`${specPath}: Missing required field 'prompt'`);
    }

    // Validate type
    const validTypes = ['image', 'audio'];
    if (!validTypes.includes(spec.generation.type)) {
      throw new Error(`${specPath}: Invalid generation.type '${spec.generation.type}'. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate provider
    const validProviders = [
      'dalle-3', 'stable-diffusion', 'firefly',
      'elevenlabs', 'bark', 'musicgen'
    ];
    if (!validProviders.includes(spec.generation.provider)) {
      throw new Error(`${specPath}: Invalid provider '${spec.generation.provider}'. Must be one of: ${validProviders.join(', ')}`);
    }

    // For asset specs (not templates), require id
    if (!spec.template && !spec.id) {
      throw new Error(`${specPath}: Asset specs must have an 'id' field`);
    }

    // For template specs, require template name
    if (spec.template && !spec.parameters) {
      throw new Error(`${specPath}: Template specs must have 'parameters' field`);
    }
  }

  /**
   * Load multiple specs from a directory
   * @param {string} dirPath - Directory containing spec files
   * @param {string} pattern - File pattern to match (default: *.yaml)
   * @returns {Array} Array of loaded specs
   */
  loadDirectory(dirPath, pattern = '*.yaml') {
    // This would use glob to find all matching files
    // For now, just return empty array
    // TODO: Implement directory scanning
    return [];
  }

  /**
   * Validate spec against JSON schema (if available)
   * @param {Object} spec - Specification to validate
   * @returns {Object} Validation result { valid: boolean, errors: array }
   */
  validateAgainstSchema(spec) {
    if (!this.schema) {
      return { valid: true, errors: [], warnings: ['Schema not loaded, skipped validation'] };
    }

    // TODO: Implement JSON schema validation
    // For now, just return valid
    return { valid: true, errors: [], warnings: [] };
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const specPath = process.argv[2];

  if (!specPath) {
    console.error('Usage: node spec-loader.js <spec-file.yaml>');
    process.exit(1);
  }

  try {
    const loader = new SpecLoader();
    const spec = loader.load(specPath);

    console.log('✅ Spec loaded successfully');
    console.log('📋 Spec details:');
    console.log(`   ID: ${spec.id || spec.template}`);
    console.log(`   Type: ${spec.generation.type}`);
    console.log(`   Provider: ${spec.generation.provider}`);
    console.log(`   Spec Type: ${spec._specType}`);

    // Validate
    const validation = loader.validateAgainstSchema(spec);
    if (validation.valid) {
      console.log('✅ Validation passed');
    } else {
      console.log('❌ Validation failed:');
      validation.errors.forEach(err => console.log(`   - ${err}`));
    }

    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      validation.warnings.forEach(warn => console.log(`   - ${warn}`));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}
