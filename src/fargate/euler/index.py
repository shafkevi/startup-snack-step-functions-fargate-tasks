#!/usr/bin/python
import os
digits = int(os.getenv("digits"))
print('digits --> {}'.format(digits))

# https://github.com/microice333/Python-projects/blob/master/n_digit_e.py
# find e to nth digit by brothers' formulae: http://www.intmath.com/exponential-logarithmic-functions/calculating-e.php
import decimal


def factorial(n):
    factorials = [1]
    for i in range(1, n + 1):
        factorials.append(factorials[i - 1] * i)
    return factorials


def compute_e(n):
    decimal.getcontext().prec = n + 1
    e = 2
    factorials = factorial(2 * n + 1)
    for i in range(1, n + 1):
        counter = 2 * i + 2
        denominator = factorials[2 * i + 1]
        e += decimal.Decimal(counter / denominator)
    return e


print('e --> {}'.format(str(compute_e(digits))[:digits + 1]))