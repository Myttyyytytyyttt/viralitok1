import { NextResponse } from 'next/server'
import { Web3Storage } from 'web3.storage'

// Conseguir la clave API de Web3.Storage
const WEB3_STORAGE_TOKEN = process.env.WEB3_STORAGE_TOKEN

export async function POST(request: Request) {
  try {
    if (!WEB3_STORAGE_TOKEN) {
      return NextResponse.json(
        { error: 'Web3.Storage token not configured' }, 
        { status: 500 }
      )
    }

    const storage = new Web3Storage({ token: WEB3_STORAGE_TOKEN })
    const formData = await request.formData()
    
    // Extraer los datos del formulario
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const symbol = formData.get('symbol') as string
    const description = formData.get('description') as string
    const tiktokUrl = formData.get('tiktokUrl') as string
    const twitter = formData.get('twitter') as string
    const telegram = formData.get('telegram') as string
    const website = formData.get('website') as string
    const initialPrice = formData.get('initialPrice') as string
    const mintAddress = formData.get('mintAddress') as string

    if (!file || !name || !symbol) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Crear IPFS CID para la imagen
    const imageFile = new File([await file.arrayBuffer()], file.name, { type: file.type })
    const imageCid = await storage.put([imageFile], { wrapWithDirectory: false })
    const imageUrl = `https://${imageCid}.ipfs.w3s.link/${encodeURIComponent(file.name)}`

    // Crear metadata para el token
    const metadata = {
      name,
      symbol,
      description,
      image: imageUrl,
      attributes: [
        { trait_type: 'Source', value: 'TikTok' },
        { trait_type: 'TikTok URL', value: tiktokUrl }
      ],
      properties: {
        creators: [{ address: mintAddress, share: 100 }],
        files: [{ uri: imageUrl, type: file.type }]
      },
      external_url: tiktokUrl
    }

    // Añadir enlaces sociales si existen
    if (twitter) metadata.attributes.push({ trait_type: 'Twitter', value: twitter })
    if (telegram) metadata.attributes.push({ trait_type: 'Telegram', value: telegram })
    if (website) metadata.attributes.push({ trait_type: 'Website', value: website })
    if (initialPrice) metadata.attributes.push({ trait_type: 'Initial Price', value: `${initialPrice} SOL` })

    // Subir metadata a IPFS
    const metadataFile = new File(
      [JSON.stringify(metadata, null, 2)], 
      'metadata.json', 
      { type: 'application/json' }
    )
    
    const metadataCid = await storage.put([metadataFile], { wrapWithDirectory: false })
    const metadataUri = `https://${metadataCid}.ipfs.w3s.link/metadata.json`

    return NextResponse.json({
      success: true,
      imageCid,
      imageUrl,
      metadataCid,
      metadataUri,
      metadata
    })
  } catch (error) {
    console.error('IPFS upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
} 