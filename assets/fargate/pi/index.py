#!/usr/bin/python
import os
import json
import math
import boto3
from decimal import Decimal as D
from decimal import getcontext

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, D):
            return str(obj)
        # Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)

def digits_of_pi(digits):
    getcontext().prec = digits+1
    pi = D(0)
    for k in range(digits):
        pi += D(math.pow(16, -k)) * (D(4/(8*k+1)) - D(2/(8*k+4)) - D(1/(8*k+5)) - D(1/(8*k+6)))
    return pi


def main():
    digits = int(os.getenv("digits"))
    task_token = os.getenv("taskToken")

    print("State Machine Task Token: {}".format(task_token))
    print("Digits to calculate: {}".format(digits))

    pi = digits_of_pi(digits)
    print("Pi to {} digits: {}".format(digits, pi))

    sfn = boto3.client('stepfunctions')
    sfn.send_task_success(
        taskToken=task_token,
        output=json.dumps({"value": pi}, cls=DecimalEncoder)
    )

if __name__ == "__main__":
    main()
