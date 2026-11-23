export interface LoginData {
  username: string;
  password: string;
}

/** Espeja el schema UserCreate del backend. */
export interface RegisterData {
  username: string;
  full_name: string;
  email: string;
  password: string;
}

export interface MensajeResponse {
  message: string;
}
