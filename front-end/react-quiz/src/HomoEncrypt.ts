// import {randomBytes} from "node:crypto";
// TODO: Push changes after verifying everything works as it should be.

// Public key pair: (n, g), although technically (n, n^2, g) for this implementation.
// Private key pair: (lambda, mu)

// Some Notes! //
/*
* I vaguely remember needing to install something to get this working properly, although I'm not quite sure what. It should prompt.
* 
* I'm using the commandline commands "npx tsx <filename.ts>" to run this, hopefully this doesn't cause issues on your end and lmk if it does.
*/

// replaces node:crypto with browser's web crypto api
function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

interface primePair {
    p: bigint;
    q: bigint;
}

export interface PublicKey {
    n: bigint;
    nSqur: bigint;
    g: bigint;
}

export interface PrivateKey {
    lambda: bigint;
    mu: bigint;
}

// full key generation usable by app
export function genKeys() : {pubKey: PublicKey, privKey: PrivateKey} {
    const primes = findPrimes();
    return makeKeys(primes.primes);
}

//__START OF NEEDED FUCNTIONS__//

function findPrimes(): {primes: primePair} {
    const p = randPrime();
    const q = randPrime();

    return {primes: {p, q}}
}

/**
 * 
 * @returns Public and private key interfaces.
 * @brief 
 */
function makeKeys(primes: primePair): {pubKey: PublicKey; privKey: PrivateKey} {
    const p = primes.p;
    const q = primes.q;
    const n: bigint = p * q; // First half of the public key pair.
    const nSqur: bigint = n * n
    const g: bigint = n + 1n; // This is the generator and second half of the public key pair.
    const lambda: bigint = ((p - 1n) * (q - 1n)) / gcd(p - 1n, q - 1n); // LCM((p - 1), (q - 1))

    const x = modPow(g, lambda, (n ** 2n));
    const lVal = (x - 1n) / n;
    const mu = modInverse(lVal, n);

    return {pubKey: {n, nSqur, g}, privKey : {lambda, mu},}; // Return our key pairs.

}

/**
 * 
 * @param msg 
 * @returns bigint[]
 * @brief Encrypt the input array.
 */
export function encArr(msg: number[], pubKey: PublicKey): bigint[] {
    const bigArr: bigint[] = msg.map(BigInt); // Convert number array to bigint array.

    // Encrypt each entry in the array with a new r, which is within the set of integers modulo n.
    for (let i = 0; i < bigArr.length; i += 1) {
        let r = genR(pubKey.n);
        bigArr[i] = encrypt(bigArr[i], pubKey, r);
    }

    return bigArr;
}

/**
 * 
 * @param ctxt 
 * @returns bigint[]
 * @brief Decrypt the input array.
 */
function decArr(ctxt: bigint[], pubKey: PublicKey, privKey: PrivateKey): bigint[] {
    return ctxt.map((c) => decrypt(c, pubKey, privKey)); // Decrypt each element in the array.
}

//__END OF NEEDED FUNCTIONS__//

//__EXAMPLE USES__//

// Uncomment and run the file to check.

// const {primes} = findPrimes();

// const {pubKey, privKey} = makeKeys(primes);

// const inputValues: number[] = [1, 0, 0, 1, 1];
// const encryptedValues = encArr(inputValues, pubKey);
// const decryptedValues = decArr(encryptedValues, pubKey, privKey);

// console.log("Original array:", inputValues);
// console.log("Decrypted array:", decryptedValues);


// Functions below this shouldn't need to be called by you.

function gcd(p: bigint, q: bigint): bigint {
    while (q !== 0n) {
        [p, q] = [q, p % q];
    }

    return p;
}

// (g^m * r^n) mod n^2
function encrypt(m: bigint, pubKey: PublicKey, randNum: bigint): bigint {
    const {n, nSqur, g} = pubKey;
    const gm = modPow(g, m, nSqur); // g^m
    const rn = modPow(randNum, n, nSqur); // r^n

    return (gm * rn) % nSqur;
}

