/* eslint-disable no-console */
/* eslint-disable max-len */

/**
 * This example shows how to use the Aptos client to mint and transfer a Digital Asset.
 */

import "dotenv";
import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";

const INITIAL_BALANCE = 100_000_000;

// Setup the client
const APTOS_NETWORK: Network = Network.MAINNET || Network.DEVNET;
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

const example = async () => {
  console.log(
    "This example will create and fund Alice and Bob, then Alice account will create a collection and a digital asset in that collection and tranfer it to Bob.",
  );

  // Create Alice and Bob accounts
  //const alice = Account.generate();
  const pk = new Ed25519PrivateKey("0xaffa9c98e31686543bc8d8e60f02036182170a14cc36bedc965f8a2299fd92b3");
  const alice = Account.fromPrivateKey({ privateKey: pk });
  const bob = Account.generate();

  console.log("=== Addresses ===\n");
  console.log(`Alice's address is: ${alice.accountAddress}`);
  console.log(`Bobs's address is: ${bob.accountAddress}`);
  console.log(`Bobs's pk is: ${bob.privateKey}`);

  /*
  // Fund and create the accounts
  await aptos.faucet.fundAccount({
    accountAddress: alice.accountAddress,
    amount: INITIAL_BALANCE,
  });
  await aptos.faucet.fundAccount({
    accountAddress: bob.accountAddress,
    amount: INITIAL_BALANCE,
  });

  */

  const collectionName = "Jambo Test Collection";
  const collectionDescription = "Jambo Test description.";
  const collectionURI = "https://twitter.com/0xLoveAI";

  // Create the collection
  const createCollectionTransaction = await aptos.createCollectionTransaction({
    creator: alice,
    description: collectionDescription,
    name: collectionName,
    uri: collectionURI,
  });

  console.log("\n=== Create the collection ===\n");
  let committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: createCollectionTransaction });

  let pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

  const alicesCollection = await aptos.getCollectionData({
    creatorAddress: alice.accountAddress,
    collectionName,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alice's collection: ${JSON.stringify(alicesCollection, null, 4)}`);

  const tokenName = "Test Aptos Monkey";
  const tokenDescription = "Test Monkey Description.";
  const tokenURI = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtusIMXoR4V1kzlDbrzso40rbIZyTLb1Z3Ng&s"; //"aptos.dev/asset";

  console.log("\n=== Alice Mints the digital asset ===\n");

  let mintTokenTransaction = await aptos.mintDigitalAssetTransaction({
    creator: alice,
    collection: collectionName,
    description: tokenDescription,
    name: tokenName,
    uri: tokenURI,
  });
  // let mintTokenTransaction;
  // console.log("start time: ", new Date());
  // for (let i = 0; i < 10; i++) {
  //   console.log(i, "this is i");
  //   mintTokenTransaction = await aptos.mintDigitalAssetTransaction({
  //     creator: alice,
  //     collection: collectionName,
  //     description: tokenDescription,
  //     name: tokenName,
  //     uri: tokenURI,
  //   });
  // }

  console.log("end time: ", new Date());
  console.log("\n=== mint token txn ===\n");
  console.log(mintTokenTransaction);

  committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: mintTokenTransaction });
  pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

  const alicesDigitalAsset = await aptos.getOwnedDigitalAssets({
    ownerAddress: alice.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alice's digital assets balance: ${alicesDigitalAsset.length}`);

  console.log(`Alice's digital asset: ${JSON.stringify(alicesDigitalAsset[0], null, 4)}`);

  return;

  console.log("\n=== Transfer the digital asset to Bob ===\n");

  const transferTransaction = await aptos.transferDigitalAssetTransaction({
    sender: alice,
    digitalAssetAddress: alicesDigitalAsset[0].token_data_id,
    recipient: bob.accountAddress,
  });
  committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: transferTransaction });
  pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

  const alicesDigitalAssetsAfter = await aptos.getOwnedDigitalAssets({
    ownerAddress: alice.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Alices's digital assets balance: ${alicesDigitalAssetsAfter.length}`);

  const bobDigitalAssetsAfter = await aptos.getOwnedDigitalAssets({
    ownerAddress: bob.accountAddress,
    minimumLedgerVersion: BigInt(pendingTxn.version),
  });
  console.log(`Bob's digital assets balance: ${bobDigitalAssetsAfter.length}`);
};

example();
