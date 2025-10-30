/**
 * Observability API Module
 *
 * Agent-friendly debugging and analysis tools.
 *
 * @example
 * import { DebugAPI, QueryBuilder } from '@observability/api';
 *
 * const api = new DebugAPI(LOG, debugContext, errorPatternDetector);
 * const summary = api.getSummary();
 *
 * const results = new QueryBuilder(LOG)
 *     .level('error')
 *     .inLastMinutes(5)
 *     .execute();
 */

export { DebugAPI } from './DebugAPI.js';
export { QueryBuilder } from './QueryBuilder.js';
export { LogAnalyzer } from './LogAnalyzer.js';
export { ExportFormatter } from './ExportFormatter.js';
export { ErrorSuggestions } from './ErrorSuggestions.js';
