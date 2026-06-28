import { type GiftDetails, DEFAULT_GIFT_DETAILS } from '@/lib/types/gift';

export type { GiftDetails };

export interface RegionAllocation {
  regionId: string;
  treeCount: number;
}

export interface DonorInfo {
  email: string;
  name: string;
  anonymous: boolean;
  privacyAccepted: boolean;
}

export interface DonationFlowState {
  amount: number;
  treeCount: number;
  species: string;
  isMonthly: boolean;
  donorInfo: DonorInfo;
  regionAllocations: RegionAllocation[];
  gift: GiftDetails;
}

export const DEFAULT_DONOR_INFO: DonorInfo = {
  email: '',
  name: '',
  anonymous: false,
  privacyAccepted: false,
};

export const DEFAULT_DONATION_FLOW_STATE: DonationFlowState = {
  amount: 25,
  treeCount: 1,
  species: 'Teak',
  isMonthly: false,
  donorInfo: { ...DEFAULT_DONOR_INFO },
  regionAllocations: [],
  gift: { ...DEFAULT_GIFT_DETAILS },
};
