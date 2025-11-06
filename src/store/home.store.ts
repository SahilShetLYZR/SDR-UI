import { ICreateCampaignSettings } from "@/lib/types";
import { create } from "zustand";

interface IHomeState {
   campaignSettings: Partial<ICreateCampaignSettings>;
   setCampaignSettings: (campaign: ICreateCampaignSettings) => void;
}

export const useHomeStore = create<IHomeState>((set) => ({
   campaignSettings: {},
   setCampaignSettings: (campaignSettings: ICreateCampaignSettings) => set(() => ({ campaignSettings })),
}));