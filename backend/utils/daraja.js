// M-Pesa Daraja STK push integration (config-gated)
// Set MPESA_CONSUMER_KEY/SECRET/PASSKEY/SHORTCODE in .env to enable.

const MPESA_ENV = process.env.MPESA_ENV || "sandbox";
const BASE =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export const darajaConfigured = () =>
  Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_PASSKEY &&
      process.env.MPESA_SHORTCODE,
  );

export const paymentAmount = () => Number(process.env.MPESA_AMOUNT || 100);

let tokenCache = { value: null, expires: 0 };

async function getAccessToken() {
  if (tokenCache.value && Date.now() < tokenCache.expires) return tokenCache.value;
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString("base64");
  const res = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`M-Pesa auth failed: ${JSON.stringify(data)}`);
  }
  tokenCache = {
    value: data.access_token,
    expires: Date.now() + ((data.expires_in || 3600) - 10) * 1000,
  };
  return tokenCache.value;
}

const timestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
};

export const normalizePhone = (phone) => {
  let p = String(phone).replace(/\D/g, "");
  if (p.startsWith("0")) p = "254" + p.slice(1);
  else if (p.startsWith("7")) p = "254" + p;
  else if (!p.startsWith("254")) p = "254" + p;
  return p;
};

// Returns the raw Daraja response: { ResponseCode, ResponseDescription, MerchantRequestID, CheckoutRequestID, ... }
export async function stkPush({ phone, amount, accountRef, callbackUrl }) {
  if (!darajaConfigured()) throw new Error("M-Pesa is not configured on the server");
  const token = await getAccessToken();
  const shortCode = process.env.MPESA_SHORTCODE;
  const ts = timestamp();
  const password = Buffer.from(`${shortCode}${process.env.MPESA_PASSKEY}${ts}`).toString("base64");

  const body = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: ts,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: shortCode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl || process.env.MPESA_CALLBACK_URL || "",
    AccountReference: accountRef,
    TransactionDesc: "Kenya Math Quest registration",
  };

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`M-Pesa STK failed: ${JSON.stringify(data)}`);
  return data;
}

// Confirms the real transaction status from Safaricom using the STK Query API.
// Used to validate callbacks so a forged callback can never mark a payment paid.
export async function stkQuery({ checkoutRequestId }) {
  if (!darajaConfigured()) throw new Error("M-Pesa is not configured on the server");
  const token = await getAccessToken();
  const shortCode = process.env.MPESA_SHORTCODE;
  const ts = timestamp();
  const password = Buffer.from(`${shortCode}${process.env.MPESA_PASSKEY}${ts}`).toString("base64");

  const body = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: ts,
    CheckoutRequestID: checkoutRequestId,
  };

  const res = await fetch(`${BASE}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`M-Pesa STK query failed: ${JSON.stringify(data)}`);
  return data;
}

// Converts a Safaricom callback body into a minimal summary (never trusts client data)
export const parseCallback = (body) => {
  const cb = body?.Body?.stkCallback;
  if (!cb) return null;
  let amount = null;
  let mpesaCode = null;
  if (Array.isArray(cb.CallbackMetadata?.Item)) {
    for (const item of cb.CallbackMetadata.Item) {
      if (item.Name === "Amount") amount = item.Value;
      if (item.Name === "MpesaReceiptNumber") mpesaCode = item.Value;
    }
  }
  return {
    merchantRequestId: cb.MerchantRequestID,
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: Number(cb.ResultCode),
    resultDesc: cb.ResultDesc,
    amount,
    mpesaCode,
  };
};
