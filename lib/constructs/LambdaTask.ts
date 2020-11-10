import { Construct } from "@aws-cdk/core";

import {
  Function,
  Runtime,
  AssetCode,
} from "@aws-cdk/aws-lambda";

import {
  LambdaInvoke,
} from "@aws-cdk/aws-stepfunctions-tasks";

export interface LambdaTaskProps {
  codeLocation: string,
  handler: string,
  runtime: Runtime,
  resultPath: string,
}

export default class LambdaTask extends Construct {
  public readonly function: Function;
  public readonly task: LambdaInvoke;

  constructor(scope: Construct, id: string, props: LambdaTaskProps) {
    super(scope, id);

    const { 
      codeLocation,
      handler,
      runtime,
      resultPath,
    } = props;

    this.function = new Function(this, "Function", {
      runtime: runtime,
      handler: handler,
      code: new AssetCode(codeLocation),
    });

    this.task = new LambdaInvoke(this, "LambdaTask", {
      lambdaFunction: this.function,
      payloadResponseOnly: true,
      resultPath: resultPath,
    });

  }
}
