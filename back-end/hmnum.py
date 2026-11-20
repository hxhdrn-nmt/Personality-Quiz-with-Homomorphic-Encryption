import secrets, math

class enc_arithmetic:
    def __init__(self, n, g, mode):
        self.N = n
        self.NSQ = n * n   # n squared
        self.G = g  # generator
        self.encMode = mode     # encrypted or unencrypted?

    def makenum(self, num: int):
        return hmnum(num, self)
    
    def add(self, num1, num2): # should be hmnums
        if self.encMode:
            return (num1.val * num2.val) % self.NSQ
        else:
            return (num1.val + num2.val) % self.NSQ


    def mul(self, num, scalar: int):
        if self.encMode:
            return pow(num.val, scalar, self.NSQ)
        else:
            return (num.val * scalar) % self.NSQ

    def gen_r(self):
        r: int = secrets.randbelow(self.N-1) + 1
        while (math.gcd(r, self.N) != 1):
            r = secrets.randbelow(self.N-1) + 1
        return r

    def gen_0(self):
        if self.encMode:
            return self.makenum(pow(self.gen_r(), self.N, self.NSQ))
        else:
            return 0

# homomorphic number: uses encrypted-side operations
class hmnum:
    def __init__(self, val: int, arith: enc_arithmetic):
        self.val = val
        self.arithmetic = arith

    def __add__(self, other): # other should be an hmnum
        return self.arithmetic.add(self, other)

    def __mul__(self, other: int):
        return self.arithmetic.mul(self, other)

    def refresh(self):
        self = self + self.arithmetic.gen_0()