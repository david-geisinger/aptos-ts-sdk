import "dotenv";
import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network, MoveString } from "@aptos-labs/ts-sdk";

const APTOS_NETWORK: Network = Network.TESTNET || Network.DEVNET;
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

//new: 0xb80837cef68a0bcef529d47df2a73c2fdce51d2e74bae6de3a28303fe40d3d5e
//old pk: 0xaffa9c98e31686543bc8d8e60f02036182170a14cc36bedc965f8a2299fd92b3
export const pk = new Ed25519PrivateKey("0xb80837cef68a0bcef529d47df2a73c2fdce51d2e74bae6de3a28303fe40d3d5e");
export const alice = Account.fromPrivateKey({ privateKey: pk });

const example = async () => {
  //Create the collection

  const updateTokenUriTxn = await aptos.transaction.build.simple({
    sender: alice.accountAddress,
    data: {
      function: "0x4::aptos_token::set_uri",
      functionArguments: [
        // "0x17a447708eace32cab8811c9ea153763c400fbc5d7ab276d3a32813813fa1c20",
        "0x26b667db270e6a332e4a22123cff2afe1247b6d76edc157a626faf95997762",
        new MoveString(
          "https://wz64no5vcuz4kwlozg77aybl2rruoeco5ov3ygdfvte7idajzcwa.arweave.net/tn3Gu7UVM8VZbsm_8GAr1GNHEE7rq7wYZazJ9AwJyKw/100.webp",
        ),
      ],
    },
  });

  console.log("\n=== Update the uri ===\n");
  let committedTxn = await aptos.signAndSubmitTransaction({ signer: alice, transaction: updateTokenUriTxn });
  console.log("committedTxn: ", committedTxn);

  let pendingTxn = await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  console.log("pendingTxn: ", pendingTxn);
  console.log("\n=== Finish updating the token ===\n");

  return;
};

example();
