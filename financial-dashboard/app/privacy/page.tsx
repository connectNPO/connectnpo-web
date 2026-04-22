import type { Metadata } from 'next';
import { LegalDocument } from '@/components/LegalDocument';
import { ScrollToPrivacy } from './ScrollToPrivacy';

export const metadata: Metadata = {
  title: 'Privacy Policy — GivingArc Financial Dashboard',
};

export default function PrivacyPage() {
  return (
    <>
      <ScrollToPrivacy />
      <LegalDocument />
    </>
  );
}
