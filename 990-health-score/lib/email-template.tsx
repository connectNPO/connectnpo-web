import { GRADE_COLORS, type ScoreResult } from "@/lib/scoring";

interface EmailTemplateProps {
  firstName?: string;
  orgName?: string;
  scoreResult: ScoreResult;
  encodedData: string;
  baseUrl: string;
}

const TEAL = "#1D9E75";

export function EmailTemplate({
  firstName,
  orgName,
  scoreResult,
  encodedData,
  baseUrl,
}: EmailTemplateProps) {
  const { totalScore, grade, metrics } = scoreResult;
  const gradeColor = GRADE_COLORS[grade];
  const reportUrl = `${baseUrl}/results?d=${encodedData}`;

  const weakest = [...metrics]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        backgroundColor: "#F3F4F6",
        padding: "24px",
        margin: 0,
        color: "#111827",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            backgroundColor: TEAL,
            color: "#FFFFFF",
            padding: "20px 24px",
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "0.5px",
          }}
        >
          GivingArc
        </div>

        <div style={{ padding: "32px 24px" }}>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.5,
              margin: "0 0 16px 0",
            }}
          >
            Hi {firstName || "there"},
          </p>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.5,
              margin: "0 0 24px 0",
              color: "#4B5563",
            }}
          >
            {orgName ? `Here's how ${orgName}'s` : "Here's how your"}{" "}
            most recent Form 990 looks against Charity Navigator-style
            financial benchmarks.
          </p>

          <div
            style={{
              backgroundColor: gradeColor,
              color: "#FFFFFF",
              borderRadius: "8px",
              padding: "32px 24px",
              textAlign: "center",
              margin: "0 0 24px 0",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                opacity: 0.9,
                margin: "0 0 8px 0",
              }}
            >
              Your 990 Health Score
            </div>
            <div
              style={{
                fontSize: "64px",
                fontWeight: 700,
                lineHeight: 1,
                margin: "0 0 8px 0",
              }}
            >
              {totalScore}
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              Grade {grade}
            </div>
          </div>

          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              margin: "0 0 12px 0",
              color: "#111827",
            }}
          >
            Your top areas to improve
          </h2>

          {weakest.map((m) => (
            <div
              key={m.name}
              style={{
                borderLeft: `4px solid ${GRADE_COLORS[m.grade]}`,
                backgroundColor: "#F9FAFB",
                padding: "12px 16px",
                margin: "0 0 12px 0",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#111827",
                  margin: "0 0 4px 0",
                }}
              >
                {m.name} — {m.formatted} (Grade {m.grade})
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#4B5563",
                  lineHeight: 1.5,
                }}
              >
                {m.recommendation ?? m.insight}
              </div>
            </div>
          ))}

          <div
            style={{
              textAlign: "center",
              margin: "32px 0 8px 0",
            }}
          >
            <a
              href={reportUrl}
              style={{
                display: "inline-block",
                backgroundColor: TEAL,
                color: "#FFFFFF",
                textDecoration: "none",
                padding: "14px 28px",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              View Full Report
            </a>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#6B7280",
              textAlign: "center",
              margin: "0 0 16px 0",
              wordBreak: "break-all",
            }}
          >
            Or copy this link: {reportUrl}
          </p>
        </div>

        <div
          style={{
            borderTop: "1px solid #E5E7EB",
            padding: "16px 24px",
            fontSize: "12px",
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          <a
            href="https://givingarc.com"
            style={{ color: "#6B7280", textDecoration: "underline" }}
          >
            givingarc.com
          </a>
          {"  ·  "}
          <a
            href={`${baseUrl}/unsubscribe`}
            style={{ color: "#6B7280", textDecoration: "underline" }}
          >
            Unsubscribe
          </a>
        </div>
      </div>
    </div>
  );
}
