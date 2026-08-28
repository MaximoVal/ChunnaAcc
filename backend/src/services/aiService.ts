/**
 * ==============================================================================
 * SERVICIO DE INTELIGENCIA ARTIFICIAL (Google Gemini Multimodal Vision)
 * ==============================================================================
 * 
 * ¿Cómo funciona este servicio?
 * 1. Recibe la ruta local de una imagen que el usuario acaba de subir al servidor.
 * 2. Lee los bytes de la imagen del disco y los convierte a formato Base64.
 * 3. Se conecta a la API de Google Gemini (modelo gemini-1.5-flash o gemini-2.5-flash)
 *    enviando la imagen junto con un "Prompt" (instrucción) especialmente redactado
 *    para que la IA actúe como un experto en catalogación de joyería artesanal.
 * 4. La IA analiza visualmente:
 *    - Los tipos de tejido (macramé, mostacillas, cristales, hilos encerados).
 *    - La forma y tipo de accesorio (pulsera, collar, aros, tobillera).
 *    - La paleta de colores y piedras semipreciosas o dijes visibles.
 * 5. La IA responde en formato JSON con:
 *    - Un título atractivo (nombre).
 *    - Una descripción persuasiva lista para ecommerce.
 *    - La categoría más adecuada.
 *    - Un precio de referencia en pesos argentinos (ARS).
 *    - Un stock sugerido.
 * 
 * ¿Y si aún no configuraste tu GEMINI_API_KEY en .env?
 * Este servicio detecta automáticamente si no hay clave de API configurada y activa
 * un generador heurístico inteligente de respaldo para que puedas probar toda la
 * interfaz sin que nada se rompa.
 * ==============================================================================
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Definimos la estructura del resultado devuelto por la IA
export interface AIProductAnalysis {
  nombre: string;
  descripcion: string;
  categoria: 'Pulseras' | 'Collares' | 'Tobilleras' | 'Aros' | 'Sets y Combos';
  material?: string;
  precio: number;
  stock: number;
}

/**
 * Función auxiliar: convierte un archivo de imagen en el formato inlineData
 * requerido por la API de Google Gemini para procesar datos binarios.
 */
function fileToGenerativePart(filePath: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType
    }
  };
}

/**
 * Generador heurístico de respaldo (Fallback):
 * Se utiliza cuando no hay API Key configurada o cuando ocurre un error de conexión con la IA.
 * Deduce información a partir del nombre del archivo y genera descripciones más realistas.
 */
