import { genKeys, encryptNum, decrypt } from "./HomoEncrypt.ts"
import type { PublicKey, PrivateKey } from "./HomoEncrypt.ts"
import { serialize } from "node:v8"
import * as fs from 'fs'

const plaintexts = [1n, 240n, 101010n, 2n ** 222n + 1234567890n, (2n ** 1023n) + 1n]
const plaintextSizes = plaintexts.map(bi => serialize(bi).byteLength)

type CorrectnessData = { pubKey: PublicKey, privKey: PrivateKey, ciphertexts: bigint[], ciphertextSizes: number[], decryptedPlaintexts: bigint[], decryptedPlaintextsMatch: boolean[] }
const table = Array<CorrectnessData>(20)

function main() {
  console.log("Correctness test starting");

  for (let i = 0; i < 20; i++) {
    console.log("Testing key " + (i+1).toString());
    const {pubKey, privKey} = genKeys();
    table[i] = {} as CorrectnessData;
    table[i].pubKey = pubKey;
    table[i].privKey = privKey;
    table[i].ciphertexts = Array<bigint>(5)
    table[i].ciphertextSizes = Array<number>(5)
    table[i].decryptedPlaintexts = Array<bigint>(5)
    table[i].decryptedPlaintextsMatch = Array<boolean>(5)
    for (let j = 0; j < 5; j++) {
      table[i].ciphertexts[j] = encryptNum(plaintexts[j], pubKey);
      table[i].ciphertextSizes[j] = serialize(table[i].ciphertexts[j]).byteLength;
      table[i].decryptedPlaintexts[j] = decrypt(table[i].ciphertexts[j], table[i].pubKey, table[i].privKey);
      // console.log("plaintext " + (j+1).toString() + " original: " + plaintexts[j].toString() + ", decrypted: " + table[i].decryptedPlaintexts[j].toString());
      table[i].decryptedPlaintextsMatch[j] = (table[i].decryptedPlaintexts[j] == plaintexts[j]);
    }
  }

  const logFile = fs.createWriteStream("../../../data/correctness.txt", {flags: 'a'});
  for (let j = 0; j < 5; j++) {
    logFile.write("Plaintext " + (j+1).toString() + ": " + plaintexts[j].toString() + " with size " + plaintextSizes[j].toString() + "\n");
    logFile.write("n | g | lambda | mu | ciphertext | ciphertext size | decrypted plaintext | decrypted plaintext correct?\n")
    for (let i = 0; i < 20; i++) {
      logFile.write(table[i].pubKey.n.toString() + " | " + table[i].pubKey.g.toString() + " | " + table[i].privKey.lambda.toString() + " | " + table[i].privKey.mu.toString() + " | " + table[i].ciphertexts[j].toString() + " | " + table[i].ciphertextSizes[j].toString() + " | " + table[i].decryptedPlaintexts[j].toString() + " | " + table[i].decryptedPlaintextsMatch[j].toString() + "\n")
    }
  }
}

main();