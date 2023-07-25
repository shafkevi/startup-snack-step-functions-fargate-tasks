import * as path from "path";

import { Construct } from "constructs";
import { Stack, CfnOutput, StackProps } from 'aws-cdk-lib';
import { aws_ec2 as ec2, aws_lambda as lambda, aws_ecs as ecs } from "aws-cdk-lib";
import { aws_stepfunctions as stepfunctions } from "aws-cdk-lib";


import FargateTask from "../constructs/FargateTask";
import LambdaTask from "../constructs/LambdaTask";

export interface SfnStackProps extends StackProps{
  version: string,
}

export default class StepFunctionStack extends Stack {
  private readonly assetPath = path.join(__dirname, "..", "..", "assets");

  constructor(scope: Construct, id: string, props?: SfnStackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "Vpc", { isDefault: true });

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
      clusterName: "StartupSnack-StepFunctionsFargateTasks"
    });

    const pi = new FargateTask(this, "Pi", {
      cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      dockerfileLocation: path.join(this.assetPath, "fargate", "pi"),
      repositoryName: "digits-of-pi",
      logGroupName: "PiLogGroup",
      resultPath: "$.piValue",
      integrationPattern: stepfunctions.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      environment: [
        {
          name: "digits",
          value: stepfunctions.JsonPath.stringAt("$.digits"),
        },
        {
          name: "taskToken",
          value: stepfunctions.JsonPath.taskToken,
        }
      ]
    });

    const euler = new FargateTask(this, "Euler", {
      cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      dockerfileLocation: path.join(this.assetPath, "fargate", "euler"),
      repositoryName: "digits-of-euler",
      logGroupName: "EulerLogGroup",
      integrationPattern: stepfunctions.IntegrationPattern.RUN_JOB,
      resultPath: "$.eulerValue",
      environment: [
        {
          name: "digits",
          value: stepfunctions.JsonPath.stringAt("$.digits"),
        },
      ]
    });

    const decider = new LambdaTask(this, "Decider", {
      codeLocation: path.join(this.assetPath, "lambda", "decider"),
      handler: "index.main",
      runtime: lambda.Runtime.PYTHON_3_7,
      resultPath: "$",
    });

    const staticPi = new stepfunctions.Pass(this, "staticPiTask", {
      result: stepfunctions.Result.fromObject({ value: "3.141592653589793" })
    });

    const staticEuler = new stepfunctions.Pass(this, "staticEulerTask", {
      result: stepfunctions.Result.fromObject({ value: "2.718281828459045" })
    });

    const finishingStep = new stepfunctions.Pass(this, "FinishingStep");

    const staticParallelStep = new stepfunctions.Parallel(this, "StaticParallelStep")
      .branch(staticPi)
      .branch(staticEuler)
      .next(finishingStep);

    const decisionStep = new stepfunctions.Choice(this, "DecisionStep")
      .when(stepfunctions.Condition.stringEquals("$.processor", "euler"), stepfunctions.Chain
        .start(euler.task)
        .next(finishingStep))
      .when(stepfunctions.Condition.stringEquals("$.processor", "pi"), stepfunctions.Chain
        .start(pi.task)
        .next(finishingStep))
      .when(stepfunctions.Condition.stringEquals("$.processor", "both"), staticParallelStep)
      .otherwise(finishingStep);

    const stateMachine = new stepfunctions.StateMachine(this, "StateMachine", {
      stateMachineName: "StartupSnack-StepFunctionsFargateTasks",
      definition: stepfunctions.Chain.start(decider.task).next(decisionStep)
    });

    stateMachine.grantTaskResponse(pi.taskDefinition.taskRole);

    new CfnOutput(this, "StateMachineArn", {
      value: stateMachine.stateMachineArn
    });
  }
}
