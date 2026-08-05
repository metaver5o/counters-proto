import { AddressPurpose, BitcoinNetworkType, getAddress } from '@sats-connect/core'

declare global {
  interface Window {
    XverseProviders?: { BitcoinProvider?: unknown }
  }
}

export function isXverseAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window.XverseProviders?.BitcoinProvider)
}

export async function connectXverse(): Promise<{
  paymentAddress: string
  ordinalsAddress: string
  publicKey: string
} | null> {
  return new Promise((resolve) => {
    getAddress({
      payload: {
        purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
        message: 'Connect to Bitcoin Counters',
        network: { type: BitcoinNetworkType.Mainnet },
      },
      onFinish: (response) => {
        const payment = response.addresses.find((a) => a.purpose === AddressPurpose.Payment)
        const ordinals = response.addresses.find((a) => a.purpose === AddressPurpose.Ordinals)
        if (!payment || !ordinals) { resolve(null); return }
        resolve({
          paymentAddress: payment.address,
          ordinalsAddress: ordinals.address,
          publicKey: ordinals.publicKey,
        })
      },
      onCancel: () => resolve(null),
    })
  })
}
