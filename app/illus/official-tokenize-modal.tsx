"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { XIcon, CheckCircle, Loader } from "lucide-react"
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Keypair, Connection } from '@solana/web3.js'
import Image from "next/image"
import { toast } from "react-hot-toast"
import { VersionedTransaction } from '@solana/web3.js'

interface OfficialTokenizeModalProps {
  isOpen: boolean
  onClose: () => void
}

// Add wait function for retries
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Function to generate a vanity address with a specific suffix
const generateVanityAddress = async (
  suffix: string = "vfun", // Changed from "viral" to "vfun" for better chances
  timeoutSeconds: number = 600, // 10 minutes is still reasonable
  updateStatus?: (status: string) => void
): Promise<Keypair | null> => {
  const startTime = Date.now();
  let attempts = 0;
  let lastUpdateTime = 0;
  let bestMatch = "";
  let bestMatchKeypair: Keypair | null = null;
  
  // Track partial matches to show progress
  const trackPartialMatch = (address: string, keypair: Keypair) => {
    // Check if the last few characters partially match our target
    const partialMatches = [];
    for (let i = 1; i <= suffix.length; i++) {
      const partialSuffix = suffix.substring(0, i);
      if (address.toLowerCase().endsWith(partialSuffix)) {
        partialMatches.push(partialSuffix);
      }
    }
    
    if (partialMatches.length > 0) {
      const bestPartial = partialMatches[partialMatches.length - 1];
      if (bestPartial.length > bestMatch.length) {
        bestMatch = bestPartial;
        bestMatchKeypair = keypair;
        console.log(`Found improved partial match: ${address} (ends with "${bestPartial}")`);
      }
    }
  };
  
  while (Date.now() - startTime < timeoutSeconds * 1000) {
    attempts++;
    const keypair = Keypair.generate();
    const address = keypair.publicKey.toString();
    
    // Check if the address ends with the desired suffix
    if (address.toLowerCase().endsWith(suffix.toLowerCase())) {
      console.log(`Vanity address found! Ending with "${suffix}" after ${attempts} attempts`);
      return keypair;
    }
    
    // Track partial matches to show progress
    trackPartialMatch(address, keypair);
    
    // Update status every 500 attempts or every 500ms
    const now = Date.now();
    if (attempts % 500 === 0 || now - lastUpdateTime > 500) {
      lastUpdateTime = now;
      const timeElapsed = (now - startTime) / 1000;
      const attemptsPerSecond = Math.round(attempts / timeElapsed);
      const statusMsg = `Searching for address ending in "${suffix}"... 
        ${attempts.toLocaleString()} attempts (${timeElapsed.toFixed(1)}s) 
        [${attemptsPerSecond.toLocaleString()}/sec]
        ${bestMatch ? `Best partial match so far: "${bestMatch}"` : ''}`;
      updateStatus?.(statusMsg);
      
      // Allow the browser to breathe
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  console.log(`Timeout after ${attempts.toLocaleString()} attempts searching for suffix "${suffix}"`);
  
  // If we couldn't find a perfect match but have a partial match, we can return that
  if (bestMatchKeypair) {
    console.log(`Returning best partial match ending with "${bestMatch}" after timeout`);
    return bestMatchKeypair;
  }
  
  return null; // Not found within the time limit
};

export function OfficialTokenizeModal({ isOpen, onClose }: OfficialTokenizeModalProps) {
  const { publicKey, signTransaction } = useWallet()
  const [step, setStep] = useState(1)
  
  // Token states
  const [tokenName, setTokenName] = useState("VIRAL")
  const [tokenSymbol, setTokenSymbol] = useState("VIRAL")
  const [tokenDescription, setTokenDescription] = useState("ViralFun.TV Token")
  const [initialPrice, setInitialPrice] = useState("1.0")
  const [twitterUrl, setTwitterUrl] = useState("https://twitter.com/ViralFundotTV")
  const [telegramUrl, setTelegramUrl] = useState("https://t.me/viralfuntv")
  const [websiteUrl, setWebsiteUrl] = useState("https://viralfun.tv")
  
  // Loading and error states
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCreatingToken, setIsCreatingToken] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Vanity address states
  const [vanityStatus, setVanityStatus] = useState<string | null>(null)
  const [isGeneratingVanityAddress, setIsGeneratingVanityAddress] = useState(false)
  const [vanityAddressGenerated, setVanityAddressGenerated] = useState(false)
  const [mintKeypair, setMintKeypair] = useState<Keypair | null>(null)
  
  // Created token states
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [tokenAddress, setTokenAddress] = useState<string | null>(null)
  const [showTokenSuccessDetails, setShowTokenSuccessDetails] = useState(false)
  
  // References and states for the image
  const [tokenImage, setTokenImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Connection to Solana
  const connection = useMemo(() => new Connection(
    'https://solana-mainnet.api.syndica.io/api-key/7w5UqmjEU8VnA7oQSNxJ3mCBanyN88CJFqZY47THEEGQ8vgMPZaNcf7zL4mhCaRUc97Kq4HtjHbToNdgSwFqJay2ZEYpVWkzjw',
    {
      commitment: 'confirmed',
      wsEndpoint: 'wss://solana-mainnet.api.syndica.io/api-key/7w5UqmjEU8VnA7oQSNxJ3mCBanyN88CJFqZY47THEEGQ8vgMPZaNcf7zL4mhCaRUc97Kq4HtjHbToNdgSwFqJay2ZEYpVWkzjw'
    }
  ), []);
  
  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      const resetState = () => {
        setStep(1)
        setTokenName("VIRAL")
        setTokenSymbol("VIRAL")
        setTokenDescription("ViralFun.TV Token")
        setInitialPrice("1.0")
        setTwitterUrl("https://twitter.com/ViralFundotTV")
        setTelegramUrl("https://t.me/viralfuntv")
        setWebsiteUrl("https://viralfun.tv")
        setErrors({})
        setIsVerifying(false)
        setIsCreatingToken(false)
        setTokenImage(null)
        setImagePreview(null)
        setTxSignature(null)
        setTokenAddress(null)
        setErrorMessage(null)
        setShowTokenSuccessDetails(false)
        setVanityAddressGenerated(false)
        setIsGeneratingVanityAddress(false)
        setVanityStatus(null)
      }
      
      // Apply reset after a short delay to allow animations
      const timer = setTimeout(resetState, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])
  
  // Main method to create the token with vanity address
  const handleCreateOfficialToken = async () => {
    try {
      // Validate inputs
      const stepErrors: Record<string, string> = {}
      
      if (!tokenName.trim()) {
        stepErrors.tokenName = "Token name is required"
      }
      
      if (!tokenSymbol.trim()) {
        stepErrors.tokenSymbol = "Token symbol is required"
      }
      
      if (!tokenImage) {
        stepErrors.tokenImage = "Token image is required"
      }
      
      // Validate price
      if (!initialPrice) {
        stepErrors.initialPrice = "Initial price is required";
      } else {
        const price = parseFloat(initialPrice);
        if (isNaN(price) || price <= 0) {
          stepErrors.initialPrice = "Price must be greater than 0";
        }
      }
      
      // If there are errors, show them and don't proceed
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors)
        return
      }
      
      // Verify we can create the token
      if (!publicKey || !signTransaction) {
        setErrorMessage("Wallet not connected or authorization failed");
        return;
      }
      
      // Start token creation process
      setIsCreatingToken(true)
      setErrorMessage(null)
      setLoadingMessage("Preparing to create official VFUN token...")
      
      // Generate vanity address if it doesn't exist
      if (!vanityAddressGenerated) {
        setVanityStatus("Preparing vanity address generation...");
        
        // Add warning about the process
        toast("Finding a vanity address may take several minutes. Please be patient.", {
          duration: 6000,
          position: 'bottom-center',
          style: {
            background: '#111',
            color: '#fff',
            border: '1px solid #333',
          },
          icon: 'ℹ️',
        });
        
        setLoadingMessage("Generating vanity address for VFUN token... (this may take several minutes)");
        setIsGeneratingVanityAddress(true);
        
        // Generate new keypair to replace the temporary one
        try {
          const vanityKeypair = await generateVanityAddress("vfun", 600, setVanityStatus);
          
          if (vanityKeypair) {
            const address = vanityKeypair.publicKey.toString();
            console.log("Vanity address generated:", address);
            setMintKeypair(vanityKeypair);
            setVanityAddressGenerated(true);
            
            const isExactMatch = address.toLowerCase().endsWith("vfun");
            
            setLoadingMessage(`${isExactMatch ? "Perfect" : "Best available"} vanity address found: ${address}`);
            
            // Show success message with right context
            toast(`${isExactMatch ? "Perfect" : "Best available"} vanity address found!`, {
              duration: 3000,
              position: 'bottom-center',
              style: {
                background: '#111',
                color: '#fff',
                border: '1px solid #333',
              },
              icon: '✅',
            });
            
            // Now proceed with the actual token creation
            try {
              console.log("Starting token creation process...");
              console.log("Public wallet:", publicKey.toString());
              console.log("Mint keypair public key:", vanityKeypair.publicKey.toString());
              
              // 1. Prepare FormData to upload image and metadata to IPFS
              const formData = new FormData();
              if (tokenImage) {
                // Use 'file' instead of 'image' for compatibility with pump.fun
                formData.append("file", tokenImage);
              }
              formData.append("name", tokenName);
              formData.append("symbol", tokenSymbol);
              formData.append("description", tokenDescription || `Official ViralFun.TV Token`);
              if (twitterUrl) formData.append("twitter", twitterUrl);
              if (telegramUrl) formData.append("telegram", telegramUrl);
              if (websiteUrl) formData.append("website", websiteUrl);
              formData.append("showName", "true");
              
              // 2. Upload metadata and image to IPFS through our proxy
              console.log("Uploading token metadata to IPFS via proxy...");
              setLoadingMessage("Uploading token metadata and images...");
              
              // Upload to IPFS
              const ipfsResponse = await fetch("https://pump.fun/api/ipfs", {
                method: "POST",
                body: formData,
              });
              
              if (!ipfsResponse.ok) {
                throw new Error(`IPFS upload failed: ${ipfsResponse.status} - ${await ipfsResponse.text()}`);
              }
              
              const metadataResponseJSON = await ipfsResponse.json();
              
              console.log("Metadata IPFS response:", metadataResponseJSON);
              
              if (!metadataResponseJSON.metadataUri) {
                throw new Error("No metadata URI received from IPFS");
              }
              
              // Save image URL for later use
              let imageUrl = '';

              // According to Pump Portal docs, image is in metadata.image
              if (metadataResponseJSON.metadata && metadataResponseJSON.metadata.image) {
                imageUrl = metadataResponseJSON.metadata.image;
              } 
              // Fallback if no direct metadata
              else if (metadataResponseJSON.image) {
                imageUrl = metadataResponseJSON.image;
              } 
              
              console.log("Image URL captured:", imageUrl);
              
              // 3. Get token creation transaction
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
                "mint": vanityKeypair.publicKey.toString(),
                "denominatedInSol": "true", // As string according to example
                "amount": parseFloat(initialPrice),
                "slippage": 10,
                "priorityFee": 0.0005,
                "pool": "pump"
              };
              
              console.log("TX Payload:", JSON.stringify(createTxPayload, null, 2));
              
              // Use PumpPortal API directly
              console.log("Requesting transaction from PumpPortal...");
              setLoadingMessage("Requesting transaction from PumpPortal...");
              
              const pumpResponse = await fetch("https://pumpportal.fun/api/trade-local", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(createTxPayload)
              });
              
              // Check if response is successful
              if (!pumpResponse.ok) {
                const errorText = await pumpResponse.text();
                console.error(`Error in API response (${pumpResponse.status}):`, errorText);
                throw new Error(`Error obtaining transaction: ${pumpResponse.status} - ${errorText}`);
              }
              
              // Get binary data directly
              console.log("Getting transaction binary data...");
              setLoadingMessage("Processing transaction data...");
              const txData = await pumpResponse.arrayBuffer();
              
              // Verify if received data is valid
              if (!txData || txData.byteLength === 0) {
                console.error("Error: No transaction data received (empty buffer)");
                throw new Error("Received empty transaction data from API");
              }
              
              // Convert to Uint8Array for deserialization
              console.log("Signing transaction...");
              setLoadingMessage("Preparing to sign transaction...");
              const txUint8Array = new Uint8Array(txData);
              console.log("TX data size:", txData.byteLength, "bytes");
              console.log("TX bytes (first 20):", Array.from(txUint8Array.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
              
              // Deserialize the transaction
              let tx;
              try {
                tx = VersionedTransaction.deserialize(txUint8Array);
                console.log("Transaction deserialized successfully");
              } catch (deserializeError) {
                console.error("Error deserializing transaction:", deserializeError);
                const errorMessage = deserializeError instanceof Error 
                  ? deserializeError.message 
                  : "Unknown deserialization error";
                throw new Error(`Error deserializing transaction: ${errorMessage}`);
              }
              
              // Sign with both keys, first the mintKeypair
              console.log("Signing transaction with mintKeypair...");
              setLoadingMessage("Signing transaction with mintKeypair...");
              tx.sign([vanityKeypair]);
              
              // Then sign with user's wallet
              console.log("Signing transaction with user's wallet...");
              setLoadingMessage("Please sign transaction with your wallet...");
              const signedTx = await signTransaction(tx);
              
              // Send transaction to the network
              console.log("Sending transaction to Solana...");
              setLoadingMessage("Sending transaction to Solana network...");
              const signature = await connection.sendRawTransaction(signedTx.serialize(), {
                skipPreflight: true,
                maxRetries: 3
              });
              
              console.log("Transaction sent successfully. Signature:", signature);
              setLoadingMessage("Transaction sent! Waiting for confirmation...");
              
              // Confirm transaction to ensure completion
              console.log("Waiting for transaction confirmation...");
              const confirmation = await connection.confirmTransaction(signature, 'confirmed');
              console.log("Confirmation status:", confirmation);
              
              if (confirmation.value.err) {
                console.error("Error in confirmation:", confirmation.value.err);
                throw new Error(`Transaction error: ${JSON.stringify(confirmation.value.err)}`);
              }
              
              console.log("Transaction confirmed successfully!");
              setLoadingMessage("Transaction confirmed successfully!");
              setTxSignature(signature);
              setTokenAddress(vanityKeypair.publicKey.toString());
              
              // 6. Save token information (optional)
              try {
                const saveResponse = await fetch('/api/save-token', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    address: vanityKeypair.publicKey.toString(),
                    name: tokenName,
                    symbol: tokenSymbol,
                    tiktokUrl: "", // No TikTok for official token
                    tiktokId: null,
                    creator: publicKey.toString(),
                    timestamp: Date.now(),
                    signature,
                    imageUrl
                  })
                });
                
                if (!saveResponse.ok) {
                  console.warn("Could not save token information:", await saveResponse.text());
                } else {
                  console.log("Token information saved successfully");
                  
                  // Emit a custom event to notify explorers that a new token has been created
                  try {
                    const newTokenEvent = new CustomEvent('newTokenCreated', { 
                      detail: { 
                        address: vanityKeypair.publicKey.toString(),
                        timestamp: Date.now() 
                      } 
                    });
                    window.dispatchEvent(newTokenEvent);
                    console.log("New token event emitted");
                  } catch (eventError) {
                    console.error("Error emitting new token event:", eventError);
                  }
                }
              } catch (error) {
                console.error("Warning: Failed to save token info:", error);
                // Don't fail the entire process if we can't save the info
              }
              
              // 7. Advance to success step
              setIsCreatingToken(false);
              setLoadingMessage("");
              setStep(3);
              
            } catch (tokenError) {
              console.error("Error creating token:", tokenError);
              setErrorMessage(tokenError instanceof Error ? tokenError.message : "Failed to create token. Please try again.");
              setIsCreatingToken(false);
              setLoadingMessage("");
            }
            
          } else {
            setErrorMessage("Failed to generate vanity address within the time limit. Please try again.");
            setIsCreatingToken(false);
            setLoadingMessage("");
            setIsGeneratingVanityAddress(false);
          }
        } catch (error) {
          console.error("Error generating vanity address:", error);
          setErrorMessage(`Error generating vanity address: ${error instanceof Error ? error.message : String(error)}`);
          setIsCreatingToken(false);
          setLoadingMessage("");
          setIsGeneratingVanityAddress(false);
        }
      }
    } catch (error: any) {
      console.error("Error creating official token:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to create token. Please try again.");
      setIsCreatingToken(false);
      setLoadingMessage("");
    }
  }
  
  // Function to handle image selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setErrors({...errors, tokenImage: "Invalid file type. Please upload an image (JPG, PNG, GIF, WebP)"})
      return
    }
    
    // Validate size (4MB = 4 * 1024 * 1024 bytes)
    const maxSize = 4 * 1024 * 1024
    if (file.size > maxSize) {
      setErrors({...errors, tokenImage: "Image is too large. Maximum size is 4MB"})
      return
    }
    
    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    setTokenImage(file)
    setErrors({...errors, tokenImage: ""})
  }
  
  // Render the success modal
  const renderSuccessContent = () => {
    return (
      <div className="space-y-6 py-4">
        <div className="flex items-center justify-center">
          <CheckCircle size={60} className="text-green-500" />
        </div>
        
        <h2 className="text-center text-lg font-bold">VIRAL Token Successfully Created!</h2>
        
        <div className="space-y-2 p-4 bg-[#111] rounded-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Token Address:</span>
            <span className="text-xs font-mono">{tokenAddress?.slice(0, 8)}...{tokenAddress?.slice(-8)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Name:</span>
            <span className="text-xs font-mono">{tokenName}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Symbol:</span>
            <span className="text-xs font-mono">{tokenSymbol}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Tx:</span>
            <a 
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-[#8A2BE2] hover:underline"
            >
              View on Solscan
            </a>
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-[#8A2BE2] to-[#4CAF50] hover:opacity-90 transition rounded-sm"
          >
            Close
          </button>
        </div>
      </div>
    )
  }
  
  // Render the form
  const renderFormContent = () => {
    return (
      <div className="space-y-4 py-4">
        <h2 className="text-center text-lg font-bold">Create Official VIRAL Token</h2>
        <p className="text-center text-xs text-gray-400">This token will have a contract address ending in "vfun"</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Token Name</label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className={`w-full bg-[#111] border ${errors.tokenName ? 'border-red-500' : 'border-[#333]'} rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-[#8A2BE2]`}
            />
            {errors.tokenName && <p className="text-red-500 text-[10px] mt-0.5">{errors.tokenName}</p>}
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Token Symbol</label>
            <input
              type="text"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              className={`w-full bg-[#111] border ${errors.tokenSymbol ? 'border-red-500' : 'border-[#333]'} rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-[#8A2BE2]`}
            />
            {errors.tokenSymbol && <p className="text-red-500 text-[10px] mt-0.5">{errors.tokenSymbol}</p>}
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Description</label>
          <textarea
            value={tokenDescription}
            onChange={(e) => setTokenDescription(e.target.value)}
            className="w-full bg-[#111] border border-[#333] rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-[#8A2BE2] min-h-[60px]"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Token Image</label>
          <div 
            className={`border-2 border-dashed ${errors.tokenImage ? 'border-red-500' : 'border-[#333]'} rounded-sm p-4 text-center cursor-pointer hover:border-[#8A2BE2] transition`}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div className="relative w-32 h-32 mx-auto">
                <Image
                  src={imagePreview}
                  alt="Token preview"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="py-4">
                <p className="text-xs text-gray-400">Click to select image</p>
                <p className="text-[10px] text-gray-500 mt-1">JPG, PNG, GIF or WebP (max 4MB)</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="hidden"
            />
          </div>
          {errors.tokenImage && <p className="text-red-500 text-[10px] mt-0.5">{errors.tokenImage}</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Initial Price (SOL)</label>
            <input
              type="text"
              value={initialPrice}
              onChange={(e) => setInitialPrice(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-[#8A2BE2]"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Twitter URL</label>
            <input
              type="text"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-[#8A2BE2]"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Telegram URL</label>
            <input
              type="text"
              value={telegramUrl}
              onChange={(e) => setTelegramUrl(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-[#8A2BE2]"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Website URL</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-[#8A2BE2]"
            />
          </div>
        </div>
        
        {errorMessage && (
          <div className="p-3 bg-red-900/30 border border-red-500 rounded-sm">
            <p className="text-xs text-red-500">{errorMessage}</p>
          </div>
        )}
        
        <div className="flex justify-end pt-4">
          <button
            onClick={handleCreateOfficialToken}
            disabled={isCreatingToken}
            className="px-6 py-2 bg-gradient-to-r from-[#8A2BE2] to-[#4CAF50] hover:opacity-90 transition rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingToken ? 'Processing...' : 'Create Official Token'}
          </button>
        </div>
      </div>
    )
  }
  
  // Content to show during token creation
  const renderLoadingContent = () => {
    return (
      <div className="py-8 px-4 flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-t-[#8A2BE2] border-r-[#8A2BE2] border-b-[#4CAF50] border-l-[#4CAF50] border-solid rounded-full animate-spin"></div>
        
        <h3 className="text-center text-lg font-bold">Creating VIRAL Token</h3>
        
        <p className="text-center text-sm">{loadingMessage || "Processing..."}</p>
        
        {isGeneratingVanityAddress && vanityStatus && (
          <p className="text-xs text-gray-400 text-center mt-2">{vanityStatus}</p>
        )}
      </div>
    )
  }
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative bg-black border border-[#333] rounded-sm shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
        >
          <XIcon size={20} />
        </button>
        
        <div className="p-4">
          {isCreatingToken ? (
            renderLoadingContent()
          ) : step === 3 ? (
            renderSuccessContent()
          ) : (
            renderFormContent()
          )}
        </div>
      </div>
    </div>
  )
} 