import { Construct } from "constructs";

import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_stepfunctions_tasks as stepfunctions_tasks } from "aws-cdk-lib";

export interface LambdaTaskProps {
  codeLocation: string,
  handler: string,
  runtime: lambda.Runtime,
  resultPath: string,
}

export default class LambdaTask extends Construct {
  public readonly function: lambda.Function;
  public readonly task: stepfunctions_tasks.LambdaInvoke;

  constructor(scope: Construct, id: string, props: LambdaTaskProps) {
    super(scope, id);

    const { 
      codeLocation,
      handler,
      runtime,
      resultPath,
    } = props;

    this.function = new lambda.Function(this, "Function", {
      runtime: runtime,
      handler: handler,
      code: new lambda.AssetCode(codeLocation),
    });

    this.task = new stepfunctions_tasks.LambdaInvoke(this, "LambdaTask", {
      lambdaFunction: this.function,
      payloadResponseOnly: true,
      resultPath: resultPath,
    });

  }
}
