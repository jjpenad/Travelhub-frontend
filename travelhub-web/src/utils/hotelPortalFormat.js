/** Nombre corto para saludo desde correo (demo hasta perfil API). */
export function welcomeNameFromEmail(email) {
  if (!email || typeof email !== "string") return "Usuario";
  const local = email.split("@")[0]?.trim() || "";
  const part = local.split(/[._-]/)[0] || local;
  if (!part) return "Usuario";
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

/** Nombre legible para la barra lateral (segmentos del local-part del email). */
export function displayNameFromEmail(email) {
  if (!email || typeof email !== "string") return "Administrador";
  const local = email.split("@")[0]?.trim() || "";
  const words = local.split(/[._-]+/).filter(Boolean);
  if (!words.length) return "Administrador";
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
