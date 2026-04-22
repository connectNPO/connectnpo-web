import type { Metadata } from 'next';
import { LegalDocument } from '@/components/LegalDocument';

export const metadata: Metadata = {
  title: 'Terms of Service — GivingArc Financial Dashboard',
};

export default function TermsPage() {
  return <LegalDocument />;
}
