import 'source-map-support/register';
import { App } from "aws-cdk-lib";
import StepFunctionStack from "../lib/stacks/StepFunctionStack";

const app = new App();

const version = '1';
new StepFunctionStack(app, `CdkStepFunctionStack-${version}`, {
  version,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
