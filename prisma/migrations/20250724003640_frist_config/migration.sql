-- CreateTable
CREATE TABLE "consonants" (
    "id" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consonants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "syllables" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "consonantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "consonantId" TEXT NOT NULL,
    "wordsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalWords" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consonants_letter_key" ON "consonants"("letter");

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "words_consonantId_fkey" FOREIGN KEY ("consonantId") REFERENCES "consonants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
