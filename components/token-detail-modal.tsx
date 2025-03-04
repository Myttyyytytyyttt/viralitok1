"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, DollarSign, ChevronDown, Settings, ArrowUpDown, Maximize2, RefreshCw, LineChart, Eye, Clipboard, Check, Loader2 } from "lucide-react"
import { TokenData } from "@/types"
import { toast } from "sonner"
import * as web3 from "@solana/web3.js"
import bs58 from "bs58"

// Define la interfaz para Window con la propiedad solana para TypeScript
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom: boolean;
        connect: (options?: { onlyIfTrusted: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
        signTransaction?: (transaction: any) => Promise<any>;
        signAllTransactions?: (transactions: any[]) => Promise<any[]>;
        signAndSendTransaction?: (transaction: any) => Promise<{ signature: string }>;
        request?: (request: { method: string; params: any }) => Promise<any>;
      }
    }
    // Declaramos solana como tipo 'any' para evitar conflictos de tipo
    solana?: any;
  }
}

interface TokenDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenData | null;
}

export default function TokenDetailModal({ isOpen, onClose, token }: TokenDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('0.1');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);
  
  // Solana network connection
  const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');
  
  // Check if Phantom is installed and if wallet is already connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // Check if Phantom is installed
        const isPhantomInstalled = window.phantom?.solana || window.solana?.isPhantom;
        
        if (!isPhantomInstalled) {
          console.log("Phantom wallet is not installed");
          return;
        }
        
        // Get the provider
        const provider = window.phantom?.solana || window.solana;
        
        // Check if already connected
        try {
          const resp = await provider?.connect({ onlyIfTrusted: true });
          
          if (resp) {
            setIsWalletConnected(true);
            setWalletAddress(resp.publicKey.toString());
            console.log("Wallet connected:", resp.publicKey.toString());
          }
        } catch (err) {
          // This error is expected when not connected yet
          console.log("Not connected to wallet yet (expected)");
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };
    
    checkWalletConnection();
  }, []);
  
  // Close modal with ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  
  // Extract username from tiktokUrl
  const extractUsername = (url: string): string => {
    try {
      const matches = url.match(/@([a-zA-Z0-9_.-]+)/);
      return matches ? `@${matches[1]}` : "@user";
    } catch (err) {
      return "@user";
    }
  };
  
  // Calculate relative time
  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };
  
  // Extract TikTok video ID
  const extractTikTokVideoId = (url: string): string | null => {
    try {
      // Common TikTok URL patterns
      const patterns = [
        /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
        /vm\.tiktok\.com\/(\w+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
      }
      
      return null;
    } catch (err) {
      return null;
    }
  };

  // Truncate long addresses to show only "..." and last 4 digits
  const truncateAddress = (address: string): string => {
    if (!address) return "";
    if (address.length <= 10) return address;
    return `...${address.slice(-4)}`;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    });
  };
  
  // Connect to Phantom wallet
  const connectWallet = async () => {
    try {
      const provider = window.phantom?.solana || window.solana;
      
      if (!provider) {
        toast.error("Phantom wallet is not installed");
        window.open("https://phantom.app/", "_blank");
        return false;
      }
      
      setIsLoading(true);
      
      try {
        const resp = await provider.connect();
        setWalletAddress(resp.publicKey.toString());
        setIsWalletConnected(true);
        toast.success("Wallet connected successfully");
        console.log("Wallet connected:", resp.publicKey.toString());
        return true;
      } catch (err) {
        console.error("User rejected connection:", err);
        toast.error("Connection rejected");
        return false;
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      toast.error("Failed to connect wallet");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Disconnect from Phantom wallet
  const disconnectWallet = async () => {
    try {
      const provider = window.phantom?.solana || window.solana;
      
      if (provider) {
        await provider.disconnect();
        setWalletAddress(null);
        setIsWalletConnected(false);
        toast.success("Wallet disconnected");
        console.log("Wallet disconnected");
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };
  
  // Get public key of connected wallet
  const getPublicKey = (): web3.PublicKey | null => {
    if (!walletAddress) return null;
    try {
      return new web3.PublicKey(walletAddress);
    } catch (error) {
      console.error("Invalid wallet address:", error);
      return null;
    }
  };
  
  // PumpFun transaction
  const createAndSendPumpFunTransaction = async (
    action: 'buy' | 'sell',
    mintAddress: string,
    tokenAmount: number,
    slippagePercent: number = 10
  ): Promise<string | null> => {
    try {
      if (!walletAddress) {
        toast.error("Wallet not connected");
        return null;
      }
      
      const provider = window.phantom?.solana || window.solana;
      
      // Datos para la API de PumpFun
      const requestData = {
        publicKey: walletAddress,
        action: action,
        mint: mintAddress,
        denominatedInSol: action === 'buy' ? 'true' : 'false', // Debe ser string 'true' o 'false'
        amount: action === 'buy' ? parseFloat(amount) : tokenAmount,
        slippage: slippagePercent,
        priorityFee: 0.00001,
        pool: "pump" // Usamos directamente el pool de PumpFun
      };
      
      console.log("PumpFun request data:", requestData);
      setTransactionStatus("Getting transaction from PumpFun...");
      
      // Solicitud a la API de PumpFun para generar la transacción
      const response = await fetch("https://pumpportal.fun/api/trade-local", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("PumpFun API error:", errorText);
        throw new Error(`PumpFun API error: ${response.statusText}. ${errorText}`);
      }
      
      // Obtenemos la transacción serializada
      const data = await response.arrayBuffer();
      const serializedTx = new Uint8Array(data);
      
      // Deserializamos la transacción
      const transaction = web3.VersionedTransaction.deserialize(serializedTx);
      
      setTransactionStatus("Requesting signature from Phantom...");
      
      // Firmamos la transacción con Phantom
      let signature: string;
      
      if (provider.signAndSendTransaction) {
        // Método preferido si está disponible
        const signedTx = await provider.signAndSendTransaction(transaction);
        signature = signedTx.signature;
      } else {
        // Método alternativo
        const signedTx = await provider.signTransaction(transaction);
        signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );
      }
      
      return signature;
    } catch (error) {
      console.error("PumpFun transaction error:", error);
      throw error;
    }
  };
  
  // Handle buy operation using PumpFun
  const handleBuy = async () => {
    setActiveTab('buy');
    
    if (!isWalletConnected) {
      const connected = await connectWallet();
      if (!connected) return;
    }
    
    if (!token) {
      toast.error("Token information not available");
      return;
    }
    
    try {
      setIsLoading(true);
      setTransactionStatus("Preparing transaction...");
      
      const amountInSOL = parseFloat(amount);
      if (isNaN(amountInSOL) || amountInSOL <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      
      console.log(`Attempting to buy ${amount} SOL worth of ${token.symbol} via PumpFun...`);
      
      // Llamamos a la función para crear y enviar la transacción de PumpFun
      const signature = await createAndSendPumpFunTransaction(
        'buy',
        token.address,
        amountInSOL
      );
      
      if (signature) {
        setTransactionStatus("Transaction confirmed!");
        console.log(`Transaction successful! Signature: ${signature}`);
        
        // Link to Solana Explorer (mainnet)
        const explorerUrl = `https://solscan.io/tx/${signature}`;
        
        toast.success(
          <div>
            Bought {token.symbol} with {amount} SOL
            <a 
              href={explorerUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline block mt-1 text-xs"
            >
              View on Solscan
            </a>
          </div>
        );
      } else {
        setTransactionStatus("Transaction failed");
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Error buying tokens:", error);
      setTransactionStatus("Transaction failed");
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes("rejected")) {
          toast.error("Transaction rejected by user");
        } else if (errorMessage.includes("insufficient")) {
          toast.error("Insufficient funds to complete transaction");
        } else {
          toast.error(`Transaction failed: ${error.message}`);
        }
      } else {
        toast.error("Transaction failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setTransactionStatus(null), 3000);
    }
  };
  
  // Handle sell operation using PumpFun
  const handleSell = async () => {
    setActiveTab('sell');
    
    if (!isWalletConnected) {
      const connected = await connectWallet();
      if (!connected) return;
    }
    
    if (!token) {
      toast.error("Token information not available");
      return;
    }
    
    try {
      setIsLoading(true);
      setTransactionStatus("Preparing transaction...");
      
      const tokenAmount = parseFloat(amount);
      if (isNaN(tokenAmount) || tokenAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      
      console.log(`Attempting to sell ${amount} ${token.symbol} via PumpFun...`);
      
      // Llamamos a la función para crear y enviar la transacción de PumpFun
      const signature = await createAndSendPumpFunTransaction(
        'sell',
        token.address,
        tokenAmount
      );
      
      if (signature) {
        setTransactionStatus("Transaction confirmed!");
        console.log(`Transaction successful! Signature: ${signature}`);
        
        // Link to Solana Explorer (mainnet)
        const explorerUrl = `https://solscan.io/tx/${signature}`;
        
        toast.success(
          <div>
            Sold {amount} {token.symbol}
            <a 
              href={explorerUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline block mt-1 text-xs"
            >
              View on Solscan
            </a>
          </div>
        );
      } else {
        setTransactionStatus("Transaction failed");
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Error selling tokens:", error);
      setTransactionStatus("Transaction failed");
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes("rejected")) {
          toast.error("Transaction rejected by user");
        } else if (errorMessage.includes("insufficient")) {
          toast.error("Insufficient tokens to complete transaction");
        } else {
          toast.error(`Transaction failed: ${error.message}`);
        }
      } else {
        toast.error("Transaction failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setTransactionStatus(null), 3000);
    }
  };
  
  if (!isOpen || !token) return null;
  
  const videoId = token.tiktokId || extractTikTokVideoId(token.tiktokUrl);
  const username = extractUsername(token.tiktokUrl);
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-black border border-[#333] rounded-md w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="border-b border-[#333] p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image 
                src={token.imageUrl || "/placeholder.svg"}
                alt={token.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <h3 className="text-base font-medium">{token.name}</h3>
                <span className="text-xs text-gray-400">{token.symbol}</span>
              </div>
              <span className="text-xs text-gray-400">{username}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Wallet connection button */}
            {isWalletConnected ? (
              <button
                onClick={disconnectWallet}
                className="text-xs bg-[#222] hover:bg-[#333] text-gray-300 py-1 px-2 rounded flex items-center gap-1"
              >
                {truncateAddress(walletAddress || "")}
                <X size={12} />
              </button>
            ) : (
              <button
                onClick={connectWallet}
                className="text-xs bg-purple-700 hover:bg-purple-600 text-white py-1 px-2 rounded"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  "Connect Wallet"
                )}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#222]"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left panel: Chart with DexScreener */}
          <div className="w-full md:w-2/3 border-r border-[#333] flex flex-col overflow-hidden">
            {/* DexScreener chart panel */}
            <div className="flex-1 relative">
              <style>
                {`
                  #dexscreener-embed{
                    position:relative;
                    width:100%;
                    padding-bottom:125%;
                  }
                  @media(min-width:1400px){
                    #dexscreener-embed{
                      padding-bottom:83%;
                    }
                  }
                  #dexscreener-embed iframe{
                    position:absolute;
                    width:100%;
                    height:100%;
                    top:0;
                    left:0;
                    border:0;
                  }
                `}
              </style>
              <div id="dexscreener-embed">
                <iframe 
                  src={`https://dexscreener.com/solana/${token.address}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTimeframesToolbar=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=1`}
                ></iframe>
              </div>
            </div>
            
            {/* Token information panel */}
            <div className="border-t border-[#333] p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">USD PRICE</span>
                  <span className="font-medium">$0.0000</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">SOL PRICE</span>
                  <span className="font-medium">0.0000</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">SUPPLY</span>
                  <span className="font-medium">1B</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">LIQUIDITY</span>
                  <span className="font-medium">$0.00</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right panel: TikTok video and trading panel - hidden on mobile */}
          <div className="w-full md:w-1/3 flex flex-col hidden md:flex">
            {/* TikTok player */}
            <div className="h-[550px] bg-[#111] relative shrink-0 overflow-hidden mt-12">
              {videoId ? (
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${videoId}`}
                  allowFullScreen
                  className="absolute inset-0 w-full h-full scale-110" // Scale to avoid black borders
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <Eye size={48} className="mb-2 opacity-20" />
                  <p className="text-sm">Video unavailable</p>
                </div>
              )}
            </div>
            
            {/* Compact control panel with gradient effect */}
            <div className="p-1 relative bg-black">
              {/* Purple smoke/gradient effect */}
              <div className="absolute inset-0 z-0 opacity-30" 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(153, 69, 255, 0.3), transparent 70%, rgba(153, 69, 255, 0.1))',
                  backdropFilter: 'blur(2px)'
                }}
              ></div>
              
              {/* Row 1: SOL or Token input field and buttons */}
              <div className="flex items-center gap-1 mb-1 relative z-10">
                <div className="text-xs text-gray-300 w-12">
                  {activeTab === 'buy' ? 'SOL' : token.symbol}
                </div>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-[#111] border border-[#333] rounded-md p-1 flex-1 focus:outline-none text-sm text-center h-8"
                  placeholder="0.0"
                  disabled={isLoading}
                />
                <button
                  className={`h-8 w-10 rounded-md font-bold ${isLoading && activeTab === 'buy' ? 'bg-green-800' : 'bg-green-600 hover:bg-green-700'} text-white text-sm flex items-center justify-center ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
                  onClick={handleBuy}
                  disabled={isLoading}
                >
                  {isLoading && activeTab === 'buy' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : 'B'}
                </button>
                <button
                  className={`h-8 w-10 rounded-md font-bold ${isLoading && activeTab === 'sell' ? 'bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white text-sm flex items-center justify-center ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
                  onClick={handleSell}
                  disabled={isLoading}
                >
                  {isLoading && activeTab === 'sell' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : 'S'}
                </button>
              </div>
              
              {/* Transaction status */}
              {transactionStatus && (
                <div className="text-xs text-center py-1 relative z-10">
                  <span className={`px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    transactionStatus.includes("failed") 
                      ? "bg-red-900/50 text-red-200" 
                      : transactionStatus.includes("confirmed") 
                        ? "bg-green-900/50 text-green-200"
                        : "bg-yellow-900/50 text-yellow-200"
                  }`}>
                    {transactionStatus.includes("failed") ? (
                      <X size={10} />
                    ) : transactionStatus.includes("confirmed") ? (
                      <Check size={10} />
                    ) : (
                      <Loader2 size={10} className="animate-spin" />
                    )}
                    {transactionStatus}
                  </span>
                </div>
              )}
              
              {/* Exchange Info */}
              <div className="text-xs text-center py-1 relative z-10 text-purple-400">
                Trading via PumpFun
              </div>
              
              {/* Row 2: Information in horizontal format */}
              <div className="grid grid-cols-3 gap-1 text-[10px] relative z-10">
                <div className="flex flex-col">
                  <span className="text-gray-400">Creator</span>
                  <div className="flex items-center">
                    <span className="truncate max-w-[60px]">{truncateAddress(token.creator)}</span>
                    <button 
                      onClick={() => copyToClipboard(token.creator)}
                      className="p-0.5 rounded-md hover:bg-[#222] transition-all duration-200"
                    >
                      {copiedAddress === token.creator ? (
                        <Check size={10} className="text-green-500" />
                      ) : (
                        <Clipboard size={10} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400">Address</span>
                  <div className="flex items-center">
                    <span className="truncate max-w-[60px]">{truncateAddress(token.address)}</span>
                    <button 
                      onClick={() => copyToClipboard(token.address)}
                      className="p-0.5 rounded-md hover:bg-[#222] transition-all duration-200"
                    >
                      {copiedAddress === token.address ? (
                        <Check size={10} className="text-green-500" />
                      ) : (
                        <Clipboard size={10} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400">TikTok</span>
                  <a 
                    href={token.tiktokUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-500 hover:underline truncate"
                  >
                    See Original
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 