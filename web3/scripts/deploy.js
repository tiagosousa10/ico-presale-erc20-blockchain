const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying the contract with the account:", deployer.address);
  console.log("Account balance: ", (await deployer.getBalance()).toString());

  const network = await hre.ethers.provider.getNetwork();
  console.log("Network name: ", network.name);

  //TOKEN CONTRACT DEPLOYMENT -> TokenICO
  console.log("\nDeploying TokenICO...");
  const TokenICO = await hre.ethers.getContractFactory("TokenICO");
  const tokenICO = await TokenICO.deploy();

  await tokenICO.deployed();

  console.log("\nDeployment Successful!");
  console.log("------------------------");
  console.log("NEXT_PUBLIC_TOKEN_ICO_ADDRESS", tokenICO.address);
  console.log("NEXT_PUBLIC_OWNER_ADDRESS:", deployer.address);

  //TOKEN CONTRACT DEPLOYMENT -> LINKTUM
  console.log("\nDeploying LINKTUM...");
  const LINKTUM = await hre.ethers.getContractFactory("LINKTUM");
  const linktum = await LINKTUM.deploy();

  await linktum.deployed();

  console.log("\nDeployment Successful!");
  console.log("------------------------");
  console.log("NEXT_PUBLIC_LINKTUM_ADDRESS", linktum.address);
  console.log("NEXT_PUBLIC_OWNER_ADDRESS:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
