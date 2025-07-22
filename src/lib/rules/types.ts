export interface Consonant {
  id: string;
  letter: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  words?: Word[];
}

export interface Word {
  id: string;
  text: string;
  syllables: number;
  difficulty: number;
  consonantId: string;
  consonant?: Consonant;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgress {
  id: string;
  sessionId: string;
  consonantId: string;
  wordsCompleted: number;
  totalWords: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WordGeneratorOptions {
  consonantId: string;
  syllableCount?: number;
  difficulty?: number;
  maxWords?: number;
}

export interface ConsonantSelectionProps {
  consonants: Consonant[];
  onSelect: (consonant: Consonant) => void;
}

export interface WordCardProps {
  word: Word;
  onComplete?: (wordId: string) => void;
}

export interface WordListProps {
  words: Word[];
  maxWords?: number;
  onWordComplete?: (wordId: string) => void;
}