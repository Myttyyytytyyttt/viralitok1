import { NextResponse } from 'next/server'
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction, 
  VersionedTransaction,
  TransactionMessage,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js'
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata'
import { 
  createInitializeMintInstruction, 
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token'
import bs58 from 'bs58'

// Conexión a Solana
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
)

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { 
      publicKey: userPubkeyStr, 
      mintKeypair: mintKeypairStr,
      metadataUri, 
      name, 
      symbol, 
      initialPrice 
    } = data
    
    // Validar datos
    if (!userPubkeyStr || !mintKeypairStr || !metadataUri || !name || !symbol) {
      return NextResponse.json(
        { error: 'Missing required parameters' }, 
        { status: 400 }
      )
    }
    
    // Convertir public key y mintKeypair
    const userPubkey = new PublicKey(userPubkeyStr)
    const mintKeypair = Keypair.fromSecretKey(bs58.decode(mintKeypairStr))
    
    // Obtener balance para verificar si el usuario puede pagar por la transacción
    const userBalance = await connection.getBalance(userPubkey)
    const minBalanceNeeded = LAMPORTS_PER_SOL * 0.02  // Aproximadamente 0.02 SOL para el proceso
    
    if (userBalance < minBalanceNeeded) {
      return NextResponse.json(
        { error: 'Insufficient balance to create token' }, 
        { status: 400 }
      )
    }
    
    // Calcular address de metadata
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    )
    
    // Obtener address del token del usuario
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      userPubkey
    )
    
    // Crear transacción para inicializar el mint y metadata
    const createMetadataIx = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mintKeypair.publicKey,
        mintAuthority: userPubkey,
        payer: userPubkey,
        updateAuthority: userPubkey,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name,
            symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: 0,
            creators: [
              {
                address: userPubkey,
                verified: true,
                share: 100,
              },
            ],
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      }
    )
    
    // Calcular rent para mint
    const lamportsForMint = await getMinimumBalanceForRentExemptMint(connection)
    
    // Crear instrucción para crear account para el mint
    const createAccountIx = SystemProgram.createAccount({
      fromPubkey: userPubkey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: lamportsForMint,
      programId: TOKEN_PROGRAM_ID,
    })
    
    // Inicializar mint
    const initMintIx = createInitializeMintInstruction(
      mintKeypair.publicKey,
      0, // decimals
      userPubkey,
      userPubkey
    )
    
    // Crear token account asociada
    const createATAIx = createAssociatedTokenAccountInstruction(
      userPubkey,
      associatedTokenAccount,
      userPubkey,
      mintKeypair.publicKey
    )
    
    // Acuñar tokens al usuario
    const mintToIx = createMintToInstruction(
      mintKeypair.publicKey,
      associatedTokenAccount,
      userPubkey,
      1, // Cantidad (solo 1 por ser NFT)
      []
    )
    
    // Construir mensaje de transacción versionada
    const { blockhash } = await connection.getLatestBlockhash()
    
    const messageV0 = new TransactionMessage({
      payerKey: userPubkey,
      recentBlockhash: blockhash,
      instructions: [
        createAccountIx,
        initMintIx,
        createATAIx,
        mintToIx,
        createMetadataIx
      ],
    }).compileToV0Message()
    
    // Crear transacción versionada
    const transaction = new VersionedTransaction(messageV0)
    
    // Firmar con mintKeypair
    transaction.sign([mintKeypair])
    
    // Devolver la transacción serializada para que el cliente la firme con la wallet
    return new Response(
      Buffer.from(transaction.serialize()),
      { 
        headers: { 'Content-Type': 'application/octet-stream' }
      }
    )
    
  } catch (error) {
    console.error('Error creating token:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
} 