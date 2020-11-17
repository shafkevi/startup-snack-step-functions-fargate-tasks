#!/usr/bin/python
import os
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

def main():
    digits = int(os.getenv("digits"))
    print("Digits to calculate: {}".format(digits))
    print("Euler number to {} digits: {}".format(digits, str(compute_e(digits))[:digits + 1]))


if __name__ == "__main__":
    main()
