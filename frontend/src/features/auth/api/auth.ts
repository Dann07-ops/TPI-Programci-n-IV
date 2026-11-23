import { api } from "../../../shared/api/axiosInstance";
import type { Usuario } from "../../usuarios/types/usuario";
import type { LoginData, MensajeResponse, RegisterData } from "../types/auth";

export async function loginRequest({ username, password }: LoginData): Promise<MensajeResponse> {
  // OAuth2 exige formulario (application/x-www-form-urlencoded), no JSON
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  const { data } = await api.post<MensajeResponse>("/auth/token", form);
  return data;
}

export async function registerRequest(datos: RegisterData): Promise<Usuario> {
  const { data } = await api.post<Usuario>("/auth/register", datos);
  return data;
}

export async function logoutRequest(): Promise<MensajeResponse> {
  const { data } = await api.post<MensajeResponse>("/auth/logout");
  return data;
}

export async function meRequest(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/auth/me");
  return data;
}
