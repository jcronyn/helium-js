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

        const numVerified = multisigSig.verify(message)
        expect(numVerified).toBe(1)

        const result = multisigSig.toString()
        const multisigSignatureTest = MultisigSignature.fromString(multisigAddress, result)
        expect(multisigSignatureTest.verify(message)).toBe(1)
        expect(multisigSignatureTest.signatures[0].signature).toStrictEqual(await bob.sign(message))
    })
  }) 