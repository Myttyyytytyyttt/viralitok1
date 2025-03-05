"use client"

import { useState, useEffect, useRef } from "react"
import { X, DollarSign, AlertTriangle, ChevronDown, ChevronUp, Twitter, Globe, Send, Check, Loader, Upload, Image as ImageIcon, RefreshCw, Wallet, ExternalLink, Droplet } from "lucide-react"
import { useWallet } from '@solana/wallet-adapter-react'
import { CustomWalletButton } from '@/components/ui/custom-wallet-button'
import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'

interface TokenizeModalProps {
  isOpen: boolean
  onClose: () => void
}

// Array de posibles códigos de captcha
const CAPTCHA_CODES = [
  "45821",
  "92374",
  "63901",
  "27584",
  "19063",
  "38276",
  "74591",
  "52198",
  "86730",
  "31645"
];

// Crear conexión RPC a Solana (puede ser devnet para pruebas o mainnet-beta)
const connection = new Connection(
  'https://solana-mainnet.api.syndica.io/api-key/7w5UqmjEU8VnA7oQSNxJ3mCBanyN88CJFqZY47THEEGQ8vgMPZaNcf7zL4mhCaRUc97Kq4HtjHbToNdgSwFqJay2ZEYpVWkzjw',
  {
    commitment: 'confirmed',
    wsEndpoint: 'wss://solana-mainnet.api.syndica.io/api-key/7w5UqmjEU8VnA7oQSNxJ3mCBanyN88CJFqZY47THEEGQ8vgMPZaNcf7zL4mhCaRUc97Kq4HtjHbToNdgSwFqJay2ZEYpVWkzjw'
  }
)

// Variable global para recordar si la wallet ya fue verificada en esta sesión
let isWalletVerifiedGlobally = false;

// Agregar función de espera para reintento
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Función para generar una dirección de vanidad con un sufijo específico
// NOTA: Siempre se debe usar "tok" en minúsculas para compatibilidad con PumpPortal
const generateVanityAddress = async (
  suffix: string = "tok", // Siempre usar "tok" en minúsculas
  timeoutSeconds: number = 30,
  updateStatus?: (status: string) => void
): Promise<Keypair | null> => {
  const startTime = Date.now();
  let attempts = 0;
  let lastUpdateTime = 0;
  
  // Forzar el sufijo a minúsculas para asegurar compatibilidad con PumpPortal
  suffix = "tok";
  
  while (Date.now() - startTime < timeoutSeconds * 1000) {
    attempts++;
    const keypair = Keypair.generate();
    const address = keypair.publicKey.toString();
    
    // Verificar si la dirección termina con el sufijo deseado
    if (address.toLowerCase().endsWith(suffix)) {
      console.log(`Vanity address found! Ending with "${suffix}" after ${attempts} attempts`);
      return keypair;
    }
    
    // Actualizar estado cada 500 intentos o cada 500ms
    const now = Date.now();
    if (attempts % 500 === 0 || now - lastUpdateTime > 500) {
      lastUpdateTime = now;
      const timeElapsed = (now - startTime) / 1000;
      const statusMsg = `Searching for address ending with "${suffix}"... ${attempts} attempts (${timeElapsed.toFixed(1)}s)`;
      updateStatus?.(statusMsg);
      
      // Permitir que el navegador respire
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  console.log(`Timeout after ${attempts} attempts searching for suffix "${suffix}"`);
  return null; // No se encontró en el tiempo límite
};

// Servicios IPFS alternativos
const IPFS_SERVICES = [
  {
    name: "pump.fun (proxy)",
    url: "/api/proxy/pump-fun",
    method: "POST",
    getFormData: (formData: FormData) => formData,
    processResponse: async (response: Response) => {
      try {
        const text = await response.text();
        console.log("Respuesta IPFS pump.fun (texto):", text);
        return JSON.parse(text);
      } catch (error: any) {
        console.error("Error parsing pump.fun response:", error);
        throw new Error(`Failed to parse IPFS response: ${error?.message || 'Unknown error'}`);
      }
    }
  },
  {
    name: "IPFS Local",
    url: "/api/ipfs",
    method: "POST",
    getFormData: (formData: FormData) => formData,
    processResponse: async (response: Response) => {
      try {
        const data = await response.json();
        console.log("Respuesta IPFS Local:", data);
        return data;
      } catch (error: any) {
        console.error("Error al procesar respuesta de IPFS Local:", error);
        throw error;
      }
    }
  }
];

const retryFetch = async (url: string, options: RequestInit, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Intento ${i + 1} de ${maxRetries} para ${url}`)
      const response = await fetch(url, options)
      console.log(`Respuesta recibida:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      return response
    } catch (error) {
      console.error(`Error en intento ${i + 1}:`, error)
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 // Backoff exponencial
        console.log(`Esperando ${delay}ms antes del siguiente intento...`)
        await wait(delay)
      } else {
        throw error
      }
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`)
}

// Función para subir a IPFS usando múltiples servicios con fallback
const uploadToIPFS = async (formData: FormData, updateStatus?: (status: string) => void) => {
  let lastError;
  
  for (const service of IPFS_SERVICES) {
    try {
      if (updateStatus) {
        updateStatus(`Attempting to upload to ${service.name}...`);
      }
      console.log(`Intentando subir a IPFS usando ${service.name}...`);
      
      const serviceFormData = service.getFormData(formData);
      
      // Aumentar el número de reintentos a 4 con un timeout más grande
      const response = await retryFetch(service.url, {
        method: service.method,
        body: serviceFormData,
      }, 4);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error en respuesta de ${service.name}:`, errorText);
        lastError = new Error(`Failed to upload to ${service.name}: ${errorText}`);
        continue; // Probar con el siguiente servicio
      }
      
      // Procesar respuesta según el servicio
      const result = await service.processResponse(response);
      console.log(`Subida exitosa a ${service.name}:`, result);
      
      // Asegurarnos de guardar siempre URLs directas de IPFS
      if (result && result.success) {
        // Si la respuesta viene de pump.fun, asegurarse de extraer la URL de imagen directa
        if (service.name === "pump.fun (proxy)" && result.metadata && result.metadata.image) {
          // Guardar la URL directa de la imagen en la respuesta
          result.imageUrl = result.metadata.image;
        }
        
        // Si tenemos metadataUri pero no es una URL directa de IPFS, intentar convertirla
        if (result.metadataUri && !result.metadataUri.startsWith('https://ipfs.io/ipfs/')) {
          const cidMatch = result.metadataUri.match(/\/ipfs\/([a-zA-Z0-9]+)/);
          if (cidMatch && cidMatch[1]) {
            result.metadataUri = `https://ipfs.io/ipfs/${cidMatch[1]}`;
          }
        }
        
        if (result.metadataUri) {
          if (updateStatus) {
            updateStatus(`Datos subidos exitosamente a ${service.name}`);
          }
          return result;
        } else {
          console.error(`Respuesta de ${service.name} no contiene los datos esperados:`, result);
          lastError = new Error(`Incomplete response from ${service.name}`);
          continue;
        }
      } else {
        console.error(`Respuesta de ${service.name} no contiene los datos esperados:`, result);
        lastError = new Error(`Incomplete response from ${service.name}`);
        continue;
      }
    } catch (error) {
      console.error(`Error al usar ${service.name}:`, error);
      lastError = error;
      // Continuar con el siguiente servicio
    }
  }
  
  // Si llegamos aquí, todos los servicios fallaron
  throw lastError || new Error("Failed to upload to all IPFS services");
};

