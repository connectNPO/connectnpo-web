export interface EnrichedGrant {
  id: string;
  title: string;
  agency: string;
  opportunityNumber: string;
  openDate: string;
  closeDate: string;
  oppStatus: string;
  description: string | null;
  awardFloor: number | null;
  awardCeiling: number | null;
  totalFunding: number | null;
  expectedAwards: number | null;
  isCostSharing: boolean;
  closeDateDescription: string | null;
  applicantTypes: string[];
  eligibilityDescription: string | null;
  fundingCategories: string[];
  fundingInstruments: string[];
  agencyEmail: string | null;
  contactDescription: string | null;
  additionalInfoUrl: string | null;
  attachments: {
    fileName: string;
    mimeType: string;
    downloadPath: string;
  }[];
}

export interface SearchGrantsResponse {
  hitCount: number;
  page: number;
  totalPages: number;
  grants: EnrichedGrant[];
}
