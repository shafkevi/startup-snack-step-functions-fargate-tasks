import { Construct } from "@aws-cdk/core";

import {
  Cluster,
  FargateTaskDefinition,
  ContainerImage,
  ContainerDefinition,
  AwsLogDriver,
  FargatePlatformVersion,
} from "@aws-cdk/aws-ecs";

import {
  EcsRunTask,
  EcsFargateLaunchTarget,
  TaskEnvironmentVariable,
} from "@aws-cdk/aws-stepfunctions-tasks";
  
import {
  IntegrationPattern,
} from "@aws-cdk/aws-stepfunctions";

export interface FargateClusterProps {
  cluster: Cluster,
  cpu: number,
  memoryLimitMiB: number,
  dockerfileLocation: string,
  repositoryName: string,
  logGroupName: string,
  integrationPattern: IntegrationPattern,
  environment: TaskEnvironmentVariable[],
  resultPath?: string,
}

export default class FargateCluster extends Construct {
  public readonly taskDefinition: FargateTaskDefinition;
  public readonly containerDefinition: ContainerDefinition;
  public readonly task: EcsRunTask;

  constructor(scope: Construct, id: string, props: FargateClusterProps) {
    super(scope, id);

    const { 
      cluster,
      cpu,
      memoryLimitMiB,
      repositoryName,
      dockerfileLocation,
      logGroupName,
      integrationPattern,
      environment,
      resultPath,
    } = props;

    this.taskDefinition = new FargateTaskDefinition(this, "FargateTaskDefinition", {
      cpu: cpu,
      memoryLimitMiB: memoryLimitMiB,
    });

    this.containerDefinition = this.taskDefinition.addContainer("FargateContainer", {
      image: ContainerImage.fromAsset(
        dockerfileLocation,
        { repositoryName: repositoryName }
      ),
      memoryLimitMiB: memoryLimitMiB,
      logging: new AwsLogDriver({ streamPrefix: logGroupName})
    });

    this.task = new EcsRunTask(this, `${id}FargateTask`, {
        integrationPattern,
        cluster: cluster,
        taskDefinition: this.taskDefinition,
        assignPublicIp: true,
        resultPath: resultPath ?? '$',
        containerOverrides: [
          {
            environment,
            containerDefinition: this.containerDefinition,
          }
        ],
        launchTarget: new EcsFargateLaunchTarget({
            platformVersion: FargatePlatformVersion.VERSION1_4
        })
     });

  }
}
