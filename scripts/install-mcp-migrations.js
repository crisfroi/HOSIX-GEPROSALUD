#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mcpDir = path.join(__dirname, "..", ".mcp");

console.log("📦 Instalando MCP Migrations...\n");

try {
  const packagePath = path.join(mcpDir, "package.json");
  if (!fs.existsSync(packagePath)) {
    console.error("❌ No se encuentra .mcp/package.json");
    process.exit(1);
  }

  console.log("📥 Instalando dependencias...");
  execSync("npm install", { cwd: mcpDir, stdio: "inherit" });

  console.log("\n🔗 Creando enlace global...");
  execSync("npm link", { cwd: mcpDir, stdio: "inherit" });

  console.log("\n✅ ¡Instalación completada!");
  console.log("\n📖 Uso:");
  console.log("  mcp exec migrations list_migrations");
  console.log("  mcp exec migrations list_tables");
  console.log("  mcp exec migrations apply_migration --file <file.sql>");
  console.log("\n📚 Ver: .mcp/README-MIGRATIONS.md\n");
} catch (error) {
  console.error("❌ Error durante la instalación:", error.message);
  process.exit(1);
}
