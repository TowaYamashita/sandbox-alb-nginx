import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Instance, InstanceClass, InstanceSize, InstanceType, MachineImage, Peer, Port, SecurityGroup, SubnetType, UserData, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer, Protocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { InstanceIdTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { Construct } from 'constructs';
import { readFileSync } from "fs";

export class SandboxAlbNginxStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'Vpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'load-balancer',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'application',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    const albSecurityGroup = new SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: vpc,
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
    );

    const alb = new ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: SubnetType.PUBLIC,
      }),
      securityGroup: albSecurityGroup,
      internetFacing: true,
    });

    const userData = UserData.forLinux({
      // assets/install.shでシェバンを書いているため、2重にならないようこちらを無効化する
      shebang: '',
    });
    const userDataScript = readFileSync('assets/install.sh', 'utf-8').toString();
    userData.addCommands(userDataScript);

    const ec2SecurityGroup = new SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: vpc,
      allowAllOutbound: true,
    });
    ec2SecurityGroup.addIngressRule(
      Peer.securityGroupId(albSecurityGroup.securityGroupId),
      Port.allTraffic(),
    );
    const instance = new Instance(this, 'Instance', {
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO,),
      machineImage: MachineImage.latestAmazonLinux2(),
      ssmSessionPermissions: true,
      securityGroup: ec2SecurityGroup,
      userData: userData,
    });
    
    const listener = alb.addListener('Listener', { port: 80 });
    listener.addTargets(`ListenerTarget`, {
      port: 80,
      targets: [
        new InstanceIdTarget(instance.instanceId)
      ],
      healthCheck: {
        protocol: Protocol.HTTP,
        path: '/index.html'
      }
    });

    new CfnOutput(this, 'LoadBalancerDnsName', {
      value: alb.loadBalancerDnsName,
    });
  }
}
