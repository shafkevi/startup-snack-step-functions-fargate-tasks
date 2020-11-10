#!/usr/bin/python
import os
import json
import math
from decimal import Decimal as D
from decimal import getcontext

digits = int(os.getenv("digits"))
print('digits --> {}'.format(digits))
task_token = os.getenv("taskToken")
print('taskToken --> {}'.format(task_token))

"""
Pi = SUM k=0 to infinity 16^-k [ 4/(8k+1) - 2/(8k+4) - 1/(8k+5) - 1/(8k+6) ]
ref: https://www.math.hmc.edu/funfacts/ffiles/20010.5.shtml
https://github.com/Flowerowl/Projects/blob/master/solutions/numbers/find_pi_to_the_nth_digit.py
"""
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

pi = digits_of_pi(digits)
print('Pi --> {}'.format(pi))

import boto3
sfn = boto3.client('stepfunctions')

sfn.send_task_success(
    taskToken=task_token,
    output=json.dumps({"value": pi}, cls=DecimalEncoder)
)