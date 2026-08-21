#!/usr/bin/env node
// Comprueba /api/health y una lista de assets en una URL base.
// Uso: node scripts/check_deploy.js <BASE_URL> [assetPath1 assetPath2 ...]

const { argv, exit } = require('process');
let globalFetch = global.fetch;
const http = require('http');
const https = require('https');

const base = argv[2] || process.env.DEPLOY_URL || 'http://localhost:4001';
let assets = argv.slice(3);
if (!assets || assets.length === 0) {
  assets = ['/assets/index-DilbcnR6.js', '/assets/index-BXmYvXia.css'];
}

const TIMEOUT_MS = 15000;

function httpRequest(url, opts = {}) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const isHttps = u.protocol === 'https:';
      const lib = isHttps ? https : http;
      const requestOptions = {
        method: opts.method || 'GET',
        headers: opts.headers || {},
        timeout: TIMEOUT_MS,
      };
      const req = lib.request(u, requestOptions, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 400,
            headers: res.headers,
            text: async () => body
          });
        });
      });
      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy(new Error('Timeout'));
      });
      if (opts.body) {
        req.write(opts.body);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function fetchWithTimeout(url, opts = {}) {
  // Try global fetch if available
  if (globalFetch) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await globalFetch(url, { ...opts, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      // fall through to httpRequest fallback
      console.warn('global fetch failed, falling back to http/https request:', String(err));
    }
  }
  // Fallback
  return httpRequest(url, opts);
}

async function checkHealth() {
  const url = new URL('/api/health', base).toString();
  try {
    const res = await fetchWithTimeout(url);
    const ok = res.ok;
    let body = null;
    try { body = await res.text(); } catch (e) { body = '<no-body>'; }
    return { url, status: res.status, ok, body };
  } catch (err) {
    return { url, error: String(err) };
  }
}

async function checkAsset(path) {
  const url = new URL(path, base).toString();
  try {
    const res = await fetchWithTimeout(url);
    const ct = res.headers && (res.headers['content-type'] || res.headers['Content-Type']) || '';
    return { path, url, status: res.status, ok: res.ok, contentType: ct };
  } catch (err) {
    return { path, url, error: String(err) };
  }
}

(async () => {
  console.log('Check deploy base:', base);
  const results = [];

  process.stdout.write('Checking /api/health ... ');
  const health = await checkHealth();
  if (health.error) {
    console.log('FAIL');
    console.error(health);
    results.push({ name: 'health', ok: false, detail: health });
  } else {
    console.log(health.ok ? `OK (${health.status})` : `FAIL (${health.status})`);
    results.push({ name: 'health', ok: health.ok, detail: health });
  }

  for (const a of assets) {
    process.stdout.write(`Checking asset ${a} ... `);
    const r = await checkAsset(a);
    if (r.error) {
      console.log('ERROR');
      console.error(r.error);
      results.push({ name: a, ok: false, detail: r });
      continue;
    }
    if (!r.ok || r.status >= 500) {
      console.log(`FAIL (${r.status})`);
      results.push({ name: a, ok: false, detail: r });
    } else {
      console.log(`OK (${r.status}, ${r.contentType})`);
      results.push({ name: a, ok: true, detail: r });
    }
  }

  const failed = results.filter(r => !r.ok);
  console.log('\nSummary:');
  results.forEach(r => console.log(` - ${r.name}: ${r.ok ? 'OK' : 'FAIL'}`));

  if (failed.length > 0) {
    console.error(`\nOne or more checks failed (${failed.length}).`);
    // Print details for failures
    failed.forEach(f => console.error(JSON.stringify(f.detail, null, 2)));
    exit(1);
  }

  console.log('\nAll checks passed.');
  exit(0);
})();
