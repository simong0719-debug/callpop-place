module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = (process.env.SUPABASE_URL       || '').trim();
  const supabaseKey = (process.env.SUPABASE_ANON_KEY  || '').trim();

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_ANON_KEY 환경변수가 없습니다.' });
  }

  res.status(200).json({ supabaseUrl, supabaseKey });
};
