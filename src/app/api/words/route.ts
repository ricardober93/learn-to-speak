import { NextRequest, NextResponse } from 'next/server';
import { WordEngine } from '../../../lib/rules/engine';
import { WordGeneratorOptionsSchema } from '../../../lib/rules/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consonantId = searchParams.get('consonantId');
    const syllableCount = searchParams.get('syllableCount');
    const difficulty = searchParams.get('difficulty');
    const maxWords = searchParams.get('maxWords');
    
    if (!consonantId) {
      return NextResponse.json(
        { error: 'consonantId es requerido' },
        { status: 400 }
      );
    }
    
    const options = {
      consonantId,
      ...(syllableCount && { syllableCount: parseInt(syllableCount) }),
      ...(difficulty && { difficulty: parseInt(difficulty) }),
      ...(maxWords && { maxWords: parseInt(maxWords) })
    };
    
    const validatedOptions = WordGeneratorOptionsSchema.parse(options);
    const words = await WordEngine.generateWords(validatedOptions);
    
    return NextResponse.json(words);
  } catch (error) {
    console.error('Error generating words:', error);
    return NextResponse.json(
      { error: 'Error al generar las palabras' },
      { status: 500 }
    );
  }
}