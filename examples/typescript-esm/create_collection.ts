import "dotenv";
import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network, MoveString } from "@aptos-labs/ts-sdk";

const APTOS_NETWORK: Network = Network.MAINNET || Network.DEVNET;
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

//new: 0xe8946f57d25a7b156c62c420f5cdd22a79e4b7ac190dc35e39261d1de5d81b90
//old pk: 0xaffa9c98e31686543bc8d8e60f02036182170a14cc36bedc965f8a2299fd92b3
export const pk = new Ed25519PrivateKey("0xe8946f57d25a7b156c62c420f5cdd22a79e4b7ac190dc35e39261d1de5d81b90");
export const alice = Account.fromPrivateKey({ privateKey: pk });

export const collectionName = "LoveAI Access Pass";
const collectionDescription =
  "The LoveAI Access Pass grants you a whitelist to the newest AI dApps built through LoveAI's infrastructure. LoveAI is building the decentralized AI layer enabling the next wave of maximally censorship resistant AI dApps. Check us out at: www.loveai.xyz";
const collectionURI = "https://arweave.net/L_4T2bvtivK8F1dhLPPnW3pfDlm0vzMqojL72NJscQ8/collection_uri.webp";

const example = async () => {
  //Create the collection

  const createCollectionTransaction = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function:
        "0x7879a7e7de88f6cf96d03b5537284070c0dd9934dc7c112746a3fc6a5438571b::controlled_mint::create_collection",
      functionArguments: [
        new MoveString(collectionName),
        new MoveString(collectionDescription),
        new MoveString(collectionURI),
      ],
    },
  });

  console.log("\n=== Create the collection ===\n");
  let committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: createCollectionTransaction });
  console.log("committedTxn: ", committedTxn);

  let pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log("pendingTxn: ", pendingTxn);
  console.log("\n=== Finish creating the collection ===\n");

  const alicesCollection = await aptos.getCollectionDataByCreatorAddressAndCollectionName({
    creatorAddress: alice.accountAddress,
    collectionName,
  });
  console.log(`Alice's collection: ${JSON.stringify(alicesCollection, null, 4)}`);
  return;
};

example();
