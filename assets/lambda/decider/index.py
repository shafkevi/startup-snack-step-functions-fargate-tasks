import random

def main(event, context):
    return {
        "digits": str(random.randint(1, 25)),
        "processor": (random.choice(["both", "pi", "euler", "none"])
            if "processor" not in event else event["processor"])
    }
