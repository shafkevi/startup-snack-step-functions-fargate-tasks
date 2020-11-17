import random

def main(event, context):
    if "processor" in event:
        print("Received processor in event input: {}".format(event["processor"]))
        output = {"processor": event["processor"], "digits": str(random.randint(1,25))}
    else:
        output = {"processor": random.choice(["both", "pi", "euler", "none"]), "digits": str(random.randint(1,25))}

    print("Processor: {}".format(output["processor"]))
    print("Digits: {}".format(output["digits"]))

    return output