function row(label, value, shade) {
  const bg = shade ? 'background:#f9f9f9;' : '';
  return `<tr style="${bg}">
    <td style="padding:10px 14px;font-weight:700;color:#555;width:35%;">${label}</td>
    <td style="padding:10px 14px;">${value || '-'}</td>
  </tr>`;
}

function buildHtml(title, rows) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#E3001B;padding:20px 28px;">
        <h1 style="color:#fff;margin:0;font-size:20px;">${title}</h1>
      </div>
      <div style="padding:28px;border:1px solid #eee;border-top:none;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          ${rows}
        </table>
        <div style="margin-top:24px;padding:16px;background:#FFF5F5;border-radius:6px;font-size:13px;color:#888;">
          Supabase 관리자 페이지에서 전체 신청 내역을 확인하세요.
        </div>
      </div>
    </div>
  `;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;
  const isStore = body.type === 'store_inquiry';

  let subject, html;

  if (isStore) {
    // ── 가맹점 신청 알림 ──
    const { store_name, store_address, category, representative, phone, desired_places, message } = body;
    subject = `[콜팝 가맹점] 새 신청 — ${store_name || '이름없음'}`;
    html = buildHtml('콜팝 가맹점 — 새 신청 접수', [
      row('매장명',        store_name,       true),
      row('매장 주소',     store_address,    false),
      row('카테고리',      category,         true),
      row('대표자명',      representative,   false),
      row('연락처',        phone,            true),
      row('희망 플레이스', desired_places,   false),
      row('추가 문의',     message,          true),
    ].join(''));
  } else {
    // ── 플레이스 신청 알림 ──
    const {
      place_name_kr, place_name_en, place_type,
      representative, phone, email,
      bank_name, account_holder,
      target_users, expected_stores, start_date, message,
    } = body;
    subject = `[콜팝 플레이스] 새 신청 — ${place_name_kr || '이름없음'}`;
    html = buildHtml('콜팝 플레이스 — 새 신청 접수', [
      row('플레이스명 (한글)', place_name_kr,   true),
      row('플레이스명 (영문)', place_name_en,   false),
      row('플레이스 유형',     place_type,      true),
      row('대표자명',          representative,  false),
      row('연락처',            phone,           true),
      row('이메일',            email,           false),
      row('정산 은행',         bank_name,       true),
      row('예금주',            account_holder,  false),
      row('타겟 이용자',       target_users,    true),
      row('예상 가맹점 수',    expected_stores ? expected_stores + '개' : null, false),
      row('운영 시작 희망일',  start_date,      true),
      row('문의 사항',         message,         false),
    ].join(''));
  }

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
        subject,
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
