import { MultisigAddress } from '@helium/address'
import { MultisigSignature } from '..'
import { usersFixture } from '../../../../integration_tests/fixtures/users'

describe('sign', () => {
    it('signs a message using the private key', async () => {
        const message = Buffer.from("Hello")
        const { bob, alice } = await usersFixture()
        const multisigAddress = await MultisigAddress.create([bob.address, alice.address], 1)
        const signatures = new Map([[bob.address, await bob.sign(message)]])
        const multisigSig = await MultisigSignature.create(multisigAddress, [bob.address, alice.address], signatures)
        const numberVerified = await multisigSig.verify(message)
        expect(numberVerified).toBe(1)
    })
  })