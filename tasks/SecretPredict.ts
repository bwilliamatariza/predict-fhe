import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { FhevmType } from "@fhevm/hardhat-plugin";

task("sp:address", "Prints the SecretPredict address").setAction(async (_args, hre) => {
  const { deployments } = hre;
  const d = await deployments.get("SecretPredict");
  console.log(`SecretPredict: ${d.address}`);
});

task("sp:create", "Create a new prediction")
  .addParam("name", "Prediction name")
  .addParam("content", "Prediction content")
  .addParam("end", "End time: seconds from now or unix timestamp")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const d = await deployments.get("SecretPredict");
    const c = await ethers.getContractAt("SecretPredict", d.address);

    let endTime: number = parseInt(args.end);
    if (endTime < 4102444800) {
      // If small, treat as seconds from now
      endTime = Math.floor(Date.now() / 1000) + endTime;
    }

    const [signer] = await ethers.getSigners();
    const tx = await c.connect(signer).createPrediction(args.name, args.content, endTime);
    console.log(`tx: ${tx.hash}`);
    const r = await tx.wait();
    console.log(`status: ${r?.status}`);
  });

task("sp:list", "List predictions")
  .addOptionalParam("decrypt", "Decrypt encrypted totals (true/false)", "false")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    const d = await deployments.get("SecretPredict");
    const c = await ethers.getContractAt("SecretPredict", d.address);

    const total = await c.totalPredictions();
    const [signer] = await ethers.getSigners();
    const doDecrypt = String(args.decrypt).toLowerCase() === "true";

    console.log(`Total predictions: ${total}`);
    for (let i = 0; i < Number(total); i++) {
      const p = await c.getPrediction(i);
      const [creator, name, content, endTime, yesEnc, noEnc, yes, no, settled, pending] = p as unknown as [
        string,
        string,
        string,
        bigint,
        string,
        string,
        number,
        number,
        boolean,
        boolean,
      ];

      let yesClear: number | undefined = undefined;
      let noClear: number | undefined = undefined;
      if (doDecrypt && yesEnc !== ethers.ZeroHash && noEnc !== ethers.ZeroHash) {
        await fhevm.initializeCLIApi();
        yesClear = await fhevm.userDecryptEuint(FhevmType.euint32, yesEnc, d.address, signer);
        noClear = await fhevm.userDecryptEuint(FhevmType.euint32, noEnc, d.address, signer);
      }

      console.log(`- id=${i}`);
      console.log(`  name=${name}`);
      console.log(`  content=${content}`);
      console.log(`  endTime=${endTime}`);
      console.log(`  settled=${settled} pending=${pending}`);
      console.log(`  yesTotalPublic=${yes} noTotalPublic=${no}`);
      if (doDecrypt) {
        console.log(`  yesEnc=${yesEnc}`);
        console.log(`  noEnc=${noEnc}`);
        console.log(`  yesClear(user)=${yesClear}`);
        console.log(`  noClear(user)=${noClear}`);
      }
    }
  });

task("sp:bet", "Place a bet")
  .addParam("id", "Prediction id")
  .addParam("yes", "1 for yes, 0 for no")
  .addParam("units", "Number of bet units")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    const d = await deployments.get("SecretPredict");
    const c = await ethers.getContractAt("SecretPredict", d.address);
    const [signer] = await ethers.getSigners();

    const id = parseInt(args.id);
    const units = parseInt(args.units);
    const yesBool = String(args.yes) === "1";

    // encrypt boolean
    await fhevm.initializeCLIApi();
    const encrypted = await fhevm.createEncryptedInput(d.address, signer.address).addBool(yesBool).encrypt();

    const value = BigInt(units) * 100000000000000n; // 1e14
    const tx = await c
      .connect(signer)
      .placeBet(id, encrypted.handles[0], encrypted.inputProof, units, { value });
    console.log(`tx: ${tx.hash}`);
    const r = await tx.wait();
    console.log(`status: ${r?.status}`);
  });

task("sp:settle", "Settle a prediction (request decryption)")
  .addParam("id", "Prediction id")
  .setAction(async (args: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const d = await deployments.get("SecretPredict");
    const c = await ethers.getContractAt("SecretPredict", d.address);
    const [signer] = await ethers.getSigners();
    const id = parseInt(args.id);
    const tx = await c.connect(signer).settle(id);
    console.log(`tx: ${tx.hash}`);
    const r = await tx.wait();
    console.log(`status: ${r?.status}`);
  });

