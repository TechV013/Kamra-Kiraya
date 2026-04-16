const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const sourceDir = path.join(projectRoot, "node_modules", ".prisma", "client");
const targetDir = path.join(projectRoot, "node_modules", "@prisma", "client", ".prisma", "client");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source path does not exist: ${src}`);
  }

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

try {
  if (!fs.existsSync(sourceDir)) {
    console.log("No generated Prisma client found at:", sourceDir);
    process.exit(0);
  }

  copyRecursive(sourceDir, targetDir);
  console.log("Prisma client sync complete:", targetDir);
  process.exit(0);
} catch (error) {
  console.error("Failed to sync Prisma client:", error);
  process.exit(1);
}
