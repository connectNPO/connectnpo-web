"use client";

import type { EnrichedGrant } from "@/lib/types";
import { formatDollars, formatDate, fundingRange } from "@/lib/format";
import {
  isNonprofitEligible,
  daysUntil,
  formatInstrument,
  formatCategory,
} from "@/lib/simpler-grants";

export default function GrantCard({ grant }: { grant: EnrichedGrant }) {
  const funding = fundingRange(grant.awardFloor, grant.awardCeiling);
  const eligible = grant.applicantTypes.length > 0
    ? isNonprofitEligible(grant.applicantTypes)
    : null;
  const remaining = daysUntil(grant.closeDate);

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4 transition-shadow hover:shadow-md">
      {/* Title & Agency */}
      <div>
        <a
          href={`https://www.grants.gov/search-results-detail/${grant.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold hover:underline"
        >
          {grant.title}
        </a>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {grant.agency}
          {grant.opportunityNumber && ` · ${grant.opportunityNumber}`}
        </p>
      </div>

      {/* Description */}
      {grant.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {grant.description.length > 250
            ? grant.description.slice(0, 250) + "..."
            : grant.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {funding && (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
            {funding}
          </span>
        )}
        {eligible === true && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
            ✓ 501(c)(3) Eligible
          </span>
        )}
        {eligible === false && (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
            ✗ Check Eligibility
          </span>
        )}
        {grant.isCostSharing && (
          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 border border-yellow-200">
            ⚠ Cost Sharing Required
          </span>
        )}
        {remaining !== null && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              remaining <= 14
                ? "bg-red-50 text-red-700 border-red-200"
                : remaining <= 30
                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
            }`}
          >
            {remaining > 0
              ? `${remaining} days left`
              : remaining === 0
                ? "Closes today"
                : "Closed"}
          </span>
        )}
        {grant.fundingInstruments.map((inst) => (
          <span
            key={inst}
            className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 border border-gray-200"
          >
            {formatInstrument(inst)}
          </span>
        ))}
      </div>

      {/* Key Details Grid */}
      {(grant.totalFunding || grant.expectedAwards || grant.closeDate) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          {grant.totalFunding && (
            <div>
              <p className="text-xs text-muted-foreground">Total Program Funding</p>
              <p className="font-medium">{formatDollars(grant.totalFunding)}</p>
            </div>
          )}
          {grant.expectedAwards && (
            <div>
              <p className="text-xs text-muted-foreground">Expected Awards</p>
              <p className="font-medium">{grant.expectedAwards}</p>
            </div>
          )}
          {grant.closeDate && (
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="font-medium">{formatDate(grant.closeDate)}</p>
            </div>
          )}
          {grant.fundingCategories.length > 0 && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-medium">
                {grant.fundingCategories.map(formatCategory).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Eligibility Details */}
      {grant.eligibilityDescription && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Eligibility Requirements
          </p>
          <p className="text-sm leading-relaxed">
            {grant.eligibilityDescription.length > 300
              ? grant.eligibilityDescription.slice(0, 300) + "..."
              : grant.eligibilityDescription}
          </p>
        </div>
      )}

      {/* Deadline Note */}
      {grant.closeDateDescription && (
        <p className="text-xs text-muted-foreground italic">
          {grant.closeDateDescription}
        </p>
      )}

      {/* Attachments */}
      {grant.attachments.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Documents ({grant.attachments.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {grant.attachments.slice(0, 5).map((att) => (
              <a
                key={att.downloadPath}
                href={att.downloadPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md bg-muted/50 px-2 py-1 text-xs text-primary hover:underline"
              >
                {att.fileName.length > 30
                  ? att.fileName.slice(0, 27) + "..."
                  : att.fileName}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border pt-3">
        {grant.contactDescription && (
          <span>Contact: {grant.contactDescription.split("\n")[0]}</span>
        )}
        {grant.agencyEmail && (
          <a
            href={`mailto:${grant.agencyEmail}`}
            className="hover:underline text-primary"
          >
            {grant.agencyEmail}
          </a>
        )}
        {grant.additionalInfoUrl && (
          <a
            href={grant.additionalInfoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-primary"
          >
            More Info
          </a>
        )}
      </div>
    </div>
  );
}
