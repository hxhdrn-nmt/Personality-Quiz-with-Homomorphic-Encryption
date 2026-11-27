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
        if isinstance(num2, int):
            if self.encMode:
                return self.makenum((num1.val * pow(self.G, num2, self.NSQ)) % self.NSQ)
            else:
                return self.makenum(num1.val + num2)
        else:
            if self.encMode:
                return self.makenum((num1.val * num2.val) % self.NSQ)
            else:
                return self.makenum(num1.val + num2.val)
            
    def iadd(self, num1, num2):
        if isinstance(num2, int):
            if self.encMode:
                num1.val = (num1.val * pow(self.G, num2, self.NSQ)) % self.NSQ
            else:
                num1.val += num2
        else:
            if self.encMode:
                num1.val = (num1.val * num2.val) % self.NSQ
            else:
                num1.val = num1.val + num2.val

    def mul(self, num, scalar: int):
        if self.encMode:
            return self.makenum(pow(num.val, scalar, self.NSQ))
        else:
            return self.makenum(num.val * scalar)

    def imul(self, num, scalar: int):
        if self.encMode:
            num.val = pow(num.val, scalar, self.NSQ)
        else:
            num.val = num.val * scalar

    def gen_r(self):
        r: int = secrets.randbelow(self.N-1) + 1
        while (math.gcd(r, self.N) != 1):
            r = secrets.randbelow(self.N-1) + 1
        return r

    def gen_0(self):
        if self.encMode:
            return self.makenum(pow(self.gen_r(), self.N, self.NSQ))
        else:
            return self.makenum(0)

# homomorphic number: uses encrypted-side operations
class hmnum:
    def __init__(self, val: int, arith: enc_arithmetic):
        self.val = val
        self.arithmetic = arith

    def __add__(self, other): # other can be an hmnum or int
        return self.arithmetic.add(self, other)

    def __iadd__(self, other):
        self.arithmetic.iadd(self, other)
        return self

    def __mul__(self, other: int):
        return self.arithmetic.mul(self, other)

    def __imul__(self, other: int):
        self.arithmetic.imul(self, other)
        return self

    def refresh(self):
        self += self.arithmetic.gen_0()

