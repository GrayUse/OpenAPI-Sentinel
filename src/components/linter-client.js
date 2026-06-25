import { createConfig, lintFromString, bundleFromString, getLineColLocation } from '@redocly/openapi-core';

/**
 * Lint an OpenAPI spec string using Redocly's engine.
 * Returns structured diagnostics compatible with Monaco markers.
 */
export async function lintSpec(source, userConfig = {}) {
  try {
    const baseExtends = userConfig.extends 
      ? (Array.isArray(userConfig.extends) ? userConfig.extends : [userConfig.extends])
      : ['recommended'];

    const config = await createConfig({
      extends: baseExtends,
      rules: userConfig.rules || {},
    });

    const results = await lintFromString({
      source,
      absoluteRef: '/',
      config,
    });

    const diagnostics = results.map((problem) => {
      let startLine = 1, startCol = 1, endLine = 1, endCol = 200;
      const loc = problem.location?.[0];
      if (loc) {
        try {
          const lineCol = getLineColLocation(loc);
          if (lineCol && lineCol.start) {
            startLine = lineCol.start.line ?? 1;
            startCol = lineCol.start.col ?? 1;
            endLine = lineCol.end?.line ?? startLine;
            endCol = lineCol.end?.col ?? 200;
          }
        } catch (e) {
          // Fallback
          startLine = loc.start?.line ?? 1;
          startCol = loc.start?.col ?? 1;
          endLine = loc.end?.line ?? startLine;
          endCol = loc.end?.col ?? 200;
        }
      }

      return {
        severity: mapSeverity(problem.severity),
        message: problem.message,
        ruleId: problem.ruleId || 'unknown',
        location: { startLine, startCol, endLine, endCol },
        suggest: problem.suggest || null,
      };
    });

    // Parse the spec for metadata
    let specMeta = {};
    try {
      const bundled = await bundleFromString({
        source,
        absoluteRef: '/',
        config,
      });
      const doc = bundled.bundle?.parsed;
      if (doc) {
        specMeta = {
          title: doc.info?.title || 'Untitled',
          version: doc.info?.version || '',
          openapi: doc.openapi || doc.swagger || '',
          paths: Object.entries(doc.paths || {}).map(([pathName, pathObj]) => ({
            name: pathName,
            methods: Object.keys(pathObj || {}).filter(m => ['get','post','put','delete','patch','options','head'].includes(m.toLowerCase()))
          })),
          schemas: Object.keys(doc.components?.schemas || {}),
        };
      }
    } catch {
      // Bundling may fail if spec has errors — that's fine
    }

    return {
      diagnostics,
      stats: {
        errors: diagnostics.filter((d) => d.severity === 'error').length,
        warnings: diagnostics.filter((d) => d.severity === 'warning').length,
        infos: diagnostics.filter((d) => d.severity === 'info').length,
        total: diagnostics.length,
      },
      meta: specMeta,
    };
  } catch (err) {
    // If Redocly fails to even parse, return a single critical error
    return {
      diagnostics: [
        {
          severity: 'error',
          message: `Parse error: ${err.message}`,
          ruleId: 'parse-error',
          location: { startLine: 1, startCol: 1, endLine: 1, endCol: 200 },
          suggest: null,
        },
      ],
      stats: { errors: 1, warnings: 0, infos: 0, total: 1 },
      meta: {},
    };
  }
}

function mapSeverity(severity) {
  switch (severity) {
    case 'error':
      return 'error';
    case 'warn':
    case 'warning':
      return 'warning';
    default:
      return 'info';
  }
}
