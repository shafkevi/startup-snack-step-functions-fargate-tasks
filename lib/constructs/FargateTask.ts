import { Construct } from "@aws-cdk/core";
import { DockerImageAsset } from "@aws-cdk/aws-ecr-assets";

import {
  AwsLogDriver,
  Cluster,
  ContainerDefinition,
  ContainerImage,
  FargatePlatformVersion,
  FargateTaskDefinition
} from "@aws-cdk/aws-ecs";

import {
  EcsFargateLaunchTarget,
  EcsRunTask,
  TaskEnvironmentVariable
} from "@aws-cdk/aws-stepfunctions-tasks";

import { IntegrationPattern } from "@aws-cdk/aws-stepfunctions";

export interface FargateClusterProps {
  cluster: Cluster,
  cpu: number,
  dockerfileLocation: string,
  environment: TaskEnvironmentVariable[],
  integrationPattern: IntegrationPattern,
  logGroupName: string,
  memoryLimitMiB: number,
  repositoryName: string
}

export default class FargateCluster extends Construct {
  public readonly containerDefinition: ContainerDefinition;
  public readonly task: EcsRunTask;
  public readonly taskDefinition: FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: FargateClusterProps) {
    super(scope, id);

    const {
      cluster,
      cpu,
      dockerfileLocation,
      environment,
      integrationPattern,
      logGroupName,
      memoryLimitMiB,
      repositoryName
    } = props;

    this.taskDefinition = new FargateTaskDefinition(this, "TaskDefinition", {
      cpu,
      memoryLimitMiB
    });

    const imageAsset = new DockerImageAsset(this, "ImageAsset", {
      directory: dockerfileLocation
    });

    this.containerDefinition = this.taskDefinition.addContainer("Container", {
      image: ContainerImage.fromDockerImageAsset(imageAsset),
      memoryLimitMiB: memoryLimitMiB,
      logging: new AwsLogDriver({ streamPrefix: logGroupName })
    });

    this.task = new EcsRunTask(this, `${id}FargateTask`, {
      cluster,
      integrationPattern,
      assignPublicIp: true,
      taskDefinition: this.taskDefinition,
      containerOverrides: [
        {
          environment,
          containerDefinition: this.containerDefinition
        }
      ],
      launchTarget: new EcsFargateLaunchTarget({
        platformVersion: FargatePlatformVersion.VERSION1_4
      })
    });
  }
}
