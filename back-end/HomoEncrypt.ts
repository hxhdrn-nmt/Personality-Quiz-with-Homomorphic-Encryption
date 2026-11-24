// Public key pair: (n, g), although technically (n, n^2, g) for this implementation.
// Private key pair: (lambda, mu)

// Some Notes! //
/*
* I vaguely remember needing to install something to get this working properly, although I'm not quite sure what. It should prompt.
* 
* I'm using the commandline commands "npx tsx <filename.ts>" to run this, hopefully this doesn't cause issues on your end and lmk if it does.
*/

// Hard coded values for controlled testing.
// First big prime (1024 bits).
const p: bigint = 152554835228812668185792564298635128851884527386913890692824523018710638856870683659829720033570348075856225156884017632668749118868572311819379950306739024040112393381449009678137252722851946679117797641866751951116566240884890323412691039945617547504287990544909732869742343979297185483501937933130774406843n;
// Second big prime (1024 bits).
const q: bigint = 113350571129461334591426767450329881356535326327593222579132777967299353626808792543281478934272286346044813387031938240916780587992812593536452474623292367872080470943598892906746651629345726935408118138705622653406680291116602897245460926769863200090374034672855301327867180944894109426731250582998877755899n;
const r: bigint = 24n; // This is the random number we multiply by during encryption. Change at will.

interface PublicKey {
    n: bigint;
    nSqur: bigint; // makeKeys() gets angry without this.
    g: bigint;
}

interface PrivateKey {
    lambda: bigint;
    mu: bigint;
}

const {pubKey, privKey} = makeKeys(p, q);

//__END OF HARD CODED VALUES__//

//__START OF NEEDED FUCNTIONS__//

/**
 * 
 * @param msg 
 * @returns bigint[]
 * @brief Encrypt the input array.
 */
function encArr(msg: number[], pubKey: PublicKey): bigint[] {
    const bigArr: bigint[] = msg.map(BigInt); // Convert number array to bigint array.

    return bigArr.map((m) => encrypt(m, pubKey, r)); // Encrypt each entry in the array.
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

function makeKeys(p: bigint, q: bigint): {pubKey: PublicKey; privKey: PrivateKey} {
    const n: bigint = p * q; // First half of the public key pair.
    const nSqur: bigint = n * n
    const g: bigint = n + 1n; // This is the generator and second half of the public key pair.
    const lambda: bigint = ((p - 1n) * (q - 1n)) / gcd(p - 1n, q - 1n); // LCM((p - 1), (q - 1))

    const x = modPow(g, lambda, (n ** 2n));
    const lVal = (x - 1n) / n;
    const mu = modInverse(lVal, n);

    return {pubKey: {n, nSqur, g}, privKey : {lambda, mu},}; // Return our key pairs.

}

// (g^m * r^n) mod n^2
function encrypt(m: bigint, pubKey: PublicKey, randNum: bigint): bigint {
    const {n, nSqur, g} = pubKey;
    const gm = modPow(g, m, nSqur); // g^m
    const rn = modPow(randNum, n, nSqur); // r^n

    return (gm * rn) % nSqur;
}

// (L(c^lambda mod n^2) * mu) mod n
function decrypt(c: bigint, pubKey: PublicKey, privKey: PrivateKey): bigint {
    const {n, nSqur} = pubKey;
    const {lambda, mu} = privKey;

    const u = modPow(c, lambda, nSqur); // c^lambda mod n^2
    const lVal = (u - 1n) / n; // ((c^lambda mod n^2) - 1) / n

    return (lVal * mu) % n;
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

function extendedGcd(a: bigint, b: bigint): { g: bigint; x: bigint; y: bigint } {
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
