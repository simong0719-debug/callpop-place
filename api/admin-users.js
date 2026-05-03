const SUPABASE_URL = 'https://caqqgmtbgipkjapdadwu.supabase.co';

async function verifyJwt(jwt) {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'apikey': key,
    },
  });
  return r.ok;
}

module.exports = async function handler(req, res) {
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!serviceKey) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다. .env 파일을 확인하세요.' });
  }

  const jwt = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!jwt || !(await verifyJwt(jwt))) {
    return res.status(401).json({ error: '인증 필요' });
  }

  const adminHeaders = {
    'Authorization': `Bearer ${serviceKey}`,
    'apikey': serviceKey,
    'Content-Type': 'application/json',
  };

  // ── GET: 사용자 목록 ──────────────────────────────
  if (req.method === 'GET') {
    const r    = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, { headers: adminHeaders });
    const data = await r.json();
    return res.status(r.status).json(data);
  }

  // ── POST: 사용자 생성 ─────────────────────────────
  if (req.method === 'POST') {
    const { email, password } = req.body;
    if (!email || !password)    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    if (password.length < 6)    return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });

    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  }

  // ── DELETE: 사용자 삭제 ───────────────────────────
  if (req.method === 'DELETE') {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId가 필요합니다.' });

    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    return res.status(r.status).json({ ok: r.ok });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