function generateFallbackAnalysis(imageFileName: string): AIProductAnalysis {
  const cleanName = imageFileName
    .replace(/\.[^/.]+$/, '') // Quita la extensión
    .replace(/[-_]/g, ' ')     // Cambia guiones por espacios
    .trim();

  const lower = cleanName.toLowerCase();
  
  // Deducir categoría a partir de palabras clave en el nombre
  let categoria: 'Pulseras' | 'Collares' | 'Tobilleras' | 'Aros' | 'Sets y Combos' = 'Pulseras';
  if (lower.includes('collar') || lower.includes('cadena') || lower.includes('choker') || lower.includes('dije')) {
    categoria = 'Collares';
  } else if (lower.includes('tobillera') || lower.includes('pie')) {
    categoria = 'Tobilleras';
  } else if (lower.includes('aro') || lower.includes('arete') || lower.includes('argolla')) {
    categoria = 'Aros';
  } else if (lower.includes('set') || lower.includes('combo') || lower.includes('pack') || lower.includes('kit')) {
    categoria = 'Sets y Combos';
  }

  // Generar título mejorado y descripción acorde
  const baseTitle = cleanName.length > 3 && !/^\d+$/.test(cleanName) && !lower.startsWith('image') && !lower.startsWith('foto') && !lower.startsWith('img')
    ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    : `${categoria === 'Sets y Combos' ? 'Set' : categoria.slice(0, -1)} Artesanal Chunna`;

  const descripcionesPorCategoria: Record<string, { desc: string; precio: number }> = {
    'Pulseras': {
      desc: 'Pulsera artesanal tejida a mano con hilos seleccionados de alta resistencia, detalles de cuentas pulidas y nudo corredizo regulable para un calce perfecto.',
      precio: 3500
    },
    'Collares': {
      desc: 'Collar de diseño exclusivo con dije central y terminaciones cuidadas. Confeccionado con materiales livianos, resistentes y libres de níquel.',
      precio: 4800
    },
    'Tobilleras': {
      desc: 'Tobillera playera tejida con mostacillas y detalles resistentes al agua, ideal para uso diario o temporada de verano.',
      precio: 3200
    },
    'Aros': {
      desc: 'Aros colgantes ultralivianos elaborados a mano con ganchos hipoalergénicos y delicada combinación de colores y formas.',
      precio: 2900
    },
    'Sets y Combos': {
      desc: 'Conjunto combinado de accesorios en armonía cromática. Perfecto para regalo o para complementar tu look diario.',
      precio: 6500
    }
  };

  const itemInfo = descripcionesPorCategoria[categoria] || descripcionesPorCategoria['Pulseras'];

  let material = 'Macramé';
  if (lower.includes('mostacilla')) material = 'Mostacillas';
  else if (lower.includes('cristal')) material = 'Cristales';
  else if (lower.includes('piedra')) material = 'Piedras naturales';
  else if (lower.includes('metal') || lower.includes('dije')) material = 'Metal';
  else if (lower.includes('hilo')) material = 'Hilo encerado';

  return {
    nombre: baseTitle,
    descripcion: itemInfo.desc,
    categoria,
    material,
    precio: itemInfo.precio,
    stock: 12
  };
}

/**
 * Función auxiliar: convierte un Buffer de imagen (o ruta) en el formato inlineData
 * requerido por la API de Google Gemini para procesar datos binarios.
 */
function bufferToGenerativePart(bufferOrPath: Buffer | string, mimeType: string) {
  const base64Data = Buffer.isBuffer(bufferOrPath)
    ? bufferOrPath.toString('base64')
    : Buffer.from(fs.readFileSync(bufferOrPath)).toString('base64');

  return {
    inlineData: {
      data: base64Data,
      mimeType
    }
  };
}

