-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UsuariosPropriedades" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idUsuario" INTEGER NOT NULL,
    "idPropriedade" INTEGER NOT NULL,
    "permissao" TEXT NOT NULL,
    "dataVinculo" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroDeFracoes" INTEGER NOT NULL DEFAULT 0,
    "saldoDiariasAtual" REAL NOT NULL DEFAULT 0.0,
    "saldoDiariasFuturo" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "excludedAt" DATETIME,
    CONSTRAINT "UsuariosPropriedades_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UsuariosPropriedades_idPropriedade_fkey" FOREIGN KEY ("idPropriedade") REFERENCES "Propriedades" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UsuariosPropriedades" ("createdAt", "dataVinculo", "excludedAt", "id", "idPropriedade", "idUsuario", "numeroDeFracoes", "permissao", "saldoDiariasAtual", "updatedAt") SELECT "createdAt", "dataVinculo", "excludedAt", "id", "idPropriedade", "idUsuario", "numeroDeFracoes", "permissao", "saldoDiariasAtual", "updatedAt" FROM "UsuariosPropriedades";
DROP TABLE "UsuariosPropriedades";
ALTER TABLE "new_UsuariosPropriedades" RENAME TO "UsuariosPropriedades";
CREATE UNIQUE INDEX "UsuariosPropriedades_idUsuario_idPropriedade_key" ON "UsuariosPropriedades"("idUsuario", "idPropriedade");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