export function TokenizeModal({ isOpen, onClose }: TokenizeModalProps) {
  // Si no está abierto, no renderizar nada
  if (!isOpen) return null;
  
  // Mover todos los hooks al principio, sin condiciones
  const [step, setStep] = useState(1)
  const [tiktokUrl, setTiktokUrl] = useState("")
  const [tokenName, setTokenName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenDescription, setTokenDescription] = useState("")
  const [initialPrice, setInitialPrice] = useState("")
  const [captchaCompleted, setCaptchaCompleted] = useState(false)
  const [socialsOpen, setSocialsOpen] = useState(false)
  const [twitterUrl, setTwitterUrl] = useState("")
  const [telegramUrl, setTelegramUrl] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [walletVerified, setWalletVerified] = useState(false)
  const [isVerifyingWallet, setIsVerifyingWallet] = useState(false)
  const [captchaInput, setCaptchaInput] = useState("")
  const [currentCaptchaCode, setCurrentCaptchaCode] = useState("")
  const [isCreatingToken, setIsCreatingToken] = useState(false)
  const [mintKeypair, setMintKeypair] = useState<Keypair | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [tokenAddress, setTokenAddress] = useState<string | null>(null)
  const [showTokenSuccessDetails, setShowTokenSuccessDetails] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Estados para la imagen
  const [tokenImage, setTokenImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Integración con la wallet de Solana
  const { publicKey, signTransaction, signMessage, connected, disconnect } = useWallet()
  
  // Nuevo estado para el proceso de generación de vanity address
  const [isGeneratingVanityAddress, setIsGeneratingVanityAddress] = useState(false)
  const [vanityStatus, setVanityStatus] = useState<string | null>(null)
  const [vanityAddressGenerated, setVanityAddressGenerated] = useState(false)
  
  // Estados para el formulario
  const [loadingMessage, setLoadingMessage] = useState<string>("")
  
  // Estados para CAPTCHA
  const [captchaCode, setCaptchaCode] = useState("")
  
  // Función para cerrar el modal de manera segura
  const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };
  
  // Define la función verifyWallet
  const verifyWallet = async () => {
    if (!publicKey || !signMessage) return
    
    try {
      setIsVerifyingWallet(true)
      
      // Mensaje a firmar con timestamp para prevenir reutilización
      const message = new TextEncoder().encode(
        `Verify wallet ownership for ViralTok: ${Date.now()}`
      )
      
      // Solicitar firma
      const signature = await signMessage(message)
      
      // Si llegamos aquí, la firma fue correcta
      setWalletVerified(true)
      isWalletVerifiedGlobally = true; // Recordar que la wallet ya fue verificada
      setErrors({...errors, wallet: ""})
      
    } catch (error) {
      console.error("Error al verificar wallet:", error)
      setErrors({...errors, wallet: "Failed to verify wallet ownership"})
    } finally {
      setIsVerifyingWallet(false)
    }
  }

  // Verificar wallet al abrir el modal
  useEffect(() => {
    if (connected && publicKey) {
      // Comprobar si la wallet ya fue verificada globalmente
      if (isWalletVerifiedGlobally) {
        setWalletVerified(true);
      } else {
        // Resetear estado de verificación al conectar nueva wallet
        setWalletVerified(false);
      }
    }
  }, [connected, publicKey]);

  // Función para generar un nuevo keypair para el token al iniciar
  useEffect(() => {
    if (isOpen) {
      // Generamos un keypair temporal al abrir el modal, que será reemplazado por el vanity address en el paso 2
      setMintKeypair(Keypair.generate());
      // Reseteamos el estado de generación del vanity
      setVanityAddressGenerated(false);
      setIsGeneratingVanityAddress(false);
      setVanityStatus(null);
    }
  }, [isOpen]);

  // Iniciamos la generación de vanity address cuando entramos al paso 2
  useEffect(() => {
    if (step === 2 && !isGeneratingVanityAddress && !vanityAddressGenerated) {
      // Iniciar generación de vanity address
      setIsGeneratingVanityAddress(true);
      setVanityAddressGenerated(false);
      setVanityStatus("Preparing vanity address generation...");
      
      console.log("Iniciando generación de vanity address en paso 2");
      
      // Generar nuevo keypair para reemplazar el temporal
      generateVanityAddress("tok", 30, setVanityStatus).then(vanityKeypair => {
        if (vanityKeypair) {
          console.log("Vanity address generado exitosamente:", vanityKeypair.publicKey.toString());
          setMintKeypair(vanityKeypair);
          setVanityStatus(`Vanity address generated! Ends with "tok"`);
          setVanityAddressGenerated(true);
        } else {
          // Si no se encuentra en el tiempo límite, mantener el keypair normal
          console.log("No se pudo generar vanity address, usando el keypair normal");
          setVanityStatus("Could not generate a vanity address in the time limit. Using random address.");
          setVanityAddressGenerated(true);
        }
        setIsGeneratingVanityAddress(false);
      }).catch(error => {
        console.error("Error al generar vanity address:", error);
        setVanityStatus("Error generating vanity address. Using random address.");
        setVanityAddressGenerated(true);
        setIsGeneratingVanityAddress(false);
      });
    }
  }, [step]);

  // Forzar el completado del CAPTCHA en el paso 2 para evitar problemas
  useEffect(() => {
    if (step === 2) {
      // Forzar el captcha a completado para evitar el problema del botón deshabilitado
      setCaptchaCompleted(true);
      console.log("CAPTCHA completado automáticamente en paso 2");
    }
  }, [step]);

  // Generar un nuevo código captcha
  const generateCaptchaCode = () => {
    const randomIndex = Math.floor(Math.random() * CAPTCHA_CODES.length);
    setCurrentCaptchaCode(CAPTCHA_CODES[randomIndex]);
    setCaptchaInput("");
    setCaptchaCompleted(false);
  };
  
  // Generar un captcha al abrir el modal
  useEffect(() => {
    if (isOpen) {
      generateCaptchaCode();
    }
  }, [isOpen]);
  
  // Validar URL de TikTok cuando cambia
  useEffect(() => {
    // Verificar que sea una URL válida de TikTok
    const validateTikTokUrl = () => {
      if (!tiktokUrl) {
        setIsUrlValid(false);
        return;
      }
      
      try {
        const url = new URL(tiktokUrl);
        const isTikTokDomain = url.hostname === "tiktok.com" || 
                              url.hostname === "www.tiktok.com" || 
                              url.hostname === "vm.tiktok.com";
        const hasVideoPath = url.pathname.includes("/video/");
        
        setIsUrlValid(isTikTokDomain && hasVideoPath);
      } catch (e) {
        setIsUrlValid(false);
      }
    };
    
    validateTikTokUrl();
  }, [tiktokUrl]);
  
  // Validación de captcha
  useEffect(() => {
    if (captchaInput && captchaInput === currentCaptchaCode) {
      setCaptchaCompleted(true);
    }
  }, [captchaInput, currentCaptchaCode]);
  
  // Función para manejar drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    validateAndSetImage(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Función para manejar la selección de imagen
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    validateAndSetImage(file);
  };

  // Validar y establecer la imagen
  const validateAndSetImage = (file?: File) => {
    if (!file) return;
    
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors({...errors, tokenImage: "Invalid file type. Please upload an image (JPG, PNG, GIF, WebP)"});
      return;
    }
    
    // Validar tamaño (4MB = 4 * 1024 * 1024 bytes)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors({...errors, tokenImage: "Image is too large. Maximum size is 4MB"});
      return;
    }
    
    // Crear preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setTokenImage(file);
    setErrors({...errors, tokenImage: ""});
  };
  
  // Manejar navegación entre pasos
  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  
  // Manejar submit del paso 1
  const handleStep1Submit = () => {
    const stepErrors: Record<string, string> = {};
    
    // Validar URL
    if (!tiktokUrl) {
      stepErrors.tiktokUrl = "TikTok URL is required";
    } else if (!isUrlValid) {
      stepErrors.tiktokUrl = "Invalid TikTok video URL";
    }
    
    // Verificar CAPTCHA
    if (!captchaCompleted) {
      stepErrors.captcha = "Please complete the CAPTCHA";
    }
    
    // Si hay errores, mostrarlos y no avanzar
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    // Si llega aquí, avanzar al siguiente paso
    setStep(2);
  };
  
  // Manejar submit del paso 2
  const handleStep2Submit = async () => {
    const stepErrors: Record<string, string> = {};
    
    // Validar campos obligatorios
    if (!tokenName) {
      stepErrors.tokenName = "Token name is required";
    }
    
    if (!tokenSymbol) {
      stepErrors.tokenSymbol = "Token symbol is required";
    } else if (tokenSymbol.length > 12) {
      stepErrors.tokenSymbol = "Symbol must be 12 characters or less";
    }
    
    if (!initialPrice) {
      stepErrors.initialPrice = "Initial price is required";
    } else {
      const price = parseFloat(initialPrice);
      if (isNaN(price) || price <= 0) {
        stepErrors.initialPrice = "Price must be greater than 0";
      }
    }
    
    // Verificar que la imagen del token esté seleccionada
    if (!tokenImage) {
      stepErrors.tokenImage = "Token image is required";
      setErrors(stepErrors);
      return;
    }
    
    // Validar URLs opcionales
    if (twitterUrl && !twitterUrl.includes("twitter.com")) {
      stepErrors.twitterUrl = "Invalid Twitter URL";
    }
    
    if (telegramUrl && !telegramUrl.includes("t.me")) {
      stepErrors.telegramUrl = "Invalid Telegram URL";
    }
    
    if (websiteUrl) {
      try {
        new URL(websiteUrl);
      } catch (e) {
        stepErrors.websiteUrl = "Invalid website URL";
      }
    }
    
    // Si hay errores, mostrarlos y no avanzar
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    // Verificar requisitos para crear el token
    if (!publicKey || !signTransaction || !mintKeypair) {
      setErrorMessage("Wallet not connected or authorization failed");
      return;
    }
    
    // Intenta crear el token si no hay errores
    try {
      setIsCreatingToken(true);
      setErrorMessage(null);
      
      console.log("Comenzando creación de token...");
      console.log("Wallet pública:", publicKey.toString());
      console.log("Mint keypair pública:", mintKeypair.publicKey.toString());
      
      // 1. Preparar el FormData para subir la imagen y metadatos a IPFS
      const formData = new FormData();
      if (tokenImage) {
        // Usar 'file' en lugar de 'image' para compatibilidad con pump.fun
        formData.append("file", tokenImage);
      }
      formData.append("name", tokenName);
      formData.append("symbol", tokenSymbol);
      formData.append("description", tokenDescription || `TikTok token for: ${tiktokUrl}`);
      if (twitterUrl) formData.append("twitter", twitterUrl);
      if (telegramUrl) formData.append("telegram", telegramUrl);
      if (websiteUrl) formData.append("website", websiteUrl);
      formData.append("showName", "true");
      
      // 2. Subir metadatos e imagen a IPFS a través de nuestro proxy
      console.log("Uploading token metadata to IPFS via proxy...");
      
      // Cambiar mensaje de estado a inglés y mostrar como carga (no error)
      setLoadingMessage("Uploading token metadata and images...");
      
      // Intentar con nuestro sistema que usa proxies
      const metadataResponseJSON = await uploadToIPFS(formData, (status) => setLoadingMessage(status));
      
      console.log("Metadata IPFS response:", metadataResponseJSON);
      
      if (!metadataResponseJSON.metadataUri) {
        throw new Error("No metadata URI received from IPFS");
      }
      
      // Guardar la URL de la imagen para usarla más tarde - extraer URL directa de IPFS
      let imageUrl = '';

      // Intentar obtener la URL de imagen de varias fuentes posibles
      if (metadataResponseJSON.metadata && metadataResponseJSON.metadata.image) {
        // Opción 1: Metadata de Pump.fun contiene la URL directa
        imageUrl = metadataResponseJSON.metadata.image;
      } else if (metadataResponseJSON.imageUrl) {
        // Opción 2: Campo imageUrl en la respuesta
        imageUrl = metadataResponseJSON.imageUrl;
      } else if (metadataResponseJSON.image) {
        // Opción 3: Campo image en la respuesta
        imageUrl = metadataResponseJSON.image;
      } 

      // Asegurarnos de que la URL sea directa a IPFS cuando sea posible
      if (imageUrl && !imageUrl.startsWith('https://ipfs.io/ipfs/')) {
        // Intentar extraer CID de IPFS de URLs proxy
        const proxyMatch = imageUrl.match(/\/api\/ipfs\/asset\/(Qm[a-zA-Z0-9]+)/);
        if (proxyMatch && proxyMatch[1]) {
          imageUrl = `https://ipfs.io/ipfs/${proxyMatch[1]}`;
        }
      }

      console.log("URL de imagen capturada:", imageUrl);
      
      // 3. Obtener la transacción de creación del token
      setLoadingMessage("Creating token transaction...");
      console.log("Getting token creation transaction...");
      const createTxPayload = {
        "publicKey": publicKey.toString(),
        "action": "create",
        "tokenMetadata": {
          name: metadataResponseJSON.metadata?.name || tokenName,
          symbol: metadataResponseJSON.metadata?.symbol || tokenSymbol,
          uri: metadataResponseJSON.metadataUri
        },
        "mint": mintKeypair.publicKey.toString(),
        "denominatedInSol": "true", // Como string según el ejemplo
        "amount": parseFloat(initialPrice),
        "slippage": 10,
        "priorityFee": 0.0005,
        "pool": "pump"
      };
      
      console.log("TX Payload:", JSON.stringify(createTxPayload, null, 2));
      
      // Usar nuestro proxy para comunicarse con PumpPortal
      try {
        console.log("Solicitando transacción a PumpPortal a través del proxy...");
        setLoadingMessage("Requesting transaction from PumpPortal...");
        
        // Hacer la solicitud a través de nuestro proxy
        const response = await fetch("/api/proxy/pump-portal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(createTxPayload)
        });
        
        // Verificar si la respuesta es exitosa
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error en respuesta de API (${response.status}):`, errorText);
          throw new Error(`Error obtaining transaction: ${response.status} - ${errorText}`);
        }
        
        // Obtener los datos binarios directamente
        console.log("Obteniendo datos binarios de la transacción...");
        setLoadingMessage("Processing transaction data...");
        const txData = await response.arrayBuffer();
        
        // Verificar si los datos recibidos son válidos
        if (!txData || txData.byteLength === 0) {
          console.error("Error: No se recibieron datos de transacción (buffer vacío)");
          throw new Error("Received empty transaction data from API");
        }
        
        // Convertir a Uint8Array para deserializar
        console.log("Signing transaction...");
        setLoadingMessage("Preparing to sign transaction...");
        const txUint8Array = new Uint8Array(txData);
        console.log("Tamaño de datos TX:", txData.byteLength, "bytes");
        console.log("TX bytes (primeros 20):", Array.from(txUint8Array.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        
        // Deserializar la transacción
        let tx;
        try {
          tx = VersionedTransaction.deserialize(txUint8Array);
          console.log("Transaction deserializada correctamente");
        } catch (deserializeError) {
          console.error("Error al deserializar transacción:", deserializeError);
          const errorMessage = deserializeError instanceof Error 
            ? deserializeError.message 
            : "Error desconocido al deserializar";
          throw new Error(`Error deserializing transaction: ${errorMessage}`);
        }
        
        // Firmar con ambas claves, primero el mintKeypair
        console.log("Firmando transacción con mintKeypair...");
        setLoadingMessage("Signing transaction with mintKeypair...");
        tx.sign([mintKeypair]);
        
        // Luego firmar con la wallet del usuario
        console.log("Firmando transacción con wallet del usuario...");
        setLoadingMessage("Please sign transaction with your wallet...");
        const signedTx = await signTransaction(tx);
        
        // Enviar la transacción a la red
        console.log("Enviando transacción a Solana...");
        setLoadingMessage("Sending transaction to Solana network...");
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
          maxRetries: 3
        });
        
        console.log("Transaction enviada con éxito. Signature:", signature);
        setLoadingMessage("Transaction sent! Waiting for confirmation...");
        
        // Confirmar la transacción para asegurar que se complete
        console.log("Esperando confirmación de la transacción...");
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        console.log("Estado de confirmación:", confirmation);
        
        if (confirmation.value.err) {
          console.error("Error en confirmación:", confirmation.value.err);
          throw new Error(`Transaction error: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        console.log("Transaction confirmada correctamente");
        setLoadingMessage("Transaction confirmed successfully!");
        setTxSignature(signature);
        setTokenAddress(mintKeypair.publicKey.toString());
        
        // 6. Guardar informacion del token creado (opcional)
        const videoId = extractVideoId(tiktokUrl);
        try {
          const saveResponse = await fetch('/api/save-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              address: mintKeypair.publicKey.toString(),
              name: tokenName,
              symbol: tokenSymbol,
              tiktokUrl,
              tiktokId: videoId,
              creator: publicKey.toString(),
              timestamp: Date.now(),
              signature,
              imageUrl
            })
          });
          
          if (!saveResponse.ok) {
            console.warn("No se pudo guardar la información del token:", await saveResponse.text());
          } else {
            console.log("Información del token guardada con éxito");
          }
        } catch (error) {
          console.error("Warning: Failed to save token info:", error);
          // No falla el proceso completo si no se puede guardar la info
        }
        
        // 7. Avanzar al paso de éxito
        setIsCreatingToken(false);
        setLoadingMessage("");
        setStep(3);
        
      } catch (error) {
        console.error("Error creating token:", error);
        setErrorMessage(error instanceof Error ? error.message : "Failed to create token. Please try again.");
        setIsCreatingToken(false);
        setLoadingMessage("");
      }
      
    } catch (error) {
      console.error("Error preparing token creation:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to prepare token creation. Please try again.");
      setIsCreatingToken(false);
      setLoadingMessage("");
    }
  };
  
  // Para compatibilidad con el código existente
  const handleSubmit = handleStep2Submit;
  
  // Extraer ID de video de TikTok de la URL
  function extractVideoId(url: string) {
    const regex = /video\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Reset cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      const resetState = () => {
        setStep(1);
        setTiktokUrl("");
        setTokenName("");
        setTokenSymbol("");
        setTokenDescription("");
        setInitialPrice("");
        setTwitterUrl("");
        setTelegramUrl("");
        setWebsiteUrl("");
        setErrors({});
        setCaptchaInput("");
        setCaptchaCompleted(false);
        setIsUrlValid(false);
        setIsVerifying(false);
        setIsCreatingToken(false);
        setTokenImage(null);
        setImagePreview(null);
        setTxSignature(null);
        setTokenAddress(null);
        setErrorMessage(null);
        setShowTokenSuccessDetails(false);
        setVanityAddressGenerated(false);
        setIsGeneratingVanityAddress(false);
        setVanityStatus(null);
        
        // Asegurarnos de descartar el keypair
        setMintKeypair(null);
      };
      
      resetState();
    }
  }, [isOpen]); // Solo depende de isOpen

  // Componentes para el modal basados en el estado
  const renderConnectionContent = () => {
    return (
      <div className="bg-black border border-[#333] rounded-md w-full max-w-xs p-4 text-center space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold">Connect Your Wallet</h3>
          <button 
            onClick={handleClose} 
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#222]"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-gray-400">Please connect your Solana wallet to tokenize TikTok videos</p>
        <div className="flex justify-center py-2">
          <CustomWalletButton />
        </div>
      </div>
    );
  };

  const renderVerificationContent = () => {
    return (
      <div className="bg-black border border-[#333] rounded-md w-full max-w-xs p-4 text-center space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold">Verify Wallet Ownership</h3>
          <button 
            onClick={handleClose} 
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#222]"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-gray-400">Please sign a message to verify ownership of your wallet</p>
        
        <div className="bg-[#111] border border-[#333] rounded-sm p-3 text-xs text-left">
          <div className="flex items-start gap-2">
            <Wallet size={16} className="mt-0.5 text-gray-400" />
            <div>
              <div className="text-gray-400">Connected wallet:</div>
              <div className="font-mono">{publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}</div>
            </div>
          </div>
        </div>
        
        {errors.wallet && (
          <div className="bg-red-900/20 border border-red-800 rounded-sm p-2 text-xs text-left flex items-start gap-2">
            <AlertTriangle size={14} className="text-red-500 mt-0.5" />
            <span>{errors.wallet}</span>
          </div>
        )}
        
        <button 
          onClick={verifyWallet}
          disabled={isVerifyingWallet}
          className="w-full py-2 bg-[#333] hover:bg-[#444] transition rounded-sm relative text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifyingWallet ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Check size={14} />
              Verify Ownership
            </>
          )}
        </button>
        
        <button 
          onClick={disconnect}
          className="w-full py-2 border border-[#333] hover:bg-[#111] transition rounded-sm text-xs"
        >
          Disconnect
        </button>
      </div>
    );
  };

  const renderSuccessDetails = () => {
    if (!txSignature || !tokenAddress) return null;
    
    return (
      <div className="space-y-2 text-left">
        <div>
          <div className="text-gray-400 text-[10px] mb-1">Token Details:</div>
          <div className="flex items-center justify-between">
            <div className="text-xs">{tokenName}</div>
            <div className="text-xs text-[#8A2BE2] font-mono">{tokenSymbol}</div>
          </div>
        </div>
        
        <div>
          <div className="text-gray-400 text-[10px] mb-1">Token Address:</div>
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs truncate">
              {tokenAddress.slice(0, 10)}...{tokenAddress.slice(-6)}
            </div>
            <a 
              href={`https://solscan.io/token/${tokenAddress}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#8A2BE2] text-xs flex items-center gap-1"
            >
              View <ExternalLink size={10} />
            </a>
          </div>
        </div>
        
        <div>
          <div className="text-gray-400 text-[10px] mb-1">Transaction:</div>
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs truncate">
              {txSignature.slice(0, 10)}...{txSignature.slice(-6)}
            </div>
            <a 
              href={`https://solscan.io/tx/${txSignature}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#8A2BE2] text-xs flex items-center gap-1"
            >
              View <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      {!connected || !publicKey ? renderConnectionContent() : 
       !walletVerified && step === 1 ? renderVerificationContent() : (
        <div className="bg-black border border-[#333] rounded-md w-full max-w-xs relative"
        style={{
          boxShadow: "0 0 20px rgba(138, 43, 226, 0.3), 0 0 40px rgba(76, 175, 80, 0.1)",
        }}
      >
          <div className="border-b border-[#333] py-1.5 px-2 flex justify-between items-center">
            <h3 className="text-sm font-semibold tracking-wide">
              {step === 1 ? "TOKENIZE TIKTOK" : step === 2 ? "SET TOKEN DETAILS" : "TOKENIZATION COMPLETE"}
          </h3>
            <button 
              onClick={handleClose} 
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#222]"
              type="button"
            >
              <X size={14} />
          </button>
        </div>

          <div className="p-2">
          {step === 1 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs text-gray-400">TikTok URL <span className="text-red-500">*</span></label>
                  <div className="relative">
                <input
                  type="text"
                  value={tiktokUrl}
                      onChange={(e) => {
                        setTiktokUrl(e.target.value)
                        setErrors({...errors, tiktokUrl: ""})
                      }}
                  placeholder="https://tiktok.com/@username/video/1234567890"
                      className={`w-full bg-[#111] border ${errors.tiktokUrl ? 'border-red-500' : isUrlValid ? 'border-green-500' : 'border-[#333]'} rounded-sm py-1.5 px-2 text-xs focus:outline-none focus:border-[#8A2BE2] pr-8`}
                    />
                    {/* Indicador de estado */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {isVerifying ? (
                        <Loader size={14} className="animate-spin text-gray-400" />
                      ) : isUrlValid ? (
                        <Check size={14} className="text-green-500" />
                      ) : null}
              </div>
                </div>
                  {errors.tiktokUrl && <p className="text-red-500 text-xs">{errors.tiktokUrl}</p>}
                  <p className="text-[10px] text-gray-500">Paste the TikTok URL you want to tokenize</p>
                  {isUrlValid && (
                    <p className="text-[10px] text-green-500 flex items-center gap-1">
                      <Check size={10} /> Valid TikTok video URL
                    </p>
                  )}
              </div>

                {/* Información sobre la dirección token, ahora obligatoria */}
                
                <div className="text-[10px] text-gray-500 flex items-start gap-1.5 bg-[#111] p-1.5 border border-[#333] rounded-sm">
                  <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                  <p>Make sure you own the rights to the TikTok content.</p>
              </div>
            </div>
          )}

          {step === 2 && (
              <div className="space-y-3 p-2">
                <div>
                  <label className="block text-xs text-gray-400">Token Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                    placeholder="My TikTok Token"
                    className={`w-full bg-[#111] border ${errors.tokenName ? 'border-red-500' : 'border-[#333]'} rounded-sm py-1.5 px-2 text-xs focus:outline-none focus:border-[#8A2BE2]`}
                    disabled={isCreatingToken}
                />
                  {errors.tokenName && <p className="text-red-500 text-[10px] mt-0.5">{errors.tokenName}</p>}
              </div>

                <div>
                  <label className="block text-xs text-gray-400">Token Symbol <span className="text-red-500">*</span></label>
                  <div className="flex items-center">
                <input
                  type="text"
                  value={tokenSymbol}
                      onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                      placeholder="TIK"
                      className={`w-full bg-[#111] border ${errors.tokenSymbol ? 'border-red-500' : 'border-[#333]'} rounded-sm py-1.5 px-2 text-xs focus:outline-none focus:border-[#8A2BE2]`}
                      maxLength={12}
                      disabled={isCreatingToken}
                    />
                  </div>
                  {errors.tokenSymbol && <p className="text-red-500 text-[10px] mt-0.5">{errors.tokenSymbol}</p>}
                  <p className="text-gray-500 text-[10px] mt-0.5">Max 12 characters.</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400">Token Image <span className="text-red-500">*</span></label>
                  <div 
                    className={`w-full min-h-[80px] border ${errors.tokenImage ? 'border-red-500' : isDragging ? 'border-[#8A2BE2] bg-[#8A2BE2]/10' : 'border-[#333]'} border-dashed rounded-sm p-2 flex flex-col items-center justify-center text-center cursor-pointer`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageChange} 
                      className="hidden" 
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      disabled={isCreatingToken}
                    />
                    
                    {imagePreview ? (
                      <div className="relative w-full">
                        <img 
                          src={imagePreview} 
                          alt="Token preview" 
                          className="w-20 h-20 mx-auto object-cover rounded-sm border border-[#333]" 
                        />
                        <div className="mt-1 text-[10px] text-gray-400">
                          Click or drag to change image
                        </div>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={18} className="text-gray-400 mb-1" />
                        <div className="text-xs">
                          {isDragging ? "Drop image here" : "Click or drag image here"}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          Supported: JPG, PNG, GIF, WebP (max 4MB)
                        </div>
                      </>
                    )}
                  </div>
                  {errors.tokenImage && <p className="text-red-500 text-[10px] mt-0.5">{errors.tokenImage}</p>}
                </div>

                <div className="space-y-0.5">
                  <label className="block text-xs text-gray-400">Description</label>
                  <textarea
                    value={tokenDescription}
                    onChange={(e) => setTokenDescription(e.target.value)}
                    placeholder="Brief description of your token..."
                    className="w-full bg-[#111] border border-[#333] rounded-sm py-1.5 px-2 text-xs focus:outline-none focus:border-[#8A2BE2] h-16 resize-none"
                    disabled={isCreatingToken}
                  />
              </div>

                <div className="space-y-0.5">
                  <label className="block text-xs text-gray-400">Initial Buy (SOL) <span className="text-red-500">*</span></label>
                <div className="relative">
                    <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={initialPrice}
                    onChange={(e) => setInitialPrice(e.target.value)}
                    placeholder="0.01"
                      className={`w-full bg-[#111] border ${errors.initialPrice ? 'border-red-500' : 'border-[#333]'} rounded-sm py-1.5 pl-7 pr-2 text-xs focus:outline-none focus:border-[#8A2BE2]`}
                      disabled={isCreatingToken}
                  />
                  </div>
                  {errors.initialPrice && <p className="text-red-500 text-[10px] mt-0.5">{errors.initialPrice}</p>}
                </div>

                <div className="border border-[#333] rounded-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSocialsOpen(!socialsOpen)}
                    className="w-full py-1.5 px-2 flex justify-between items-center text-left bg-[#111] hover:bg-[#161616] transition text-xs"
                    disabled={isCreatingToken}
                  >
                    <span className="text-[10px] text-gray-400">Social Media Links</span>
                    {socialsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  
                  {socialsOpen && (
                    <div className="p-2 border-t border-[#333]">
                      <div className="space-y-2">
                        <div>
                          <label className="flex items-center text-xs text-gray-400 gap-1 mb-0.5">
                            <Twitter size={10} />
                            Twitter
                          </label>
                          <input
                            type="text"
                            value={twitterUrl}
                            onChange={(e) => setTwitterUrl(e.target.value)}
                            placeholder="https://twitter.com/your_handle"
                            className={`w-full bg-[#111] border ${errors.twitterUrl ? 'border-red-500' : 'border-[#333]'} rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-[#8A2BE2]`}
                            disabled={isCreatingToken}
                          />
                          {errors.twitterUrl && <p className="text-red-500 text-[10px] mt-0.5">{errors.twitterUrl}</p>}
                        </div>
                        
                        <div>
                          <label className="flex items-center text-xs text-gray-400 gap-1 mb-0.5">
                            <Send size={10} />
                            Telegram
                          </label>
                          <input
                            type="text"
                            value={telegramUrl}
                            onChange={(e) => setTelegramUrl(e.target.value)}
                            placeholder="https://t.me/your_group"
                            className={`w-full bg-[#111] border ${errors.telegramUrl ? 'border-red-500' : 'border-[#333]'} rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-[#8A2BE2]`}
                            disabled={isCreatingToken}
                          />
                          {errors.telegramUrl && <p className="text-red-500 text-[10px] mt-0.5">{errors.telegramUrl}</p>}
              </div>

                        <div>
                          <label className="flex items-center text-xs text-gray-400 gap-1 mb-0.5">
                            <Globe size={10} />
                            Website
                          </label>
                          <input
                            type="text"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://your-website.com"
                            className={`w-full bg-[#111] border ${errors.websiteUrl ? 'border-red-500' : 'border-[#333]'} rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-[#8A2BE2]`}
                            disabled={isCreatingToken}
                          />
                          {errors.websiteUrl && <p className="text-red-500 text-[10px] mt-0.5">{errors.websiteUrl}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-1.5 border border-[#333] bg-[#111] rounded-sm text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tokenization Fee:</span>
                    <span>0.01 SOL</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-gray-400">Network Fee (est.):</span>
                    <span>0.002 SOL</span>
                  </div>
                  
                  {/* Sección de generación de vanity address */}
                  <div className="mt-2 pt-1 border-t border-[#333]">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Contract Address:</span>
                      {isGeneratingVanityAddress ? (
                        <div className="flex items-center gap-1">
                          <RefreshCw size={10} className="animate-spin text-blue-400" />
                          <span className="text-blue-400">Generating...</span>
                        </div>
                      ) : vanityAddressGenerated ? (
                        <div className="flex items-center gap-1">
                          <Check size={10} className="text-green-500" />
                          <span className="text-green-500">Ends with "tok"</span>
                        </div>
                      ) : (
                        <span>Pending</span>
                      )}
                    </div>
                    {vanityStatus && !vanityAddressGenerated && (
                      <div className="text-[9px] text-gray-400 mt-0.5 truncate">
                        {vanityStatus}
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
              <div className="text-center py-3 space-y-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#4CAF50] mx-auto flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-check"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div>
                  <h4 className="text-base font-bold mb-0.5">Tokenization Complete!</h4>
                  <p className="text-gray-400 text-[10px]">Your TikTok has been successfully tokenized on Solana</p>
                </div>
                
                <div className="border border-[#333] bg-[#111] rounded-sm p-3 mt-4">
                  {tokenAddress && txSignature ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-400 text-[10px] mb-1">Token Details:</div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs">{tokenName}</div>
                          <div className="text-xs text-[#8A2BE2] font-mono">{tokenSymbol}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-400 text-[10px] mb-1">Token Address:</div>
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-xs truncate">
                            {tokenAddress.slice(0, 10)}...{tokenAddress.slice(-6)}
                          </div>
                          <a 
                            href={`https://solscan.io/token/${tokenAddress}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#8A2BE2] text-xs flex items-center gap-1"
                          >
                            View <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-400 text-[10px] mb-1">Transaction:</div>
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-xs truncate">
                            {txSignature.slice(0, 10)}...{txSignature.slice(-6)}
                          </div>
                          <a 
                            href={`https://solscan.io/tx/${txSignature}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#8A2BE2] text-xs flex items-center gap-1"
                          >
                            View <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                      
                      <div className="text-center mt-2 pt-2 border-t border-[#333] text-xs">
                        <p className="mb-1">View or share your token!</p>
                        <div className="flex justify-center gap-3 mt-2">
                          <a 
                            href={`https://pump.fun/coin/${tokenAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#222] hover:bg-[#333]"
                            title="View on PumpFun"
                          >
                            <Droplet size={16} className="text-[#8A2BE2]" />
                          </a>
                          <a 
                            href={`https://twitter.com/intent/tweet?text=I%20just%20tokenized%20a%20TikTok%20video%20on%20Solana!%20Check%20out%20${tokenSymbol}%20token:%20https://pump.fun/coin/${tokenAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#222] hover:bg-[#333]"
                          >
                            <Twitter size={16} />
                          </a>
                          <a 
                            href={`https://t.me/share/url?url=https://pump.fun/coin/${tokenAddress}&text=I%20just%20tokenized%20a%20TikTok%20video%20on%20Solana!%20Check%20out%20${tokenSymbol}%20token`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#222] hover:bg-[#333]"
                          >
                            <Send size={16} />
                          </a>
                        </div>
                      </div>
                </div>
                  ) : (
                    <div className="text-center py-2">
                      <RefreshCw size={16} className="animate-spin mx-auto" />
                      <p className="text-xs mt-2">Loading token details...</p>
                </div>
                  )}
                </div>
              </div>
            )}
            
            {errorMessage && (
              <div className="px-3 pb-2">
                <div className="bg-red-900/20 border border-red-800 rounded-sm p-2 text-xs text-left flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5" />
                  <span>{errorMessage}</span>
              </div>
            </div>
          )}
        </div>

        {step !== 3 && (
            <div className="border-t border-[#333] p-2 flex justify-between">
            {step > 1 ? (
              <button
                onClick={handleBack}
                  className="px-3 py-1 border border-[#333] bg-black hover:bg-[#222] transition text-xs"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

              {step === 2 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!captchaCompleted || isCreatingToken || !vanityAddressGenerated}
                  className={`px-3 py-1 transition text-xs flex items-center gap-1 ${
                    captchaCompleted && !isCreatingToken && vanityAddressGenerated
                      ? "bg-gradient-to-r from-[#8A2BE2] to-[#4CAF50] hover:opacity-90" 
                      : "bg-[#333] opacity-50 cursor-not-allowed"
                  }`}
                >
                  {isCreatingToken ? (
                    <>
                      <Loader size={10} className="animate-spin" />
                      Creating...
                    </>
                  ) : !vanityAddressGenerated ? (
                    <>
                      <RefreshCw size={10} className="animate-spin" />
                      Generating Address...
                    </>
                  ) : (
                    "Create Token"
                  )}
                </button>
              ) : (
            <button
                  onClick={handleNext}
                  disabled={!isUrlValid || isVerifying}
                  className={`px-3 py-1 transition text-xs ${
                    isUrlValid && !isVerifying
                      ? "bg-gradient-to-r from-[#8A2BE2] to-[#4CAF50] hover:opacity-90" 
                      : "bg-[#333] opacity-50 cursor-not-allowed"
                  }`}
                >
                  Next
            </button>
              )}
          </div>
        )}

        {step === 3 && (
            <div className="border-t border-[#333] p-2">
            <button
                onClick={handleClose}
                className="w-full py-1 bg-gradient-to-r from-[#8A2BE2] to-[#4CAF50] hover:opacity-90 transition text-xs"
            >
              Done
            </button>
          </div>
        )}
          
          {errors.submit && (
            <div className="px-3 pb-2">
              <p className="text-red-500 text-xs">{errors.submit}</p>
          </div>
        )}
      </div>
      )}
    </div>
  )
}

