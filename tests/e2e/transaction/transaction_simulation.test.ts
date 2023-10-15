import { AptosConfig, Network, Aptos, Account, U64, SigningScheme } from "../../../src";
import { longTestTimeout } from "../../unit/helper";
import { fundAccounts, publishModule } from "./helper";

const signleSignerScriptBytecode =
  // eslint-disable-next-line max-len
  "a11ceb0b060000000701000402040a030e0c041a04051e20073e30086e2000000001010204010001000308000104030401000105050601000002010203060c0305010b0001080101080102060c03010b0001090002050b00010900000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177076465706f7369740000000000000000000000000000000000000000000000000000000000000001000001080b000b0138000c030b020b03380102";

const multiSignerScriptBytecode =
  // eslint-disable-next-line max-len
  "a11ceb0b060000000701000402040a030e18042608052e4307713e08af01200000000101020401000100030800010403040100010505060100010607040100010708060100000201020202030207060c060c0303050503030b000108010b000108010b0001080101080102060c03010b0001090002070b000109000b000109000002070b000109000302050b000109000a6170746f735f636f696e04636f696e04436f696e094170746f73436f696e087769746864726177056d657267650765787472616374076465706f73697400000000000000000000000000000000000000000000000000000000000000010000011a0b000a0238000c070b010a0338000c080d070b0838010d070b020b03160b061738020c090b040b0738030b050b09380302";

