import { PrismaClient } from '@prisma/client';
import { Word, WordGeneratorOptions } from './types';
import { WordGeneratorOptionsSchema } from './schema';

const prisma = new PrismaClient();

// Palabras predefinidas por consonante y número de sílabas
const WORD_DATABASE: Record<string, Record<number, string[]>> = {
  'B': {
    1: ['ba', 'be', 'bi', 'bo', 'bu'],
    2: ['boca', 'bebe', 'bobo', 'baba', 'bubo'],
    3: ['banana', 'bebida', 'babero', 'bobina', 'burbujas']
  },
  'C': {
    1: ['ca', 'co', 'cu'],
    2: ['casa', 'coco', 'cuna', 'cara', 'cubo'],
    3: ['camisa', 'cocina', 'cabeza', 'camino', 'cuchara']
  },
  'D': {
    1: ['da', 'de', 'di', 'do', 'du'],
    2: ['dado', 'dedo', 'duda', 'dona', 'ducha'],
    3: ['dinero', 'domingo', 'dedito', 'dulzura', 'delicia']
  },
  'F': {
    1: ['fa', 'fe', 'fi', 'fo', 'fu'],
    2: ['foca', 'foto', 'fuma', 'faro', 'fuego'],
    3: ['familia', 'fantasia', 'figura', 'futuro', 'felino']
  },
  'G': {
    1: ['ga', 'go', 'gu'],
    2: ['gato', 'goma', 'gula', 'gana', 'gusto'],
    3: ['gallina', 'guitarra', 'gasolina', 'gigante', 'globito']
  },
  'L': {
    1: ['la', 'le', 'li', 'lo', 'lu'],
    2: ['luna', 'lobo', 'lima', 'lana', 'loro'],
    3: ['limones', 'lagarto', 'libreta', 'lavadora', 'lechuga']
  },
  'M': {
    1: ['ma', 'me', 'mi', 'mo', 'mu'],
    2: ['mama', 'mesa', 'mano', 'mono', 'mula'],
    3: ['mariposa', 'medicina', 'manzana', 'montaña', 'muñeca']
  },
  'N': {
    1: ['na', 'ne', 'ni', 'no', 'nu'],
    2: ['nana', 'nene', 'nido', 'nota', 'nube'],
    3: ['naranja', 'navidad', 'niñito', 'numero', 'naturaleza']
  },
  'P': {
    1: ['pa', 'pe', 'pi', 'po', 'pu'],
    2: ['papa', 'peso', 'pino', 'polo', 'puma'],
    3: ['paloma', 'pelota', 'pintura', 'pollo', 'pupila']
  },
  'R': {
    1: ['ra', 're', 'ri', 'ro', 'ru'],
    2: ['rata', 'remo', 'risa', 'ropa', 'ruta'],
    3: ['ratones', 'regalo', 'revista', 'rosita', 'ruleta']
  },
  'S': {
    1: ['sa', 'se', 'si', 'so', 'su'],
    2: ['sala', 'seda', 'silla', 'sopa', 'suma'],
    3: ['salada', 'semana', 'silbato', 'soldado', 'susurro']
  },
  'T': {
    1: ['ta', 'te', 'ti', 'to', 'tu'],
    2: ['taza', 'tela', 'tina', 'toro', 'tubo'],
    3: ['tomate', 'telefono', 'tijeras', 'tortuga', 'tulipan']
  }
};

