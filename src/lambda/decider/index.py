import random

def main(event, context):
    if "processor" in event:
        return {"processor": event["processor"], "digits": str(random.randint(1,25))}
    else:
        return {"processor": random.choice(["both", "pi", "euler", "none"]), "digits": str(random.randint(1,25))}