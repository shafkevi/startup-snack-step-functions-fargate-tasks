import random

def main(event, context):
    return {"processor": random.choice(["both", "pi", "euler", "none"]), "digits": str(random.randint(1,25))}