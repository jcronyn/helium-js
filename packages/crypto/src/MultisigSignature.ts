import Address, { KeyTypes, MultisigAddress } from '@helium/address'
import { verifySignature } from './utils'
const {MULTISIG_KEY_TYPE} = KeyTypes
const PUBLIC_KEY_LENGTH = 33;


class KeySignature {
  public index!: number

  public signature!: Uint8Array

  constructor(index: number,  signature:  Uint8Array) {
    this.index = index
    this.signature = signature
  }

  public static new(addresses: Address[], address: Address, signature: Uint8Array) {
    if (address.keyType == MULTISIG_KEY_TYPE) {
      throw new Error('invalid keytype for multisig KeySignature')
    }
    return new KeySignature(addresses.findIndex(addr => addr.publicKey === address.publicKey), signature)
  }
}

export default class MultisigSignature {
  public addresses!: Address[]

  public signatures!: KeySignature[]

  constructor(addresses: Address[], signatures: KeySignature[]) {
    this.addresses = addresses
    this.signatures = signatures
  }

  public static create(multisigAddress: MultisigAddress, addresses: Address[], signatures: Map<Address, Uint8Array>): MultisigSignature {
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

  public verify(message: Uint8Array): number {
    let valid_signature_count = 0;
    for (const sig of this.signatures) {
      let address = this.addresses[sig.index];
      if (verifySignature(sig.signature, message, address.publicKey)){
        valid_signature_count += 1
      }
    }
    return valid_signature_count
  }

  public static fromBin(multisigAddress: MultisigAddress, input: Uint8Array): MultisigSignature {
    let addresses : Address[] = [];
    for (let i = 0; i < multisigAddress.N; i++){
      let address = Address.fromBin(Buffer.from(input.slice(0, PUBLIC_KEY_LENGTH)))
      input = input.slice(PUBLIC_KEY_LENGTH)
      addresses.push(address)
    }
    
    let signatures = new Map<Address, Uint8Array>();
    do {
      let info = input.slice(0, 2);
      let index = info[0];
      let signature = input.slice(2, info[1] + 2)
      signatures.set(addresses[index], signature)
      input = input.slice(info[1] + 2)
    } while (input.length);

    return MultisigSignature.create(multisigAddress, addresses, signatures)
  }

  get bin(): Uint8Array { 
    return new Uint8Array([...this.serializedAddresses(), ...this.serlializedSignatures()])
  }

  private serializedAddresses() {
    let multisigPubKeysBin = new Uint8Array()
    for (const address of this.addresses) {
      multisigPubKeysBin = new Uint8Array([...multisigPubKeysBin, ...address.bin])
    }
    return multisigPubKeysBin
  }

  private serlializedSignatures() {
    let multisigSignatures = new Uint8Array()
    for (const sig of this.signatures) {
      multisigSignatures = new Uint8Array([...multisigSignatures, sig.index, sig.signature.length, ...sig.signature])
    }
    return multisigSignatures
  }
}
