import path from "path";

import { Construct, Stack, StackProps, CfnOutput } from "@aws-cdk/core";
import { Vpc } from "@aws-cdk/aws-ec2";
import { Runtime } from "@aws-cdk/aws-lambda";
import { Cluster } from "@aws-cdk/aws-ecs";
import {
  Chain,
  Choice,
  Condition,
  IntegrationPattern,
  JsonPath,
  Parallel,
  Pass,
  Result,
  StateMachine
} from "@aws-cdk/aws-stepfunctions";


import FargateTask from "../constructs/FargateTask";
import LambdaTask from "../constructs/LambdaTask";

export default class StepFunctionStack extends Stack {
  private readonly assetPath = path.join(__dirname, "..", "..", "assets");

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, "Vpc", { isDefault: true });

    const cluster = new Cluster(this, "Cluster", {
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
      integrationPattern: IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      environment: [
        {
          name: "digits",
          value: JsonPath.stringAt("$.digits"),
        },
        {
          name: "taskToken",
          value: JsonPath.taskToken,
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
      integrationPattern: IntegrationPattern.RUN_JOB,
      environment: [
        {
          name: "digits",
          value: JsonPath.stringAt("$.digits"),
        },
      ]
    });

    const decider = new LambdaTask(this, "Decider", {
      codeLocation: path.join(this.assetPath, "lambda", "decider"),
      handler: "index.main",
      runtime: Runtime.PYTHON_3_7,
      resultPath: "$",
    });

    const staticPi = new Pass(this, "staticPiTask", {
      result: Result.fromObject({ value: "3.141592653589793" })
    });

    const staticEuler = new Pass(this, "staticEulerTask", {
      result: Result.fromObject({ value: "2.718281828459045" })
    });

    const finishingStep = new Pass(this, "FinishingStep");

    const stateMachineDefinition = Chain.start(decider.task);

    const staticParallelStep = new Parallel(this, "StaticParallelStep");
    staticParallelStep.branch(staticPi);
    staticParallelStep.branch(staticEuler);
    staticParallelStep.next(finishingStep);

    const eulerProcess = Chain.start(euler.task);
    eulerProcess.next(finishingStep);

    const piProcess = Chain.start(pi.task);
    piProcess.next(finishingStep);

    const decisionStep = new Choice(this, "DecisionStep");
    decisionStep
      .when(Condition.stringEquals("$.processor", "euler"), eulerProcess)
      .when(Condition.stringEquals("$.processor", "pi"), piProcess)
      .when(Condition.stringEquals("$.processor", "both"), staticParallelStep)
      .otherwise(finishingStep);

    stateMachineDefinition.next(decisionStep);

    const stateMachine = new StateMachine(this, "StateMachine", {
      stateMachineName: "StartupSnack-StepFunctionsFargateTasks",
      definition: stateMachineDefinition
    });

    stateMachine.grantTaskResponse(pi.taskDefinition.taskRole);

    new CfnOutput(this, "StateMachineArn", {
      value: stateMachine.stateMachineArn
    });
  }
}