export class WordEngine {
  /**
   * Genera palabras basadas en las opciones proporcionadas
   */
  static async generateWords(options: WordGeneratorOptions): Promise<Word[]> {
    const validatedOptions = WordGeneratorOptionsSchema.parse(options);
    
    // Obtener la consonante
    const consonant = await prisma.consonant.findUnique({
      where: { id: validatedOptions.consonantId }
    });
    
    if (!consonant) {
      throw new Error('Consonante no encontrada');
    }
    
    // Obtener palabras existentes de la base de datos
    let existingWords = await prisma.word.findMany({
      where: {
        consonantId: validatedOptions.consonantId,
        ...(validatedOptions.syllableCount && { syllables: validatedOptions.syllableCount }),
        ...(validatedOptions.difficulty && { difficulty: validatedOptions.difficulty })
      },
      include: { consonant: true }
    });
    
    // Si no hay suficientes palabras en la BD, generar desde el diccionario predefinido
    if (existingWords.length < validatedOptions.maxWords) {
      const wordsToGenerate = validatedOptions.maxWords - existingWords.length;
      const generatedWords = this.generateFromDictionary(
        consonant.letter,
        validatedOptions.syllableCount,
        validatedOptions.difficulty || 1,
        wordsToGenerate
      );
      
      // Guardar las nuevas palabras en la base de datos
      for (const wordData of generatedWords) {
        try {
          const newWord = await prisma.word.create({
            data: {
              text: wordData.text,
              syllables: wordData.syllables,
              difficulty: wordData.difficulty,
              consonantId: validatedOptions.consonantId
            },
            include: { consonant: true }
          });
          existingWords.push(newWord);
        } catch (error) {
          // Ignorar duplicados
          console.warn(`Palabra duplicada: ${wordData.text}`);
        }
      }
    }
    
    // Limitar a maxWords y mezclar
    return this.shuffleArray(existingWords).slice(0, validatedOptions.maxWords);
  }
  
  /**
   * Genera palabras desde el diccionario predefinido
   */
  private static generateFromDictionary(
    consonantLetter: string,
    syllableCount?: number,
    difficulty: number = 1,
    count: number = 15
  ): Array<{ text: string; syllables: number; difficulty: number }> {
    const consonantWords = WORD_DATABASE[consonantLetter.toUpperCase()];
    if (!consonantWords) {
      return [];
    }
    
    let availableWords: Array<{ text: string; syllables: number; difficulty: number }> = [];
    
    // Si se especifica número de sílabas, usar solo esas
    if (syllableCount && consonantWords[syllableCount]) {
      availableWords = consonantWords[syllableCount].map(word => ({
        text: word,
        syllables: syllableCount,
        difficulty: this.calculateDifficulty(word, syllableCount)
      }));
    } else {
      // Usar todas las palabras disponibles
      Object.entries(consonantWords).forEach(([syllables, words]) => {
        const syllableNum = parseInt(syllables);
        words.forEach(word => {
          availableWords.push({
            text: word,
            syllables: syllableNum,
            difficulty: this.calculateDifficulty(word, syllableNum)
          });
        });
      });
    }
    
    // Filtrar por dificultad si se especifica
    if (difficulty > 1) {
      availableWords = availableWords.filter(word => word.difficulty <= difficulty);
    }
    
    // Mezclar y tomar la cantidad solicitada
    return this.shuffleArray(availableWords).slice(0, count);
  }
  
  /**
   * Calcula la dificultad de una palabra basada en su longitud y sílabas
   */
  private static calculateDifficulty(word: string, syllables: number): number {
    if (syllables === 1) return 1;
    if (syllables === 2) return 2;
    if (syllables === 3 && word.length <= 6) return 3;
    if (syllables === 3 && word.length > 6) return 4;
    return 5;
  }
  
  /**
   * Mezcla un array usando el algoritmo Fisher-Yates
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Obtiene todas las consonantes disponibles
   */
  static async getAvailableConsonants() {
    return await prisma.consonant.findMany({
      orderBy: { letter: 'asc' }
    });
  }
  
  /**
   * Inicializa las consonantes básicas en la base de datos
   */
  static async initializeConsonants() {
    const consonants = [
      { letter: 'B', name: 'Be' },
      { letter: 'C', name: 'Ce' },
      { letter: 'D', name: 'De' },
      { letter: 'F', name: 'Efe' },
      { letter: 'G', name: 'Ge' },
      { letter: 'L', name: 'Ele' },
      { letter: 'M', name: 'Eme' },
      { letter: 'N', name: 'Ene' },
      { letter: 'P', name: 'Pe' },
      { letter: 'R', name: 'Erre' },
      { letter: 'S', name: 'Ese' },
      { letter: 'T', name: 'Te' }
    ];
    
    for (const consonant of consonants) {
      await prisma.consonant.upsert({
        where: { letter: consonant.letter },
        update: {},
        create: consonant
      });
    }
  }
}