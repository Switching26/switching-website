// Server-only client. No provider credentials; dedicated website-only queue key.
const BASE = process.env.AI_SERVICE_URL || '';
const KEY = process.env.AI_WEBSITE_KEY || '';

function configured() { return BASE.startsWith('https://') && !!KEY; }

async function complete(messages, system, transport = fetch) {
  if (!configured()) throw new Error('Assistant temporairement indisponible.');
  async function request(path, body) {
    const response = await transport(BASE + path, {
      method: body ? 'POST' : 'GET', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'X-AI-Website-Key': KEY },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('Assistant temporairement indisponible.');
    return response.json();
  }
  const { id } = await request('/jobs', { messages, system });
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('Reponse IA invalide.');
  const deadline = Date.now() + 78000;
  while (Date.now() < deadline) {
    const job = await request('/jobs/' + id);
    if (job.status === 'done' && typeof job.result?.text === 'string') return job.result.text;
    if (!['pending', 'running'].includes(job.status)) throw new Error('Assistant temporairement indisponible.');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Le delai de reponse est depasse. Reessayez.');
}
module.exports = { complete, configured };
