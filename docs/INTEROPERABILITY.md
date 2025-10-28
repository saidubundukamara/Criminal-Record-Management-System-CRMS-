# CRMS Interoperability Framework

**Version:** 1.0
**Date:** 2025-01-28
**Status:** Draft

---

## 1. Overview

This document defines the interoperability framework for the Criminal Record Management System (CRMS) across multiple African countries. As a pan-African Digital Public Good, CRMS is designed to enable secure, privacy-compliant cross-border collaboration while respecting each country's sovereignty and legal frameworks.

### 1.1 Interoperability Goals

1. **Cross-Border Coordination** - Enable law enforcement agencies to coordinate across national boundaries
2. **Data Exchange** - Facilitate secure sharing of criminal records, alerts, and case information
3. **Sovereignty Preservation** - Each country maintains full control over their data and policies
4. **Privacy Compliance** - Adhere to GDPR, Malabo Convention, and local data protection laws
5. **Flexibility** - Support varying levels of integration based on bilateral agreements

### 1.2 Scope

This framework covers:
- Cross-border data exchange protocols
- API standards for inter-country communication
- Data format specifications
- Security and authentication mechanisms
- Privacy and legal compliance requirements
- Integration patterns and best practices

---

## 2. Architecture Overview

### 2.1 Deployment Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    Pan-African CRMS Network                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐│
│   │   Country A  │◄────►│   Country B  │◄────►│   Country C  ││
│   │     CRMS     │      │     CRMS     │      │     CRMS     ││
│   │  (Sierra     │      │   (Nigeria)  │      │   (Kenya)    ││
│   │   Leone)     │      │              │      │              ││
│   └──────────────┘      └──────────────┘      └──────────────┘│
│          ▲                     ▲                     ▲         │
│          │                     │                     │         │
│          └─────────────────────┼─────────────────────┘         │
│                                │                               │
│                    ┌───────────▼──────────┐                    │
│                    │  Regional Hub        │                    │
│                    │  (Optional)          │                    │
│                    │  - ECOWAS Hub        │                    │
│                    │  - EAC Hub           │                    │
│                    │  - SADC Hub          │                    │
│                    └──────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Integration Patterns

CRMS supports three integration patterns:

1. **Bilateral (Point-to-Point)**
   - Direct country-to-country connections
   - Suitable for neighbors with frequent cooperation
   - Requires bilateral data sharing agreements

2. **Regional Hub**
   - Regional organizations (ECOWAS, EAC, SADC) host central hubs
   - Member countries connect to hub
   - Hub facilitates data exchange and coordination

3. **Hybrid**
   - Combination of bilateral and hub connections
   - Countries can have both direct connections and hub access

---

## 3. Cross-Border Data Exchange

### 3.1 Exchangeable Data Types

#### 3.1.1 Wanted Persons
- **Use Case:** Share information about wanted criminals across borders
- **Data Shared:** Name, aliases, charges, photo, danger level, NIN (if available)
- **Privacy Level:** High - Publicly shareable within law enforcement
- **API Endpoint:** `POST /api/interop/wanted-persons/broadcast`

#### 3.1.2 Amber Alerts
- **Use Case:** Cross-border missing children alerts
- **Data Shared:** Child's details, last seen location, contact information
- **Privacy Level:** High - Can be shared with public
- **API Endpoint:** `POST /api/interop/amber-alerts/broadcast`

#### 3.1.3 Background Checks
- **Use Case:** Verify criminal records for cross-border employment, visa, etc.
- **Data Shared:** Record exists (yes/no), conviction details (with consent)
- **Privacy Level:** Very High - Requires explicit consent and legal basis
- **API Endpoint:** `POST /api/interop/background-checks/query`

#### 3.1.4 Case Coordination
- **Use Case:** Link cases involving suspects/victims from multiple countries
- **Data Shared:** Case metadata, suspect/victim information, coordination contact
- **Privacy Level:** High - Restricted to authorized officers only
- **API Endpoint:** `POST /api/interop/cases/coordinate`

