module.exports = function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.redirect(302, "https://callpop.vercel.app");
  res.redirect(302, "https://callpop.vercel.app/?zone=" + encodeURIComponent(code));
};
