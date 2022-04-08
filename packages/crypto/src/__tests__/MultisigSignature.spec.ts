import { MultisigAddress } from '@helium/address'
import { MultisigSignature } from '..'
import { usersFixture } from '../../../../integration_tests/fixtures/users'

describe('sign', () => {
    it('signs a message using the private key', async () => {
        const message = Buffer.from("Hello")
        const { bob, alice } = await usersFixture()
        const multisigAddress = await MultisigAddress.create([bob.address, alice.address], 1)

        const signatures = new Map([[bob.address, await bob.sign(message)]])
        const multisigSig = MultisigSignature.create(multisigAddress, [bob.address, alice.address], signatures)
        expect(multisigSig.signatures.length).toBe(1)
        expect(multisigSig.signatures[0].index).toBe(0)
        expect(multisigSig.addresses.length).toBe(2)
        expect(multisigSig.addresses[0].b58).toBe(bob.address.b58)
        expect(multisigSig.verify(message)).toBe(1)

        const signatures2 = new Map([[bob.address, await bob.sign(message)], [alice.address, await alice.sign(message)]])
        const multisigSig2 = MultisigSignature.create(multisigAddress, [bob.address, alice.address], signatures2)
        expect(multisigSig2.signatures.length).toBe(2)
        expect(multisigSig2.signatures[0].index).toBe(0)
        expect(multisigSig2.signatures[1].index).toBe(1)
        expect(multisigSig2.addresses.length).toBe(2)
        expect(multisigSig2.addresses[0].b58).toBe(bob.address.b58)
        expect(multisigSig2.verify(message)).toBe(2)

        const multisigSignatureTest = MultisigSignature.fromBin(multisigAddress, multisigSig.bin)
        const multisigSignatureTest2 = MultisigSignature.fromBin(multisigAddress, multisigSig2.bin)
        expect(multisigSignatureTest.verify(message)).toBe(1)
        expect(multisigSignatureTest.signatures[0].signature).toStrictEqual(await bob.sign(message))
        expect(multisigSignatureTest2.signatures[1].signature).toStrictEqual(await alice.sign(message))
    })
  }) 