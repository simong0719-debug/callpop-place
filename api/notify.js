module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    place_name_kr, place_name_en, place_type,
    representative, phone, email,
    bank_name, account_holder,
    target_users, expected_stores, start_date, message,
  } = req.body;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#E3001B;padding:20px 28px;">
        <h1 style="color:#fff;margin:0;font-size:20px;">콜팝 플레이스 — 새 신청 접수</h1>
      </div>
      <div style="padding:28px;border:1px solid #eee;border-top:none;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="background:#f9f9f9;">
            <td style="padding:10px 14px;font-weight:700;color:#555;width:35%;">플레이스명 (한글)</td>
            <td style="padding:10px 14px;">${place_name_kr || '-'}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:700;color:#555;">플레이스명 (영문)</td>
            <td style="padding:10px 14px;">${place_name_en || '-'}</td>
          </tr>
          <tr style="background:#f9f9f9;">
            <td style="padding:10px 14px;font-weight:700;color:#555;">플레이스 유형</td>
            <td style="padding:10px 14px;">${place_type || '-'}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:700;color:#555;">대표자명</td>
            <td style="padding:10px 14px;">${representative || '-'}</td>
          </tr>
          <tr style="background:#f9f9f9;">
            <td style="padding:10px 14px;font-weight:700;color:#555;">연락처</td>
            <td style="padding:10px 14px;">${phone || '-'}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:700;color:#555;">이메일</td>
            <td style="padding:10px 14px;">${email || '-'}</td>
          </tr>
          <tr style="background:#f9f9f9;">
            <td style="padding:10px 14px;font-weight:700;color:#555;">정산 은행</td>
            <td style="padding:10px 14px;">${bank_name || '-'}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:700;color:#555;">예금주</td>
            <td style="padding:10px 14px;">${account_holder || '-'}</td>
          </tr>
          <tr style="background:#f9f9f9;">
            <td style="padding:10px 14px;font-weight:700;color:#555;">타겟 이용자</td>
            <td style="padding:10px 14px;">${target_users || '-'}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:700;color:#555;">예상 가맹점 수</td>
            <td style="padding:10px 14px;">${expected_stores ? expected_stores + '개' : '-'}</td>
          </tr>
          <tr style="background:#f9f9f9;">
            <td style="padding:10px 14px;font-weight:700;color:#555;">운영 시작 희망일</td>
            <td style="padding:10px 14px;">${start_date || '-'}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:700;color:#555;">문의 사항</td>
            <td style="padding:10px 14px;">${message || '-'}</td>
          </tr>
        </table>
        <div style="margin-top:24px;padding:16px;background:#FFF5F5;border-radius:6px;font-size:13px;color:#888;">
          Supabase에서 전체 신청 내역을 확인하세요.
        </div>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@callpop.co.kr',
        to: 'simong35@naver.com',
        subject: `[콜팝 플레이스] 새 신청 — ${place_name_kr || '이름없음'}`,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
