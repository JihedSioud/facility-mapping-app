import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("src", "main.js");
const destination = resolve("index.js");

const contents = readFileSync(source, "utf-8");
writeFileSync(destination, contents, "utf-8");
console.log(`Built ${destination} from ${source}`);
