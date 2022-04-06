import Address, { KeyTypes, MultisigAddress } from '@helium/address'
import { sortAddresses } from '@helium/address/build/utils'
import { verifySignature } from './utils'
const {MULTISIG_KEY_TYPE} = KeyTypes


class KeySignature {
  public index!: number

  public signature!: Uint8Array

  constructor(index: number,  signature:  Uint8Array) {
    this.index = index
    this.signature = signature
  }

  static new(addresses: Address[], address: Address, signature: Uint8Array) {
    if (address.keyType == MULTISIG_KEY_TYPE) {
      throw new Error('invalid keytype for multisig KeySignature')
    }
    return new KeySignature(addresses.indexOf(address), signature)
  }
}

export default class MultisigSignature {
  public addresses!: Address[]

  public signatures!: KeySignature[]

  constructor(addresses: Address[], signatures: KeySignature[]) {
    this.addresses = addresses
    this.signatures = signatures
  }

  static async create(multisigAddress: MultisigAddress, addresses: Address[], signatures: Map<Address, Uint8Array>): Promise<MultisigSignature> {
    if (multisigAddress.M > addresses.length) {
      throw new Error('insufficient signatures')
    }
    if (multisigAddress.N > addresses.length) {
      throw new Error('insufficient keys')
    }
    if (multisigAddress.N < addresses.length) {
      throw new Error('too many keys')
    }
    let keySignatures: KeySignature[] = [];
    for (const [address, signature] of signatures) {
      let keySignature = KeySignature.new(addresses, address, signature)
      keySignatures.push(keySignature)
    }
    return new MultisigSignature(addresses, keySignatures)
  }

  async verify(message: Uint8Array): Promise<number> {
    let valid_signature_count: number = 0;
    debugger;
    for (const sig of this.signatures) {
      let address = this.addresses[sig.index];
      if (verifySignature(sig.signature, message, address.publicKey)){
        valid_signature_count += 1
      }
    }
    return valid_signature_count
  }
}