export async function analyzeProductImageWithAI(
  imageSource: Buffer | string,
  mimeType: string,
  originalFileName?: string
): Promise<AIProductAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  const fileNameForFallback = originalFileName || (typeof imageSource === 'string' ? path.basename(imageSource) : 'accesorio.jpg');

  // 1. Si no hay API Key configurada en .env, avisamos en consola y usamos el generador de respaldo
  if (!apiKey || apiKey === 'tu_api_key_de_gemini' || apiKey.trim() === '') {
    console.info('⚠️ [IA Service] GEMINI_API_KEY no configurada en backend/.env. Usando analizador de respaldo.');
    return generateFallbackAnalysis(fileNameForFallback);
  }

  try {
    // 2. Inicializamos el cliente de Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const preferredModel = process.env.GEMINI_MODEL;
    const modelCandidates = preferredModel
      ? [preferredModel, 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-pro-latest']
      : ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-pro-latest'];

    // 3. Preparamos la imagen como buffer Base64
    const imagePart = bufferToGenerativePart(imageSource, mimeType);

    // 4. Prompt de alta fidelidad para catalogación precisa de accesorios
    const prompt = `
Eres una experta en catalogación, marketing y joyería artesanal para la tienda "Chunna Accesorios".
Tu tarea es OBSERVAR DETALLADAMENTE la imagen adjunta y describir con total precisión y realismo lo que se ve en la foto.

Pautas de análisis visual:
1. TIPO DE ACCESORIO: Identifica claramente si es una Pulsera, Collar/Gargantilla, Tobillera, Aros o Set/Combo.
2. COLORES Y TONALIDADES: Menciona los colores predominantes exactos que ves (ej: tonos tierra, pasteles, dorado, plateado, negro, turquesa, etc.).
3. MATERIALES Y DETALLES: Si ves hilo encerado, nudo macramé, mostacillas, cuentas de madera, piedras naturales (cuarzo, amatista, ojo de tigre), cristales, dijes metálicos, etc., inclúyelos en la descripción.
4. ESTILO: Boho chic, minimalista, playero, elegante, artesanal moderno.

Reglas de respuesta:
- Nombre: Título comercial conciso, elegante y atractivo en español (máx. 7 palabras). Ej: "Pulsera Macramé con Ojo de Tigre", "Collar Choker con Cristales Rosa".
- Descripción: 2 a 3 oraciones bien redactadas, cautivadoras y honestas con lo que se aprecia en la foto.
- Categoría: DEBE ser EXACTAMENTE una de estas opciones: 'Pulseras' | 'Collares' | 'Tobilleras' | 'Aros' | 'Sets y Combos'.
- Material: Sugiere el material principal del accesorio. Elige UNA opción de esta lista si es posible: 'Macramé', 'Mostacillas', 'Cristales', 'Hilo encerado', 'Piedras naturales', 'Metal'. Si no aplica ninguna, usa otra palabra que describa el material principal.
- Precio: Un precio sugerido realista en pesos argentinos (número entero entre 2000 y 9000).
- Stock: Un número entero recomendado (ej: 10 o 15).

Responde ÚNICAMENTE con un JSON válido sin markdown ni texto adicional:
{
  "nombre": "...",
  "descripcion": "...",
  "categoria": "Pulseras",
  "material": "Macramé",
  "precio": 3500,
  "stock": 15
}
`;

    let responseText = '';
    let lastError: any = null;

    // Intentamos sucesivamente con los modelos candidatos hasta que uno responda
    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 800
          }
        });

        const result = await model.generateContent([prompt, imagePart]);
        responseText = result.response.text().trim();
        console.log(`✅ [IA Service] Análisis exitoso con modelo: ${modelName}`);
        break; // Éxito, salimos del bucle
      } catch (err: any) {
        lastError = err;
        console.warn(`⚠️ [IA Service] Modelo "${modelName}" no disponible (${err.message}). Probando siguiente modelo...`);
      }
    }

    if (!responseText) {
      throw lastError || new Error('No se pudo obtener respuesta de ningún modelo de Gemini.');
    }

    // 5. Limpiamos la respuesta en caso de bloques markdown
    let cleanJson = responseText;
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
    }

    // Si aún tiene comillas invertidas al inicio o fin
    cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();

    const parsedData = JSON.parse(cleanJson);

    // Validamos categorías permitidas
    const validCategories = ['Pulseras', 'Collares', 'Tobilleras', 'Aros', 'Sets y Combos'];
    const finalCategory = validCategories.includes(parsedData.categoria)
      ? parsedData.categoria
      : 'Pulseras';

    return {
      nombre: String(parsedData.nombre || 'Accesorio Artesanal Hecho a Mano').trim(),
      descripcion: String(parsedData.descripcion || 'Diseño exclusivo artesanal confeccionado a mano con materiales de primera calidad.').trim(),
      categoria: finalCategory as any,
      material: parsedData.material ? String(parsedData.material).trim() : 'Macramé',
      precio: Number(parsedData.precio) > 0 ? Number(parsedData.precio) : 3500,
      stock: Number(parsedData.stock) > 0 ? Number(parsedData.stock) : 10
    };
  } catch (error: any) {
    console.warn('⚠️ [IA Service] Error o límite al consultar Gemini API:', error.message);
    console.info('👉 Activando analizador de respaldo para mantener la continuidad del servicio.');
    return generateFallbackAnalysis(fileNameForFallback);
  }
}
