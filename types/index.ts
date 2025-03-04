// Interfaz para los datos de los tokens
export interface TokenData {
  address: string;
  name: string;
  symbol: string;
  tiktokUrl: string;
  tiktokId: string | null;
  creator: string;
  timestamp: number;
  signature: string;
  imageUrl?: string; // URL de la imagen
} 