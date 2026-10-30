const crypto = require('crypto');
function normalizeCode(value) {
  return String(value || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();
}
function hashCode(value) {
  return crypto.createHash('sha256').update(normalizeCode(value)).digest('hex');
}
function newCodes() {
  const codes = Array.from({ length: 5 }, () => crypto.randomBytes(12).toString('hex').toUpperCase().match(/.{4}/g).join('-'));
  return { codes, hashes: codes.map(hashCode) };
}
function findCode(hashes, value) {
  if (!/^[0-9A-F]{24}$/.test(normalizeCode(value))) return -1;
  const target = Buffer.from(hashCode(value), 'hex');
  return (Array.isArray(hashes) ? hashes : []).findIndex(h => /^[a-f0-9]{64}$/i.test(String(h))
    && crypto.timingSafeEqual(Buffer.from(h, 'hex'), target));
}
function smsReady() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    && /^VA[0-9a-fA-F]{32}$/.test(process.env.TWILIO_VERIFY_SERVICE_SID || ''));
}
function toBrazilPhone(value) {
  let v = String(value || '').replace(/\D/g, '');
  if (/^55\d{10,11}$/.test(v)) v = v.slice(2);
  return /^\d{10,11}$/.test(v) ? '+55' + v : '';
}
async function twilioVerify(endpoint, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(process.env.TWILIO_ACCOUNT_SID + ':' + process.env.TWILIO_AUTH_TOKEN).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(body).toString(),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    return response.ok ? data : null;
  } finally { clearTimeout(timeout); }
}
const attempts = new Map();
function allowAttempt(key, max, windowMs) {
  const now = Date.now();
  if (attempts.size > 5000) for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const record = attempts.get(key);
  if (record && record.until > now && record.count >= max) return false;
  const active = record && record.until > now ? record : { count: 0, until: now + windowMs };
  active.count++;
  attempts.set(key, active);
  return true;
}
function rateKey(type, req, value='') {
  return type + ':' + crypto.createHash('sha256')
    .update([String(req.ip || ''), String(value).trim().toLowerCase()].join('|')).digest('hex');
}
module.exports = { newCodes, findCode, smsReady, toBrazilPhone, twilioVerify, allowAttempt, rateKey };
