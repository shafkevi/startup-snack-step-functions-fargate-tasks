import { Construct } from "constructs";
import { aws_ecr_assets as ecr_assets } from "aws-cdk-lib";
import { aws_ecs as ecs } from "aws-cdk-lib";
import { aws_stepfunctions_tasks as stepfunctions_tasks } from "aws-cdk-lib";
import { aws_stepfunctions as stepfunctions } from "aws-cdk-lib";


export interface FargateClusterProps {
  cluster: ecs.Cluster,
  cpu: number,
  dockerfileLocation: string,
  environment: stepfunctions_tasks.TaskEnvironmentVariable[],
  integrationPattern: stepfunctions.IntegrationPattern,
  logGroupName: string,
  memoryLimitMiB: number,
  repositoryName: string
  resultPath?: string,
}

export default class FargateCluster extends Construct {
  public readonly containerDefinition: ecs.ContainerDefinition;
  public readonly task: stepfunctions_tasks.EcsRunTask;
  public readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: FargateClusterProps) {
    super(scope, id);

    const {
      cluster,
      cpu,
      dockerfileLocation,
      integrationPattern,
      logGroupName,
      memoryLimitMiB,
      environment
    } = props;

    this.taskDefinition = new ecs.FargateTaskDefinition(this, "TaskDefinition", {
      cpu,
      memoryLimitMiB
    });

    const imageAsset = new ecr_assets.DockerImageAsset(this, "ImageAsset", {
      directory: dockerfileLocation
    });

    this.containerDefinition = this.taskDefinition.addContainer("Container", {
      image: ecs.ContainerImage.fromDockerImageAsset(imageAsset),
      memoryLimitMiB: memoryLimitMiB,
      logging: new ecs.AwsLogDriver({ streamPrefix: logGroupName })
    });

    this.task = new stepfunctions_tasks.EcsRunTask(this, `${id}FargateTask`, {
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
      launchTarget: new stepfunctions_tasks.EcsFargateLaunchTarget({
        platformVersion: ecs.FargatePlatformVersion.VERSION1_4
      })
    });
  }
}
