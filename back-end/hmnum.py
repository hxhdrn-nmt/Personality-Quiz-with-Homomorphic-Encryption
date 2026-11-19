class enc_arithmetic:
    def __init__(self, n, mode):
        self.nsq = n ** 2   # n squared
        self.encMode = mode

    def makenum(self, num: int):
        return hmnum(num, self)
    
    def add(self, num1, num2): # should be hmnums
        res = num1.val
        if (self.encMode):
            res *= num2.val
        else:
            res += num2.val
        res %= self.nsq
        return hmnum(res, self)

    def mul(self, num, scalar: int):
        res = num.val
        if (self.encryptedMode):
            res **= scalar
        else:
            res *= scalar
        res %= self.nsq
        return hmnum(res, self)

# homomorphic number: uses encrypted-side operations
class hmnum:
    def __init__(self, val: int, arith: enc_arithmetic):
        self.val = val
        self.arithmetic = arith

    def __add__(self, other): # other should be an hmnum
        return self.arithmetic.add(self, other)

    def __mul__(self, other: int):
        return self.arithmetic.mul(self, other)