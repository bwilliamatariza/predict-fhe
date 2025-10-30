import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // const deployedFHECounter = await deploy("FHECounter", {
  //   from: deployer,
  //   log: true,
  // });

  // console.log(`FHECounter contract: `, deployedFHECounter.address);

  const deployedSecretPredict = await deploy("SecretPredict", {
    from: deployer,
    log: true,
  });
  console.log(`SecretPredict contract: `, deployedSecretPredict.address);
};
export default func;
func.id = "deploy_all"; // id required to prevent reexecution
func.tags = ["FHECounter", "SecretPredict"];
