import { API_PREFIX } from "../../shared/constants.js";

export const API_URL = (import.meta.env.VITE_API_URL || API_PREFIX).replace(/\/$/, "");

const API_ORIGIN = API_URL.startsWith("http") ? new URL(API_URL).origin : "";

export function assetUrl(value) {
  if (!value || value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${API_ORIGIN}${value}`;
}
