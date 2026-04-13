-- CreateEnum
CREATE TYPE "LiveStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "LiveVisibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');

-- CreateTable
CREATE TABLE "lives" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "status" "LiveStatus" NOT NULL DEFAULT 'SCHEDULED',
    "visibility" "LiveVisibility" NOT NULL DEFAULT 'PUBLIC',
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hostId" TEXT NOT NULL,

    CONSTRAINT "lives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_properties" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "shownAt" TIMESTAMP(3),
    "liveId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "live_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liveId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "live_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_reactions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liveId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "live_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_viewers" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "watchTime" INTEGER,
    "socketId" TEXT,
    "liveId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "live_viewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_shares" (
    "id" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liveId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "live_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lives_hostId_status_idx" ON "lives"("hostId", "status");

-- CreateIndex
CREATE INDEX "lives_status_visibility_idx" ON "lives"("status", "visibility");

-- CreateIndex
CREATE INDEX "lives_scheduledAt_idx" ON "lives"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "live_properties_liveId_propertyId_key" ON "live_properties"("liveId", "propertyId");

-- CreateIndex
CREATE INDEX "live_messages_liveId_createdAt_idx" ON "live_messages"("liveId", "createdAt");

-- CreateIndex
CREATE INDEX "live_reactions_liveId_idx" ON "live_reactions"("liveId");

-- CreateIndex
CREATE INDEX "live_viewers_liveId_joinedAt_idx" ON "live_viewers"("liveId", "joinedAt");

-- AddForeignKey
ALTER TABLE "lives" ADD CONSTRAINT "lives_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_properties" ADD CONSTRAINT "live_properties_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "lives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_properties" ADD CONSTRAINT "live_properties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_messages" ADD CONSTRAINT "live_messages_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "lives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_messages" ADD CONSTRAINT "live_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_reactions" ADD CONSTRAINT "live_reactions_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "lives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_reactions" ADD CONSTRAINT "live_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_viewers" ADD CONSTRAINT "live_viewers_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "lives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_viewers" ADD CONSTRAINT "live_viewers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_shares" ADD CONSTRAINT "live_shares_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "lives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_shares" ADD CONSTRAINT "live_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
