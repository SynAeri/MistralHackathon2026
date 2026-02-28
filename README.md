:q

Basic User Flow

```mermaid
flowchart TD
  P0[Patient opens link] --> P1[Consent and privacy]
  P1 --> P2[Mic check and quiet tips]
  P2 --> P3{First time?}

  P3 -->|Yes| P4[Baseline recording]
  P4 --> P4a[Prompt A: fixed reading]
  P4a --> P4b[Prompt B: sustained ahh]
  P4b --> P5[Upload and QC]

  P3 -->|No| P7[Routine check-in]
  P7 --> P7a[Prompt A: fixed reading]
  P7a --> P7b[Prompt B: sustained ahh]
  P7b --> P5

  P5 --> P6{QC pass?}
  P6 -->|No| P6a[QC fail: too noisy or too short]
  P6a --> P4
  P6 -->|Yes| S0[Compute features]

  S0 --> S1{Has baseline?}
  S1 -->|No| S2[Create baseline profile]
  S1 -->|Yes| S3[Normalize vs baseline]
  S2 --> S4[Update time series]
  S3 --> S4[Update time series]

  S4 --> S5[Compute risk score and drivers]
  S5 --> S6{Flag triggered?}
  S6 -->|No| P8[Patient sees: check-in saved]
  S6 -->|Yes| P9[Patient sees: check-in saved]
  S6 -->|Yes| C0[Clinician alert created]

  C0 --> C1[Clinician triage queue]
  C1 --> C2[Select patient]
  C2 --> C3[Patient detail: risk, drivers, trends, QC]
  C3 --> C4{Clinician action}
  C4 -->|Message| C5[Message patient]
  C4 -->|Call| C6[Call or book follow-up]
  C4 -->|Adjust| C7[Adjust cadence or thresholds]
  C4 -->|Monitor| C8[No action]

  C5 --> C9[Label outcome]

  C6 --> C9
  C7 --> C9
  C8 --> C9

  ```