#### 3.1.5 Evidence Sharing
- **Use Case:** Share digital evidence for cross-border investigations
- **Data Shared:** Evidence metadata, encrypted files, chain of custody
- **Privacy Level:** Very High - Requires judicial authorization
- **API Endpoint:** `POST /api/interop/evidence/share`

### 3.2 Data Exchange Principles

1. **Minimum Necessary** - Only share data essential for the request
2. **Explicit Consent** - Obtain consent where legally required (background checks)
3. **Judicial Authorization** - Evidence sharing requires court approval
4. **Audit Everything** - Log all cross-border data exchanges
5. **Encryption in Transit** - TLS 1.3 for all communications
6. **Data Retention Limits** - Requesting country must honor retention policies

---

## 4. API Standards

### 4.1 RESTful API Design

All inter-country APIs follow REST principles:

- **Base URL Format:** `https://crms.{country-code}.gov/api/interop/v1/`
- **Authentication:** Mutual TLS (mTLS) with API keys
- **Content Type:** `application/json`
- **Versioning:** URL-based (`/v1/`, `/v2/`)

### 4.2 Common Headers

All cross-border API requests must include:

```http
Authorization: Bearer {JWT_TOKEN}
X-Country-Code: ISO_3166-1_ALPHA-3
X-Agency-ID: UNIQUE_AGENCY_IDENTIFIER
X-Request-ID: UUID_V4
X-Request-Timestamp: ISO_8601_TIMESTAMP
X-Request-Signature: HMAC_SHA256_SIGNATURE
```

### 4.3 Standard Response Format

```json
{
  "status": "success" | "error",
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO_8601",
    "respondingCountry": "ISO_3166-1_ALPHA-3"
  }
}
```

