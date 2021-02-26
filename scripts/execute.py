import boto3
import json
import sys


def main(processor):
    cfn = boto3.client('cloudformation')
    sfn = boto3.client('stepfunctions')

    stack = cfn.describe_stacks(
        StackName='StepFunctionStack'
    )['Stacks'][0]
    outputs = stack["Outputs"]
    state_machine_arn = [ output["OutputValue"] for output in outputs if output["OutputKey"] == "StateMachineArn"][0]

    sfn.start_execution(
        stateMachineArn=state_machine_arn,
        input=json.dumps({"processor": processor})
    )

if __name__ == "__main__":
    main(sys.argv[1])