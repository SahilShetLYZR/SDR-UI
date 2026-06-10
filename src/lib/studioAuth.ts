// Local Lyzr Studio auth (VITE_LOCAL_STUDIO_AUTH=true).
//
// The lyzr-agent SDK's only sign-in path is a full redirect to
// studio.lyzr.ai/auth/sign-in?redirect=<origin>, and Studio never redirects
// back to a localhost origin — so local sign-in sticks on Studio forever.
//
// This module follows .claude/LYZR_STUDIO_SETUP.md instead: Memberstack
// Google SSO in a POPUP (no cross-domain redirect, works on localhost),
// then Pagos for the API key + user record. Auth only — no agent
// provisioning of any kind.

import memberstackDom from "@memberstack/dom";

const MEMBERSTACK_PUBLIC_KEY = "pk_c14a2728e715d9ea67bf";
const PAGOS_URL = "https://pagos-prod.studio.lyzr.ai";

export interface StudioUser {
  email: string;
  user_id: string;
  organization_ids: string[];
  current_org_id: string;
}

export interface StudioSession {
  apiKey: string;
  user: StudioUser;
  hasJazonAccess: boolean;
}

let ms: ReturnType<typeof memberstackDom.init> | null = null;
const getMemberstack = () => {
  if (!ms) {
    ms = memberstackDom.init({
      publicKey: MEMBERSTACK_PUBLIC_KEY,
      sessionDurationDays: 30,
    });
  }
  return ms;
};

/**
 * Current Memberstack session token, if any. Also honors a ?token=<ms_token>
 * deep link (paste a token from a signed-in studio.lyzr.ai tab as a fallback
 * when the popup is blocked) by persisting it as the session cookie.
 */
export async function getStudioToken(): Promise<string | null> {
  const urlToken = new URLSearchParams(window.location.search).get("token");
  if (urlToken) {
    const expires = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    document.cookie = `_ms-mid=${urlToken};expires=${expires.toUTCString()};path=/`;
    localStorage.setItem("_ms-mid", urlToken);
    return urlToken;
  }
  const token = await getMemberstack().getMemberCookie();
  return token || null;
}

/** Google SSO via Memberstack popup. Resolves once the popup completes. */
export async function loginWithGoogle(): Promise<string | null> {
  await getMemberstack().loginWithProvider({
    provider: "google",
    allowSignup: true,
  });
  return getStudioToken();
}

export async function studioLogout(): Promise<void> {
  try {
    await getMemberstack().logout();
  } finally {
    document.cookie = "_ms-mid=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/";
    localStorage.removeItem("_ms-mid");
  }
}

async function pagosGet(path: string, token: string): Promise<any> {
  const res = await fetch(`${PAGOS_URL}${path}`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`Pagos GET ${path} failed: ${res.status}`);
  return res.json();
}

async function fetchMemberstackId(token: string): Promise<string | null> {
  const res = await fetch("https://client.memberstack.com/member", {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
      "x-api-key": MEMBERSTACK_PUBLIC_KEY,
    },
  });
  const body = await res.json().catch(() => null);
  return body?.data?.id ?? null;
}

/**
 * Fetch the user's Pagos keys. If the member has never been onboarded to
 * Pagos (empty keys), run the save-onboarding bootstrap from the playbook —
 * this provisions org + usage + key only, never agents — and retry.
 */
async function fetchKeysWithBootstrap(token: string): Promise<any[] | null> {
  let keys = await pagosGet("/api/v1/keys/", token).catch(() => null);
  if (Array.isArray(keys) && keys.length > 0) return keys;

  const memberId = await fetchMemberstackId(token);
  if (!memberId) return null;

  await fetch(`${PAGOS_URL}/api/v1/user/save-onboarding`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: memberId, onboarding: {} }),
  }).catch(() => null);

  // Pagos provisioning can be async
  await new Promise((resolve) => setTimeout(resolve, 1200));

  keys = await pagosGet("/api/v1/keys/", token).catch(() => null);
  return Array.isArray(keys) && keys.length > 0 ? keys : null;
}

/** Token -> full session (api key + user + jazon permission). */
export async function buildStudioSession(
  token: string
): Promise<StudioSession | null> {
  const keys = await fetchKeysWithBootstrap(token);
  if (!keys) return null;

  const apiKey: string = keys[0].api_key;
  const data = await pagosGet(
    `/api/v1/keys/user?api_key=${encodeURIComponent(apiKey)}`,
    token
  );
  const u = data?.user;
  if (!u?.email) return null;

  const hasJazonAccess: boolean =
    data?.policy?.permissions?.some(
      (p: any) =>
        p.id === "jazon" &&
        p.type === "app" &&
        p.resource_id === "jazon" &&
        !p.disabled &&
        p.modes?.includes("READ")
    ) ?? false;

  return {
    apiKey,
    user: {
      email: u.email,
      user_id: u.user_id,
      organization_ids: u.organization_ids,
      current_org_id: u.current_org_id,
    },
    hasJazonAccess,
  };
}
