const COOKIE_NAME = "token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const issueAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
};