### 4.4 Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication |
| `FORBIDDEN` | No data sharing agreement exists |
| `NOT_FOUND` | Requested record not found |
| `CONSENT_REQUIRED` | Data subject consent needed |
| `JUDICIAL_AUTH_REQUIRED` | Court order required |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DATA_RETENTION_EXPIRED` | Record deleted per retention policy |

---

## 5. Data Format Specifications

### 5.1 Person Data Exchange Format

**Standard:** JSON Schema-based

```json
{
  "$schema": "https://crms-dpg.org/schemas/person/v1.json",
  "personId": "uuid",
  "sourceCountry": "SLE",
  "nationalId": {
    "type": "NIN",
    "value": "encrypted_or_hashed",
    "countryCode": "SLE"
  },
  "fullName": "string",
  "aliases": ["string"],
  "dateOfBirth": "YYYY-MM-DD",
  "gender": "M|F|X",
  "nationality": "ISO_3166-1_ALPHA-3",
  "photoUrl": "https://...",
  "fingerprintHash": "SHA256_hash",
  "lastKnownLocation": {
    "country": "ISO_3166-1_ALPHA-3",
    "city": "string",
    "coordinates": {
      "lat": number,
      "lng": number
    }
  }
}
```

### 5.2 Wanted Person Broadcast Format

```json
{
  "$schema": "https://crms-dpg.org/schemas/wanted-person/v1.json",
  "id": "uuid",
  "issuingCountry": "SLE",
  "issuedDate": "ISO_8601",
  "expiresDate": "ISO_8601",
  "person": { ... },
  "charges": [
    {
      "offense": "string",
      "severity": "minor|major|critical",
      "details": "string"
    }
  ],
  "dangerLevel": "low|medium|high|extreme",
  "reward": {
    "amount": number,
    "currency": "ISO_4217"
  },
  "contactAgency": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "countryCode": "ISO_3166-1_ALPHA-3"
  },
  "interpol": {
    "noticeType": "red|blue|green|yellow|black|orange|purple",
    "noticeNumber": "string"
  }
}
```

### 5.3 Amber Alert Format

```json
{
  "$schema": "https://crms-dpg.org/schemas/amber-alert/v1.json",
  "id": "uuid",
  "issuingCountry": "SLE",
  "issuedDate": "ISO_8601",
  "childDetails": {
    "name": "string",
    "age": number,
    "gender": "M|F",
    "description": "string",
    "photoUrl": "https://..."
  },
  "lastSeen": {
    "location": "string",
    "datetime": "ISO_8601",
    "coordinates": {
      "lat": number,
      "lng": number
    }
  },
  "suspectDetails": {
    "description": "string",
    "vehicleDescription": "string",
    "possibleDestinations": ["string"]
  },
  "contactInfo": {
    "emergency": "string",
    "agency": "string"
  },
  "status": "active|found|expired"
}
```

### 5.4 Background Check Request Format

```json
{
  "$schema": "https://crms-dpg.org/schemas/background-check/v1.json",
  "requestId": "uuid",
  "requestingCountry": "KEN",
  "requestingAgency": "string",
  "requestType": "employment|visa|officer|judicial",
  "subject": {
    "nationalId": {
      "type": "string",
      "value": "string",
      "countryCode": "ISO_3166-1_ALPHA-3"
    },
    "fullName": "string",
    "dateOfBirth": "YYYY-MM-DD",
    "consentProvided": boolean,
    "consentDocumentUrl": "https://..."
  },
  "legalBasis": {
    "treaty": "string",
    "bilateralAgreement": "string",
    "courtOrder": "string"
  },
  "requestedScope": [
    "criminal_convictions",
    "pending_cases",
    "wanted_status"
  ]
}
```

### 5.5 Background Check Response Format

```json
{
  "$schema": "https://crms-dpg.org/schemas/background-check-response/v1.json",
  "requestId": "uuid",
  "respondingCountry": "SLE",
  "responseDate": "ISO_8601",
  "status": "clear|record_exists|consent_required|not_found",
  "records": [
    {
      "type": "conviction",
      "offense": "string",
      "severity": "minor|major|critical",
      "date": "YYYY-MM-DD",
      "jurisdiction": "string",
      "status": "active|served|pardoned"
    }
  ],
  "redactionReason": "privacy|consent_missing|judicial_auth_required",
  "validUntil": "ISO_8601",
  "certificateUrl": "https://...",
  "verificationCode": "string"
}
```

---

## 6. Security & Authentication

### 6.1 Authentication Mechanisms

#### 6.1.1 Mutual TLS (mTLS)
- **Primary Method:** Certificate-based authentication
- **Certificate Authority:** Regional or continental PKI
- **Certificate Format:** X.509v3
- **Key Length:** RSA 4096-bit or ECC P-384

#### 6.1.2 API Keys
- **Secondary Layer:** Combined with mTLS
- **Key Format:** UUID v4
- **Rotation:** Every 90 days
- **Storage:** Encrypted at rest

#### 6.1.3 JWT Tokens
- **Use:** Request authorization
- **Algorithm:** RS256
- **Expiry:** 15 minutes
- **Claims:**
  ```json
  {
    "iss": "https://crms.sle.gov",
    "sub": "agency_id",
    "aud": "https://crms.nga.gov",
    "exp": 1234567890,
    "iat": 1234567890,
    "scope": "wanted_person:read amber_alert:broadcast"
  }
  ```

### 6.2 Request Signing

All requests must be signed using HMAC-SHA256:

```
Signature = HMAC-SHA256(
  secret_key,
  HTTP_METHOD + "\n" +
  REQUEST_PATH + "\n" +
  TIMESTAMP + "\n" +
  REQUEST_BODY_HASH
)
```

### 6.3 Data Encryption

#### 6.3.1 In Transit
- **Protocol:** TLS 1.3
- **Cipher Suites:**
  - TLS_AES_256_GCM_SHA384
  - TLS_CHACHA20_POLY1305_SHA256

#### 6.3.2 At Rest (Shared Data)
- **Algorithm:** AES-256-GCM
- **Key Management:** Per-country keys, exchanged via secure channels
- **Key Rotation:** Annual

#### 6.3.3 Sensitive Fields Encryption
Certain fields must be encrypted even within JSON payloads:
- National ID numbers
- Addresses
- Phone numbers
- Biometric data

### 6.4 IP Whitelisting

Countries can optionally implement IP whitelisting:
- Maintain list of authorized IP ranges per partner country
- Update via secure out-of-band process
- Log all connection attempts

---

## 7. Privacy & Legal Compliance

### 7.1 Legal Framework

#### 7.1.1 Applicable Laws & Treaties
- **GDPR** (EU General Data Protection Regulation) - Standard for data protection
- **Malabo Convention** (African Union Convention on Cyber Security)
- **Bilateral MLATs** (Mutual Legal Assistance Treaties)
- **Regional Agreements** (ECOWAS, EAC, SADC data sharing protocols)
- **Interpol Framework** for international police cooperation

#### 7.1.2 Legal Basis for Data Sharing

| Data Type | Legal Basis Required |
|-----------|---------------------|
| Wanted Persons | Law enforcement cooperation treaty |
| Amber Alerts | Humanitarian grounds, child protection laws |
| Background Checks | Subject consent + bilateral agreement |
| Case Coordination | MLAT or judicial cooperation agreement |
| Evidence Sharing | Court order + MLAT |

### 7.2 Data Subject Rights

#### 7.2.1 Right to Know
- Data subjects can request disclosure of cross-border data sharing
- Response time: 30 days
- Exceptions: Active investigations

#### 7.2.2 Right to Rectification
- Incorrect data must be corrected across all sharing countries
- Notification mechanism required

#### 7.2.3 Right to Erasure
- Honored when legally permissible
- Some records (convictions) may have mandatory retention periods

### 7.3 Cross-Border Data Transfer Safeguards

#### 7.3.1 Standard Contractual Clauses
Countries without adequacy decisions must use Standard Contractual Clauses (SCCs) modeled on EU SCCs:
- Data exporter obligations
- Data importer obligations
- Data subject rights
- Liability provisions

#### 7.3.2 Data Processing Agreements
Formal agreements must specify:
- Purpose limitation
- Data retention periods
- Security measures
- Sub-processing restrictions
- Breach notification procedures

### 7.4 Consent Management

For background checks requiring consent:
- **Consent Format:** Written, informed, freely given
- **Consent Storage:** Digitally signed PDF
- **Consent Proof:** Must accompany request
- **Withdrawal:** Subject can withdraw; must stop processing

---

## 8. National ID System Mapping

### 8.1 Challenge

Different countries use different national ID systems:
- Sierra Leone: NIN
- Nigeria: National Identification Number (NIN)
- Kenya: Huduma Namba
- Ghana: Ghana Card Number
- South Africa: ID Number

### 8.2 Solution: Federated Identity Approach

#### 8.2.1 ID Schema

```json
{
  "nationalId": {
    "type": "NIN|HUDUMA|GHANA_CARD|SA_ID|PASSPORT",
    "value": "encrypted_value",
    "countryCode": "ISO_3166-1_ALPHA-3",
    "issuedDate": "YYYY-MM-DD",
    "verificationStatus": "verified|unverified"
  }
}
```

#### 8.2.2 Cross-Reference Table

Each CRMS instance maintains an optional cross-reference table for persons with multiple IDs:

```sql
CREATE TABLE national_id_cross_reference (
  id UUID PRIMARY KEY,
  person_id UUID REFERENCES persons(id),
  country_code VARCHAR(3),
  id_type VARCHAR(50),
  id_value_encrypted TEXT,
  verification_status VARCHAR(20),
  verified_by VARCHAR(255),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 8.2.3 Matching Algorithms

When searching across borders without exact ID match, use fuzzy matching:
- **Name matching:** Levenshtein distance, soundex
- **Date of Birth:** Exact match
- **Biometrics:** Fingerprint hash comparison
- **Confidence Score:** 0-100 scale

---

## 9. Alert Broadcasting

### 9.1 Wanted Person Broadcasting

#### 9.1.1 Workflow

1. **Issuance** - Country A issues wanted notice
2. **Validation** - CRMS validates required fields
3. **Broadcast** - Send to all connected countries
4. **Acknowledgment** - Each country confirms receipt
5. **Publication** - Countries publish per their policies
6. **Updates** - Broadcast status changes (captured, expired)

#### 9.1.2 API Endpoint

**POST** `/api/interop/v1/wanted-persons/broadcast`

**Request:**
```json
{
  "wantedPerson": { ... },
  "recipients": ["NGA", "KEN", "GHA", "*"],
  "priority": "high|medium|low",
  "expiryDate": "ISO_8601"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "broadcastId": "uuid",
    "recipients": [
      {
        "countryCode": "NGA",
        "status": "delivered",
        "timestamp": "ISO_8601"
      }
    ]
  }
}
```

#### 9.1.3 Receiving Broadcast

**Webhook:** `POST /api/interop/v1/wanted-persons/receive`

Countries implement this endpoint to receive broadcasts.

### 9.2 Amber Alert Broadcasting

Similar workflow to wanted persons, but with:
- **Higher Priority:** Immediate distribution
- **Public Dissemination:** Can be shared with media
- **Time-Sensitive:** Auto-expire after 72 hours (configurable)
- **SMS Integration:** Optional SMS broadcast to citizens

---

## 10. Case Coordination

### 10.1 Cross-Border Case Linking

#### 10.1.1 Scenario
- Country A is investigating a case involving a suspect from Country B
- Country B has an open case on the same suspect
- Both countries want to coordinate

#### 10.1.2 Coordination Request

**POST** `/api/interop/v1/cases/coordinate`

**Request:**
```json
{
  "requestingCountry": "SLE",
  "caseId": "uuid",
  "caseNumber": "HQ-2025-000123",
  "linkedCountry": "NGA",
  "linkReason": "shared_suspect|shared_victim|related_offenses",
  "suspect": {
    "nationalId": { ... },
    "name": "string"
  },
  "requestedAction": "information_sharing|joint_investigation|extradition_request",
  "contactOfficer": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "badge": "string"
  },
  "legalBasis": "MLAT|bilateral_agreement",
  "urgency": "critical|high|medium|low"
}
```

#### 10.1.3 Response

```json
{
  "status": "success",
  "data": {
    "coordinationId": "uuid",
    "linkedCases": [
      {
        "countryCode": "NGA",
        "caseNumber": "AB-2025-000456",
        "contactOfficer": { ... }
      }
    ],
    "secureChannelUrl": "https://secure-channel.crms.org/coord/uuid"
  }
}
```

### 10.2 Secure Communication Channel

For ongoing coordination, CRMS provides:
- **Encrypted Messaging:** End-to-end encrypted chat
- **File Sharing:** Secure evidence exchange
- **Video Conferencing:** Integration with secure VC platforms
- **Audit Trail:** Complete log of all communications

---

## 11. Evidence Sharing

### 11.1 Legal Requirements

Evidence sharing is the most sensitive interoperability function. Requirements:
- **Judicial Authorization:** Court order or magistrate approval
- **Chain of Custody:** Maintained throughout transfer
- **Encryption:** End-to-end encryption mandatory
- **Integrity:** Cryptographic hashes to verify tampering
- **Audit:** Immutable audit trail

### 11.2 Evidence Sharing Workflow

1. **Request** - Country A requests evidence from Country B
2. **Judicial Review** - Country B's judiciary reviews request
3. **Authorization** - Judge approves/denies
4. **Preparation** - Evidence prepared, encrypted, hashed
5. **Transfer** - Secure transfer via CRMS
6. **Receipt Confirmation** - Country A confirms receipt and integrity
7. **Chain of Custody Update** - Both countries update custody logs

### 11.3 API Endpoint

**POST** `/api/interop/v1/evidence/request`

**Request:**
```json
{
  "requestingCountry": "KEN",
  "requestingJudge": {
    "name": "string",
    "courtId": "string",
    "courtOrderNumber": "string",
    "courtOrderDate": "YYYY-MM-DD"
  },
  "caseReference": {
    "coordinationId": "uuid",
    "caseNumber": "string"
  },
  "evidenceRequested": {
    "type": "digital|physical_digital_copy",
    "description": "string",
    "evidenceIds": ["uuid"]
  },
  "legalBasis": "MLAT|bilateral_agreement",
  "urgency": "critical|high|medium|low"
}
```

### 11.4 Evidence Transfer Format

```json
{
  "transferId": "uuid",
  "metadata": {
    "evidenceId": "uuid",
    "type": "photo|document|video|audio",
    "description": "string",
    "collectedDate": "ISO_8601",
    "collectedBy": "officer_info"
  },
  "chainOfCustody": [
    {
      "officerId": "uuid",
      "action": "collected|transferred|received",
      "timestamp": "ISO_8601",
      "location": "string",
      "countryCode": "ISO_3166-1_ALPHA-3"
    }
  ],
  "file": {
    "encryptedUrl": "https://...",
    "encryptionAlgorithm": "AES-256-GCM",
    "encryptionKey": "encrypted_with_recipient_public_key",
    "sha256Hash": "hash_of_original_file",
    "sizeBytes": number
  },
  "judicialAuthorization": {
    "orderNumber": "string",
    "issuingJudge": "string",
    "courtName": "string",
    "validUntil": "ISO_8601"
  }
}
```

---

## 12. Integration Patterns & Best Practices

### 12.1 Synchronous vs Asynchronous

| Operation | Pattern | Reason |
|-----------|---------|--------|
| Background Check | Synchronous | Immediate response needed |
| Wanted Person Broadcast | Asynchronous | Multi-recipient, not time-critical |
| Amber Alert | Synchronous | Time-critical, acknowledgment needed |
| Case Coordination Request | Synchronous | Need immediate confirmation |
| Evidence Transfer | Asynchronous | Large files, judicial delays |

### 12.2 Webhook Pattern

Countries should implement webhooks for asynchronous notifications:

**Configuration:**
```json
{
  "webhookUrl": "https://crms.ken.gov/api/interop/webhooks/receive",
  "events": [
    "wanted_person.created",
    "wanted_person.captured",
    "amber_alert.created",
    "amber_alert.found",
    "case.coordination_request",
    "evidence.transfer_complete"
  ],
  "secret": "shared_secret_for_signature_verification"
}
```

### 12.3 Rate Limiting

To prevent abuse and ensure fair resource usage:

| Endpoint | Rate Limit |
|----------|------------|
| Background Checks | 100 requests/hour |
| Wanted Person Queries | 1000 requests/hour |
| Case Coordination | 50 requests/hour |
| Evidence Requests | 10 requests/hour |

Rate limits can be adjusted via bilateral agreements.

### 12.4 Retry Logic

For failed requests, implement exponential backoff:
- **Initial Retry:** 1 second
- **Max Retries:** 5
- **Backoff Multiplier:** 2x
- **Max Backoff:** 60 seconds

### 12.5 Circuit Breaker

Implement circuit breaker pattern:
- **Failure Threshold:** 50% errors over 1 minute
- **Open Duration:** 5 minutes
- **Half-Open Test:** 1 request after cooldown

---

## 13. Regional Hub Implementation

### 13.1 Hub Architecture

Regional organizations (ECOWAS, EAC, SADC) can operate central hubs:

```
┌─────────────────────────────────────────┐
│         ECOWAS CRMS Hub                 │
│  (Hosted by ECOWAS Commission)          │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Hub Services                  │   │
│  │  - Message Routing              │   │
│  │  - Data Aggregation             │   │
│  │  - Search Across Members        │   │
│  │  - Regional Analytics           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Connected Countries           │   │
│  │  - Sierra Leone                 │   │
│  │  - Nigeria                      │   │
│  │  - Ghana                        │   │
│  │  - Senegal                      │   │
│  │  - ... (15 ECOWAS members)      │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 13.2 Hub Benefits

1. **Simplified Connectivity** - One connection per country instead of N*(N-1)/2
2. **Regional Search** - Search for wanted persons across all member states
3. **Analytics** - Regional crime statistics and trends
4. **Standardization** - Enforce common standards
5. **Cost Sharing** - Shared infrastructure costs

### 13.3 Hub Responsibilities

- **Message Routing:** Forward requests to appropriate countries
- **Caching:** Cache frequently accessed data (with TTL)
- **Rate Limiting:** Enforce fair usage across members
- **Monitoring:** Uptime and performance monitoring
- **Compliance:** Ensure data protection compliance

---

## 14. Versioning & Compatibility

### 14.1 API Versioning

- **Strategy:** URL-based versioning (`/v1/`, `/v2/`)
- **Support Period:** Each version supported for minimum 24 months
- **Deprecation Notice:** 12 months before end-of-life
- **Breaking Changes:** Only in major versions

### 14.2 Schema Versioning

JSON schemas use semantic versioning:
- **Major:** Breaking changes
- **Minor:** Backward-compatible additions
- **Patch:** Corrections, clarifications

### 14.3 Backward Compatibility

When upgrading, ensure:
- Old clients can still communicate (content negotiation)
- New fields are optional
- Deprecated fields continue to work
- Clear migration guides provided

### 14.4 Feature Negotiation

Countries can advertise supported features:

**GET** `/api/interop/v1/capabilities`

**Response:**
```json
{
  "country": "SLE",
  "version": "1.2.0",
  "features": [
    "wanted_person_broadcast",
    "amber_alert_broadcast",
    "background_check",
    "case_coordination",
    "evidence_sharing"
  ],
  "schemas": {
    "wanted_person": "1.0.0",
    "amber_alert": "1.1.0",
    "background_check": "1.0.0"
  },
  "supported_id_types": ["NIN", "PASSPORT"],
  "rate_limits": {
    "background_check": 100
  }
}
```

---

## 15. Monitoring & Observability

### 15.1 Health Check Endpoint

**GET** `/api/interop/v1/health`

**Response:**
```json
{
  "status": "healthy|degraded|down",
  "timestamp": "ISO_8601",
  "components": {
    "database": "healthy",
    "storage": "healthy",
    "external_apis": "degraded"
  }
}
```

### 15.2 Metrics to Track

- **Request Volume:** Requests per minute/hour by endpoint
- **Response Time:** P50, P95, P99 latency
- **Error Rate:** Percentage of failed requests
- **Success Rate:** Percentage of successful broadcasts
- **Data Volume:** Bytes transferred per country
- **Active Connections:** Current mTLS connections

### 15.3 Audit Logging

All interoperability operations must be logged:

```typescript
{
  id: "uuid",
  timestamp: "ISO_8601",
  operation: "wanted_person_broadcast|background_check|case_coordination|evidence_transfer",
  sourceCountry: "SLE",
  targetCountry: "NGA",
  requestId: "uuid",
  officerId: "uuid",
  dataSubject: "person_identifier",
  legalBasis: "treaty|consent|judicial_order",
  outcome: "success|failure",
  details: { ... }
}
```

### 15.4 Incident Response

For interoperability incidents:
1. **Detection** - Monitoring alerts detect issue
2. **Notification** - Affected countries notified immediately
3. **Investigation** - Joint troubleshooting
4. **Resolution** - Fix implemented
5. **Post-Mortem** - Document learnings

---

## 16. Testing & Validation

### 16.1 Integration Testing

Before going live, countries must complete integration testing:

1. **Connectivity Test** - Verify mTLS connection
2. **Authentication Test** - Verify API key and JWT
3. **Wanted Person Broadcast** - Send and receive test alert
4. **Background Check** - Request and respond to test check
5. **Error Handling** - Test various error scenarios
6. **Rate Limiting** - Verify rate limits work
7. **Large Data Transfer** - Test evidence file transfer

### 16.2 Test Environment

Maintain separate test environments:
- **Test Domain:** `test.crms.{country}.gov`
- **Test Data:** Synthetic, non-PII data
- **Test Certificates:** Separate PKI for testing

### 16.3 Compliance Validation

Before production:
- **Security Audit** - Third-party security review
- **Privacy Impact Assessment** - DPIA completed
- **Legal Review** - Bilateral agreements signed
- **Penetration Testing** - Ethical hacking assessment

---

## 17. Governance & Coordination

### 17.1 Interoperability Working Group

Establish a pan-African CRMS Interoperability Working Group:
- **Members:** One representative per participating country
- **Meetings:** Quarterly video conferences
- **Responsibilities:**
  - API standards evolution
  - Dispute resolution
  - Best practice sharing
  - Capacity building

### 17.2 Change Management

For changes to interoperability standards:
1. **Proposal** - Any country can propose changes
2. **Discussion** - Working group discusses via mailing list
3. **Voting** - Simple majority for minor changes, 2/3 for breaking changes
4. **Implementation Period** - Minimum 6 months for adoption
5. **Monitoring** - Track adoption rates

### 17.3 Dispute Resolution

For disagreements between countries:
1. **Bilateral Discussion** - Direct negotiation
2. **Mediation** - Regional organization mediates
3. **Arbitration** - Technical committee reviews
4. **Suspension** - As last resort, suspend interoperability

---

## 18. Implementation Checklist

### 18.1 Technical Prerequisites

- [ ] CRMS instance deployed and operational
- [ ] Public IP address or domain name
- [ ] TLS certificate from recognized CA
- [ ] mTLS certificates obtained
- [ ] API gateway configured
- [ ] Firewall rules updated
- [ ] Monitoring and logging setup

### 18.2 Legal Prerequisites

- [ ] Data Protection Impact Assessment completed
- [ ] Bilateral data sharing agreements signed
- [ ] Legal counsel approval obtained
- [ ] Privacy policy updated
- [ ] Audit framework established

### 18.3 Operational Prerequisites

- [ ] Staff trained on interoperability features
- [ ] Incident response plan created
- [ ] 24/7 contact designated
- [ ] Test environment ready
- [ ] Integration tests passed
- [ ] Security audit completed

---

## 19. Future Enhancements

### 19.1 Planned Features

1. **Real-Time Sync** - Continuous synchronization of wanted persons
2. **Blockchain for Audit Trail** - Immutable, distributed audit logs
3. **AI-Powered Matching** - Better fuzzy matching across ID systems
4. **Mobile App Integration** - Officer field apps with cross-border queries
5. **Biometric Sharing** - Standardized fingerprint/facial recognition APIs
6. **Predictive Analytics** - Cross-border crime trend analysis

### 19.2 Research Areas

- Zero-Knowledge Proofs for privacy-preserving queries
- Federated Learning for collaborative ML models
- Quantum-Resistant Cryptography preparation
- IPFS for decentralized evidence storage

---

## 20. Conclusion

This interoperability framework enables the Criminal Record Management System to fulfill its vision as a pan-African Digital Public Good. By providing secure, privacy-compliant mechanisms for cross-border collaboration, CRMS empowers law enforcement agencies across Africa to work together effectively while respecting each nation's sovereignty and legal frameworks.

### 20.1 Key Principles

1. **Sovereignty First** - Each country controls their data
2. **Privacy by Design** - Built-in privacy protections
3. **Interoperability by Default** - Easy to connect
4. **Standards-Based** - Open, documented standards
5. **Incrementally Adoptable** - Countries join at their own pace

### 20.2 Call to Action

Countries interested in joining the CRMS network should:
1. Review this interoperability framework
2. Contact the CRMS Interoperability Working Group
3. Begin bilateral agreement discussions
4. Deploy test environment
5. Complete integration testing
6. Go live!

---

## Appendix A: Glossary

- **CRMS:** Criminal Record Management System
- **DPG:** Digital Public Good
- **MLAT:** Mutual Legal Assistance Treaty
- **mTLS:** Mutual Transport Layer Security
- **NIN:** National Identification Number
- **PKI:** Public Key Infrastructure
- **RBAC:** Role-Based Access Control
- **SDK:** Software Development Kit

## Appendix B: References

1. GDPR - Regulation (EU) 2016/679
2. Malabo Convention - African Union Convention on Cyber Security and Personal Data Protection
3. INTERPOL Data Protection Rules
4. ECOWAS Supplementary Act on Personal Data Protection
5. REST API Best Practices (RFC 7231, RFC 8288)

## Appendix C: Contact Information

**CRMS Interoperability Working Group**
- Email: interop@crms-dpg.org
- Website: https://crms-dpg.org/interoperability
- Mailing List: crms-interop@groups.crms-dpg.org

**Technical Support**
- GitHub: https://github.com/crms-dpg/interoperability
- Issue Tracker: https://github.com/crms-dpg/interoperability/issues

---

**Document Control**
- **Version:** 1.0
- **Status:** Draft
- **Last Updated:** 2025-01-28
- **Next Review:** 2025-07-28
