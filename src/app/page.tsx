'use client';

import { useState, useEffect } from 'react';
import { ConsonantSelector, WordList, SyllableFilter } from '../components/components';
import { Consonant, Word } from '../lib/rules/types';
import { useSession } from '@/lib/auth-client';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { UserMenu } from '@/components/user-menu';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [consonants, setConsonants] = useState<Consonant[]>([]);
  const [selectedConsonant, setSelectedConsonant] = useState<Consonant | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [selectedSyllables, setSelectedSyllables] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingWords, setLoadingWords] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Generar o recuperar sessionId
  useEffect(() => {
    let storedSessionId = localStorage.getItem('anonymous-session-id');
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem('anonymous-session-id', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  // Cargar consonantes al iniciar
  useEffect(() => {
    fetchConsonants();
  }, []);

  // Migrar progreso anónimo cuando el usuario se autentica
  useEffect(() => {
    const migrateProgress = async () => {
      try {
        await fetch('/api/migrate-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            userId: session?.user?.id
          })
        });
      } catch (error) {
        console.error('Error migrating progress:', error);
      }
    };

    if (session?.user && sessionId) {
      migrateProgress();
    }
  }, [session?.user, sessionId]);



  const fetchConsonants = async () => {
    try {
      const response = await fetch('/api/consonants');
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          setConsonants(data);
        }
      }
    } catch (error) {
      console.error('Error fetching consonants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWords = async (consonant: Consonant, syllables?: number) => {
    setLoadingWords(true);
    try {
      const params = new URLSearchParams({
        consonantId: consonant.id,
        maxWords: '15'
      });
      
      if (syllables) {
        params.append('syllableCount', syllables.toString());
      }
      
      const response = await fetch(`/api/words?${params}`);
      if (response.ok) {
        const text = await response.text();
        if (text) {
          const data = JSON.parse(text);
          setWords(data);
        }
      }
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoadingWords(false);
    }
  };

  const handleConsonantSelect = (consonant: Consonant) => {
    setSelectedConsonant(consonant);
    setSelectedSyllables(null);
    fetchWords(consonant);
  };

  const handleActivityClick = (consonantId: string) => {
    router.push(`/activities/${consonantId}`);
  };

  const handleSyllableChange = (syllables: number | null) => {
    setSelectedSyllables(syllables);
    if (selectedConsonant) {
      fetchWords(selectedConsonant, syllables || undefined);
    }
  };

  const handleBack = () => {
    setSelectedConsonant(null);
    setWords([]);
    setSelectedSyllables(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-600">
          Cargando...
        </div>
      </div>
    );
  }

  if (selectedConsonant) {
    return (
      <div>
        <div className="p-4">
          <SyllableFilter
            selectedSyllables={selectedSyllables}
            onSyllableChange={handleSyllableChange}
          />
        </div>
        
        {loadingWords ? (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <div className="text-2xl font-semibold text-gray-600">
              Generando palabras...
            </div>
          </div>
        ) : (
          <WordList
            words={words}
            consonant={selectedConsonant}
            onBack={handleBack}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <UserMenu />
          </div>
          <div className="flex space-x-4">
            {session?.user && (
              <button
                onClick={() => router.push('/activities/progress')}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Mi Progreso
              </button>
            )}
          </div>
        </div>
        
        <ConsonantSelector
          consonants={consonants}
          onSelect={handleConsonantSelect}
          onActivityClick={handleActivityClick}
          isAuthenticated={!!session?.user}
        />
      </div>
    </div>
  );
}