describe("transaction simulation", () => {
  const config = new AptosConfig({ network: Network.LOCAL });
  const aptos = new Aptos(config);
  const senderAccount = Account.generate();
  const recieverAccounts = [Account.generate(), Account.generate()];
  const senderSecp256k1Account = Account.generate(SigningScheme.Secp256k1Ecdsa);
  const secondarySignerAccount = Account.generate();
  const feePayerAccount = Account.generate();
  beforeAll(async () => {
    await fundAccounts(aptos, [
      senderAccount,
      senderSecp256k1Account,
      ...recieverAccounts,
      secondarySignerAccount,
      feePayerAccount,
    ]);
    await publishModule(
      aptos,
      senderAccount,
      // eslint-disable-next-line max-len
      "107472616e73616374696f6e5f746573740100000000000000004035364643333939394442364244363842383430304539323438363839393837413338313439344644413241343631334144373946333630323134353539324545ba011f8b08000000000002ff5d8f3d0ec2300c85779f0265e944032b12030b97a8aaca4d4c1b95fc284e0bc72729a503f2e2a7f7d97e6e02aa09076ac1a1a5c3f5205244c7a892f1ae4bc449c04291b32ae6a9ce25001a4d819c26a70c717d0bc9f33de6052f1fa7160693325c8d2905be4899e538f7b5f25662218f4fec796b958f5467a082484b19b2685c053cf7dac4a2bf98f50bc9c7efc236bbeb2a0742ad233113b7b0baddeeaeb9df6701ff9f15a3131fec1509190201000001087472616e73666572ca021f8b08000000000002ff9552cb4ec33010bcf72bf654a522dc10071790101f12b9f1a6582476e407a142fd77fc48d23826125891627b661fb39e4e32db22184585a6b5e1525406b52124dc34a8e07b07e03eab11686fa4ae1a453b1ca4fa20245ed4928be33629c03b87f6f6d4f21a50187581c60a3083ac4e97cafd0a07c7d570e5cac35ef3b34055cef71a6b29d82f00eda415a61ae3ece343064da109c6f41c431953a8758a4d413988bdd43c2f780893f2ab45035e74a4c07338103270f3ce141d9e6e5323e4d5efdfdcf6a508ec32d17338ae53c6b6fe9c33d2cb741287f01a7e457e87ea8cc5beb3cbb6cb65bd5bc45623f8e50c539b3ccb520edca58dc07d3acd75632358cc6f552e52cfb3c9b993ea5481e75e6381dc89a3db8b85df0443b5e9b7959b14d61c3f3d3ff14bee897fbc9caf3fcd6f43ec54364a9d355e7f00fb8d2dcfd603000000000300000000000000000000000000000000000000000000000000000000000000010e4170746f734672616d65776f726b00000000000000000000000000000000000000000000000000000000000000010b4170746f735374646c696200000000000000000000000000000000000000000000000000000000000000010a4d6f76655374646c696200",
      // eslint-disable-next-line max-len
      `a11ceb0b060000000801000602060a031022043208053a4e0788015208da01400c9a024c000001010102020404010001010508000000000100000302010002060506010002070701010002080901010002090a060100020403040404050403060c03050007060c060c0303050503010b0001080101080102060c03010b0001090002050b00010900030b000108010b000108010b0001080102070b000109000b0001090002070b0001090003087472616e736665720a6170746f735f636f696e04636f696e0a74776f5f62795f74776f04436f696e094170746f73436f696e087769746864726177076465706f736974056d657267650765787472616374${senderAccount.accountAddress.toStringWithoutPrefix()}00000000000000000000000000000000000000000000000000000000000000010001040003080b000b0138000c030b020b0338010201010400081a0b000a0238000c070b010a0338000c080d070b0838020d070b020b03160b061738030c090b040b0738010b050b0938010200`,
    );
  }, longTestTimeout);
  describe("ED25519", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          data: {
            bytecode: signleSignerScriptBytecode,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          data: {
            bytecode: multiSignerScriptBytecode,
            type_arguments: [],
            arguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              recieverAccounts[0].accountAddress,
              recieverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.generateTransaction({
            sender: senderAccount.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
              type_arguments: [],
              arguments: [
                new U64(100),
                new U64(200),
                recieverAccounts[0].accountAddress,
                recieverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const [response] = await aptos.simulateTransaction({
            signerPublicKey: senderAccount.publicKey,
            transaction: rawTxn,
            secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          });
          expect(response.success).toBeTruthy();
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            bytecode: signleSignerScriptBytecode,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderAccount.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
            type_arguments: [],
            arguments: [
              new U64(100),
              new U64(200),
              recieverAccounts[0].accountAddress,
              recieverAccounts[1].accountAddress,
              new U64(50),
            ],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderAccount.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
    });
  });

  describe("Secp256k1", () => {
    describe("single signer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          data: {
            bytecode: signleSignerScriptBytecode,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
        });
        expect(response.success).toBeTruthy();
      });
    });
    describe("multi agent", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          data: {
            bytecode: multiSignerScriptBytecode,
            type_arguments: [],
            arguments: [
              new U64(BigInt(100)),
              new U64(BigInt(200)),
              recieverAccounts[0].accountAddress,
              recieverAccounts[1].accountAddress,
              new U64(BigInt(50)),
            ],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
        });
        expect(response.success).toBeTruthy();
      });

      test(
        "with entry function payload",
        async () => {
          const rawTxn = await aptos.generateTransaction({
            sender: senderSecp256k1Account.accountAddress.toString(),
            secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
            data: {
              function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
              type_arguments: [],
              arguments: [
                new U64(100),
                new U64(200),
                recieverAccounts[0].accountAddress,
                recieverAccounts[1].accountAddress,
                new U64(50),
              ],
            },
          });

          const [response] = await aptos.simulateTransaction({
            signerPublicKey: senderSecp256k1Account.publicKey,
            transaction: rawTxn,
            secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          });
          expect(response.success).toBeTruthy();
        },
        longTestTimeout,
      );
    });
    describe("fee payer", () => {
      test("with script payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            bytecode: signleSignerScriptBytecode,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with entry function payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });
        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multisig payload", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            multisigAddress: secondarySignerAccount.accountAddress,
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::transfer`,
            type_arguments: [],
            arguments: [new U64(1), recieverAccounts[0].accountAddress],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
      test("with multi agent transaction", async () => {
        const rawTxn = await aptos.generateTransaction({
          sender: senderSecp256k1Account.accountAddress.toString(),
          secondarySignerAddresses: [secondarySignerAccount.accountAddress.toString()],
          feePayerAddress: feePayerAccount.accountAddress.toString(),
          data: {
            function: `0x${senderAccount.accountAddress.toStringWithoutPrefix()}::transfer::two_by_two`,
            type_arguments: [],
            arguments: [
              new U64(100),
              new U64(200),
              recieverAccounts[0].accountAddress,
              recieverAccounts[1].accountAddress,
              new U64(50),
            ],
          },
        });

        const [response] = await aptos.simulateTransaction({
          signerPublicKey: senderSecp256k1Account.publicKey,
          transaction: rawTxn,
          secondarySignersPublicKeys: [secondarySignerAccount.publicKey],
          feePayerPublicKey: feePayerAccount.publicKey,
        });
        expect(response.success).toBeTruthy();
      });
    });
  });
});