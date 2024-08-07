/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * This example shows how to use the Aptos client to mint and transfer a Digital Asset.
 */

import "dotenv";
import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  MoveString,
  MoveVector,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";
import { DISTRIBUTION_ADDRESSES } from "./addressesToTransfer";

// Setup the client
const APTOS_NETWORK: Network = Network.MAINNET || Network.DEVNET;
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

// Create Alice and Bob accounts
//const alice = Account.generate();
//new: 0xe8946f57d25a7b156c62c420f5cdd22a79e4b7ac190dc35e39261d1de5d81b90
//old pk: 0xaffa9c98e31686543bc8d8e60f02036182170a14cc36bedc965f8a2299fd92b3
export const pk = new Ed25519PrivateKey("0xe8946f57d25a7b156c62c420f5cdd22a79e4b7ac190dc35e39261d1de5d81b90");
export const alice = Account.fromPrivateKey({ privateKey: pk });
//Address is 0xb88d6f870629a386c7d78c9627767dcc0cadde94926307865a7adc49241df144, need to convert to uint 8
// export let uintArray = Uint8Array.from(
//   Buffer.from("cb0ff725d35cf5d2d46dafc4e297ac4b020ec1721277579f48aab6ce2e34772b", "hex"),
// );
// export const bobAccountAddress = new AccountAddress(uintArray);

const collectionAddress = "0x5e975cb34f9a0503e02a005386cdb387e2718a12fc023870e05f11db356c8fe0";
const BULK_SIZE = 150;
const configureBulk = async () => {
  const latestAddress = "0x8953ad78bbb57c0f6e55a4746054d49d3215e77d3213894bd762e5703b1a7816";
  let addressesIdx = 0;
  if (latestAddress) {
    console.log("latestAddress: ", latestAddress);
    addressesIdx = DISTRIBUTION_ADDRESSES.indexOf(latestAddress) - BULK_SIZE + 1;
    if (addressesIdx < 0) {
      addressesIdx = 0;
    }
  }
  while (addressesIdx < DISTRIBUTION_ADDRESSES.length) {
    const addressChunk = DISTRIBUTION_ADDRESSES.slice(addressesIdx, addressesIdx + BULK_SIZE);
    console.log("last address included: ", addressChunk[addressChunk.length - 1]);
    await mintAndTransfer(addressChunk);
    addressesIdx += BULK_SIZE;
  }
};

const mintAndTransfer = async (addresses: string[]) => {
  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);

  const tokenName = "LoveAI Access Pass #";
  const tokenDescription =
    "The LoveAI Access Pass grants you a whitelist to the newest AI dApps built through LoveAI's infrastructure. LoveAI is building the decentralized AI layer enabling the next wave of maximally censorship resistant AI dApps. Check us out at: www.loveai.xyz";
  //const tokenURI = "https://arweave.net/-hasv3OqIhZTn9HOXkgnf9Tk_Cp8Os5DFx-hTbR_z3g/2.webp"; //"aptos.dev/asset";

  console.log("\n=== Alice Mints the digital asset ===\n");

  let tokenDescriptions = [];
  let tokenURIs = [];
  for (let i = 0; i < addresses.length; i++) {
    let uri = `https://arweave.net/tn3Gu7UVM8VZbsm_8GAr1GNHEE7rq7wYZazJ9AwJyKw/${(i % BULK_SIZE) + 1}.webp`;
    tokenDescriptions.push(new MoveString(tokenDescription));
    tokenURIs.push(new MoveString(uri));
  }

  const mintTokenTransaction = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: "0x7879a7e7de88f6cf96d03b5537284070c0dd9934dc7c112746a3fc6a5438571b::controlled_mint::mint",
      functionArguments: [collectionAddress, new MoveString(tokenName), tokenDescriptions, tokenURIs, addresses],
    },
  });

  console.log("\n=== mint token txn ===\n");
  console.log(mintTokenTransaction);

  let committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: mintTokenTransaction });
  let pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log("finished pendingTxn");
  //   const alicesDigitalAsset = await aptos.getOwnedDigitalAssets({
  //     ownerAddress: alice.accountAddress,
  //     //minimumLedgerVersion: BigInt(pendingTxn.version),
  //   });
  //   console.log(`Alice's digital assets balance: ${alicesDigitalAsset.length}`);

  //   console.log(`Alice's digital asset: ${JSON.stringify(alicesDigitalAsset[0], null, 4)}`);

  return;
};

configureBulk();
