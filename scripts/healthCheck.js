#!/usr/bin/env node
// Lightweight health check for local dev environment
// Checks: Hardhat RPC chainId, backend /health, frontend HTTP 200

const { URL } = require('url');
const fetch = global.fetch || require('node-fetch');

async function checkRpc() {
  try {
    const res = await fetch('http://127.0.0.1:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
      timeout: 5000,
    });
    if (!res.ok) throw new Error(`RPC responded ${res.status}`);
    const json = await res.json();
    return { ok: true, chainId: json.result };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function checkHttp(url) {
  try {
    const res = await fetch(url, { method: 'GET', timeout: 5000 });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

(async () => {
  console.log('\nRunning local health checks...');

  const rpc = await checkRpc();
  if (rpc.ok) {
    console.log(`- RPC: OK (chainId: ${rpc.chainId})`);
  } else {
    console.error(`- RPC: FAIL -> ${rpc.error}`);
  }

  const backend = await checkHttp('http://localhost:5000/health');
  if (backend.ok) {
    console.log(`- Backend: OK (http ${backend.status})`);
  } else {
    console.error(`- Backend: FAIL -> ${backend.error || 'status ' + backend.status}`);
  }

  const frontend = await checkHttp('http://localhost:3000/');
  if (frontend.ok) {
    console.log(`- Frontend: OK (http ${frontend.status})`);
  } else {
    console.error(`- Frontend: FAIL -> ${frontend.error || 'status ' + frontend.status}`);
  }

  const okAll = rpc.ok && backend.ok && frontend.ok;
  if (!okAll) {
    console.error('\nOne or more services failed. See messages above.');
    process.exit(2);
  }

  console.log('\nAll checks passed. Your local dev environment looks healthy.');
  process.exit(0);
})();