// (L(c^lambda mod n^2) * mu) mod n
export function decrypt(c: bigint, pubKey: PublicKey, privKey: PrivateKey): bigint {
    const {n, nSqur} = pubKey;
    const {lambda, mu} = privKey;

    const u = modPow(c, lambda, nSqur); // c^lambda mod n^2
    const lVal = (u - 1n) / n; // ((c^lambda mod n^2) - 1) / n

    return (lVal * mu) % n;
}

function genR(i: bigint){
    while (true) {
    const r = randomBigIntRange(1n, i - 1n);
    
    if (gcd(r, i) === 1n) {
        return r;
    }
  }
}

function randomBigIntRange(min: bigint, max: bigint): bigint {
    const range = max - min + 1n;
    const bits = range.toString(2).length;

    while (true) {
    const candidate = randomBigIntBits(bits);
    if (candidate < range) {
        return min + candidate;
    }
  }
}

//
function randomBigIntBits(bits: number): bigint {
    const byteLength = Math.ceil(bits / 8);
    const bytes = new Uint8Array(byteLength);
    globalThis.crypto.getRandomValues(bytes);
    const excessBits = byteLength * 8 - bits;

    if (excessBits > 0) {
        bytes[0] &= 0xff >>> excessBits;
    }

    // Force the top bit to 1 so the number is guaranteed to be 'bits' wide. In this case 1024 bits.
    const topBitMask = 1 << (7 - excessBits);
    bytes[0] |= topBitMask;

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return BigInt("0x" + hex);
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    if (mod === 1n) return 0n;
    let result = 1n;
    let b = base % mod;
    let e = exp;

    while (e > 0n) {
        if ((e & 1n) === 1n) {
            result = (result * b) % mod;
        }
        b = (b * b) % mod;
        e >>= 1n;
    }

    return result;
}

function extendedGcd(a: bigint, b: bigint): {g: bigint; x: bigint; y: bigint} {
    let oldr = a, r = b;
    let olds = 1n, s = 0n;
    let oldt = 0n, t = 1n;

    while (r !== 0n) {
        const q = oldr / r;
        [oldr, r] = [r, oldr - q * r];
        [olds, s] = [s, olds - q * s];
        [oldt, t] = [t, oldt - q * t];
    }

    return {g: oldr, x: olds, y: oldt};
}

function modInverse(a: bigint, m: bigint): bigint {
    const {x} = extendedGcd(((a % m) + m) % m, m);

    return ((x % m) + m) % m;
}

// Generating primes.

function BigIntInRange(min: bigint, max: bigint): bigint {
  const span = max - min + 1n;
  const byteLength = Math.ceil(span.toString(2).length / 8);
  const maxValid = ((1n << BigInt(byteLength * 8)) / span) * span;

  while (true) {
    const rand = BigInt("0x" + Array.from(randomBytes(byteLength), (b) => b.toString(16).padStart(2, '0')).join(''));
    if (rand < maxValid) {
      return min + (rand % span);
    }
  }
}

function isPrime(n: bigint, k = 20): boolean {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if ((n & 1n) === 0n) return false;

    let d = n - 1n;
    let r = 0n;
    while ((d & 1n) === 0n) {
        d >>= 1n;
        r += 1n;
    }

    for (let i = 0; i < k; i++) {
        const a = BigIntInRange(2n, n - 2n);
        let x = modPow(a, d, n);

        if (x === 1n || x === n - 1n) continue;

        let composite = true;
        for (let j = 1n; j < r; j++) {
            x = (x * x) % n;
            if (x === n - 1n) {
                composite = false;
                break;
            }
        }
    if (composite) return false;
    }

  return true;
}

function randPrime(bits = 1024, smallPrimes: bigint[] = []): bigint {
    const min = (1n << BigInt(bits - 1)) + 1n;
    const max = (1n << BigInt(bits)) - 1n;

    while (true) {
        let candidate = BigIntInRange(min, max);
        if ((candidate & 1n) === 0n) candidate += 1n;
        if (candidate > max) continue;

    let divBySmall = false;
    for (const p of smallPrimes) {
        if (p * p > candidate) break;
        if (candidate % p === 0n) {
            divBySmall = true;
            break;
        }
    }

    if (divBySmall) continue;

    if (isPrime(candidate, 40)) {
      return candidate;
    }
  }
}
