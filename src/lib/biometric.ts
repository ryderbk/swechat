export function isWebAuthnAvailable(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

export async function registerBiometric(): Promise<boolean> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "SweeTalk" },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: "SweeTalk User",
          displayName: "SweeTalk User",
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) return false;
    localStorage.setItem("biometric_credential_id", credential.id);
    return true;
  } catch {
    return false;
  }
}

export async function authenticateBiometric(): Promise<boolean> {
  try {
    const credId = localStorage.getItem("biometric_credential_id");
    const cred = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: credId
          ? [{ id: Uint8Array.from(atob(credId.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)), type: "public-key" }]
          : [],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!cred;
  } catch {
    return false;
  }
}
