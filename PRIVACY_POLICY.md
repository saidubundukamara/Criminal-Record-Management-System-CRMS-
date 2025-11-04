# Privacy Policy

**Criminal Record Management System (CRMS)**
**Version:** 1.0
**Effective Date:** January 2025
**Last Updated:** January 2025

---

## 1. Introduction

The Criminal Record Management System (CRMS) is a pan-African Digital Public Good designed for law enforcement agencies across Africa. This Privacy Policy outlines how CRMS handles personal data in compliance with international and regional data protection standards.

**Governing Framework:**
- **General Data Protection Regulation (GDPR)** - European Union standard
- **African Union Convention on Cyber Security and Personal Data Protection (Malabo Convention)** - African regional standard
- **Country-Specific Data Protection Laws** - Local legislation where deployed

**Pilot Implementation:** Sierra Leone Police Force
**Adaptable for:** Any African country's law enforcement agency

---

## 2. Data Controller & Ownership

### 2.1 Data Controller

The **deploying law enforcement agency** acts as the Data Controller for CRMS:
- **Pilot:** Sierra Leone Police Force
- **Future Deployments:** Country-specific law enforcement agencies

### 2.2 Data Processor

CRMS software acts as a Data Processor, processing data on behalf of the deploying agency.

### 2.3 Ownership & Governance

- **Software Ownership:** Open-source (MIT License), maintained by African Digital Goods consortium
- **Data Ownership:** The deploying country's law enforcement agency retains full ownership of all data
- **No Data Sharing:** CRMS does not share data across countries or with third parties

---

## 3. Data We Collect

### 3.1 Law Enforcement Officer Data

**Personal Information:**
- Full name, badge number, rank
- Station assignment, role, permissions
- Contact information (email, phone - optional)
- Authentication credentials (badge + hashed PIN)
- Multi-factor authentication data (when enabled)

**Activity Data:**
- Login/logout timestamps
- Case assignments and actions
- Audit logs (all system operations)
- IP addresses and device information

**Legal Basis:** Legitimate interest for law enforcement operations

### 3.2 Person Records (Suspects, Victims, Witnesses)

**Personal Identifiable Information (PII):**
- Full name, aliases, date of birth
- National identification number (NIN in Sierra Leone, country-specific ID elsewhere)
- Physical characteristics (height, weight, hair color, eye color, identifying marks)
- Contact information (address, phone, email - **encrypted**)
- Photographs (mugshots, scene photos)
- Biometric data (fingerprints - hashed, biometric hash)

**Legal Basis:** Legal obligation for criminal justice administration

### 3.3 Case & Investigation Data

**Criminal Records:**
- Case details (case number, category, severity, status)
- Incident reports, narratives, outcomes
- Court information (charges, sentences, verdicts)
- Relationships to persons (suspect, victim, witness roles)

**Legal Basis:** Legal obligation for criminal justice administration

### 3.4 Evidence Data

**Physical & Digital Evidence:**
- Evidence descriptions, types, locations
- Chain of custody records
- Digital files (images, documents, videos - **encrypted at rest**)
- File integrity hashes (SHA-256)
- QR codes for physical evidence tracking

**Legal Basis:** Legal obligation for evidence management and chain of custody

### 3.5 Background Check Data

**Background Check Requests:**
- Requestor information (officer, citizen, employer, visa applicant)
- Subject information (NIN, name)
- Purpose of check
- Results (full for officers, redacted for citizens)

**Legal Basis:** Legal obligation for background verification services

### 3.6 USSD Interaction Data

**Telecommunications Data:**
- Phone numbers (for background checks via USSD)
- USSD session logs
- Request timestamps

**Legal Basis:** Legitimate interest for service delivery in low-connectivity areas

---

## 4. How We Use Data

### 4.1 Primary Purposes

1. **Criminal Case Management:** Investigate, track, and manage criminal cases
2. **Evidence Management:** Maintain chain of custody and evidence integrity
3. **Background Checks:** Provide criminal record checks for authorized requestors
4. **Alert Systems:** Issue Amber Alerts and wanted person notices
5. **Audit & Accountability:** Track all system operations for transparency
6. **Reporting & Analytics:** Generate statistical reports for decision-making

### 4.2 Secondary Purposes

1. **System Administration:** Maintain system security and integrity
2. **Compliance:** Meet legal and regulatory requirements
3. **Training:** Anonymized data for officer training (PII removed)
4. **Research:** De-identified data for crime prevention research (with proper authorization)

### 4.3 Data Retention

**Active Records:**
- **Criminal Cases:** Retained per country-specific legal requirements
- **Audit Logs:** Retained for 7 years minimum (GDPR requirement)
- **Evidence:** Retained per case retention policy
- **Background Checks:** Retained for 2 years

**Archival:**
- Closed cases may be archived after statutory retention period
- Archival procedures follow country-specific regulations

**Deletion:**
- Data deletion requires proper authorization
- Deletion events are logged in immutable audit trail
- Right to erasure balanced against legal obligations (criminal records exempt from GDPR right to erasure)

---

## 5. Data Security Measures

### 5.1 Encryption

**Data at Rest:**
- PII fields (addresses, phone, email) encrypted with **AES-256-GCM**
- Evidence files encrypted with **AES-256-GCM**
- Encryption key management via secure key storage (never committed to version control)

**Data in Transit:**
- **TLS 1.3** for all HTTPS connections
- Certificate pinning in production
- Secure WebSocket connections for real-time features

**Authentication:**
- PIN hashing with **Argon2id** (memory-hard, GPU-resistant)
- No plaintext passwords stored
- Multi-factor authentication (MFA) support

### 5.2 Access Controls

**Role-Based Access Control (RBAC):**
- 6 roles with hierarchical permissions (SuperAdmin → Viewer)
- Scope-based permissions (own, station, region, national)
- Principle of least privilege

**Audit Logging:**
- Every data access logged (who, what, when, where)
- Immutable audit trail (cannot be deleted or modified)
- Real-time monitoring for suspicious activity

### 5.3 Infrastructure Security

**Application Security:**
- OWASP Top 10 compliance
- Regular security audits
- Dependency vulnerability scanning
- Input validation and sanitization

**Database Security:**
- PostgreSQL with row-level security (RLS)
- Prepared statements (SQL injection prevention)
- Database encryption at rest

**Network Security:**
- Firewall protection
- DDoS mitigation
- Intrusion detection systems (recommended for production)

### 5.4 Offline Security

**Offline-First Architecture:**
- Local data encrypted in IndexedDB
- Sync queue encrypted
- Secure sync protocols (authenticated, encrypted)

---

## 6. Data Sharing & Disclosure

### 6.1 Internal Sharing

**Within Law Enforcement Agency:**
- Officers access data based on RBAC permissions
- Station commanders see station-level data
- Regional/national roles see broader scope
- All access logged in audit trail

### 6.2 External Sharing

**Legal Disclosures:**
- Court orders and subpoenas (per country's legal framework)
- Inter-agency cooperation (with proper authorization)
- National ID registry verification (for background checks)

**No Commercial Sharing:**
- CRMS never shares data with commercial entities
- No advertising or marketing use
- No data sales

### 6.3 Cross-Border Transfers

**Country-Specific Deployments:**
- Each country's deployment is **isolated** - no data sharing across borders
- Data residency: Data stays within the deploying country
- No international transfers unless legally required (e.g., INTERPOL cooperation)

**Multi-Country Adaptability:**
- Each deployment is independent
- No centralized data repository
- Countries control their own data sovereignty

---

## 7. Individual Rights

### 7.1 Rights for Law Enforcement Officers

1. **Right to Access:** Officers can request their personnel data
2. **Right to Rectification:** Corrections to inaccurate personal data
3. **Right to Restrict Processing:** Limit processing during disputes
4. **Right to Data Portability:** Export personal data in machine-readable format

**Limitations:** Criminal case data and audit logs cannot be modified or deleted (legal obligations)

### 7.2 Rights for Subjects of Records (Suspects, Victims, Witnesses)

1. **Right to Access:** Request criminal record information (via background check process)
2. **Right to Rectification:** Correct inaccurate personal information
3. **Right to Restrict Processing:** Limited - criminal records exempt from GDPR erasure

**Important:** Criminal records are exempt from "right to erasure" under GDPR Article 17(3)(e) (public interest in law enforcement) and Malabo Convention Article 14 (legal obligations).

**Background Check Redaction:**
- Citizens receive redacted results ("Clear" or "Record exists - visit station")
- Full details available in-person at stations with proper identification

### 7.3 Right to Object

Individuals can object to:
- Processing for direct marketing (not applicable - CRMS does no marketing)
- Automated decision-making (not applicable - human officers make decisions)

**Cannot object to:**
- Processing required for legal obligations (criminal case management)
- Processing necessary for public interest (law enforcement)

### 7.4 How to Exercise Rights

**Contact the Data Protection Officer (DPO) of the deploying agency:**
- **Sierra Leone:** Sierra Leone Police Force DPO (contact info TBD)
- **Other Countries:** Respective law enforcement agency DPO

**Verification Required:**
- Valid national ID
- Proof of identity
- Request in writing

---

## 8. Children's Privacy

CRMS collects data on juveniles involved in criminal cases (as victims, witnesses, or suspects) as required by law.

**Special Protections:**
- Juvenile records handled per country-specific juvenile justice laws
- Additional access restrictions for juvenile cases
- Sealed records per legal requirements

---

## 9. Data Protection Impact Assessment (DPIA)

### 9.1 High-Risk Processing

CRMS processes special categories of data (biometrics, criminal records) which constitute high-risk processing under GDPR Article 35 and Malabo Convention Article 13.

**Mitigation Measures:**
- Conducted DPIA before deployment (see `docs/SECURITY_CHECKLIST.md`)
- Privacy by Design principles
- Security by Default
- Regular security audits

### 9.2 Biometric Data

**Fingerprints:**
- Stored as **SHA-256 hashes**, not raw images (one-way hashing)
- Used for identification purposes only
- Access restricted to authorized personnel

**Photographs:**
- Stored encrypted
- Access logged
- Retention per case retention policy

---

## 10. Third-Party Services

### 10.1 Telecom Providers (USSD)

**Africa's Talking / Twilio (or country-specific providers):**
- Used for USSD background check service
- Data shared: Phone numbers, USSD session data
- Privacy policies: See respective provider's privacy policy

**Data Minimization:**
- Only phone numbers and session identifiers shared
- No PII shared with telecom providers
- Encrypted communication channels

### 10.2 Cloud Storage (Evidence Files)

**S3-Compatible Storage (MinIO or AWS S3):**
- Evidence files stored encrypted (AES-256)
- No third-party access
- Country-specific deployment (data residency)

### 10.3 No Analytics or Tracking

**No Third-Party Analytics:**
- No Google Analytics
- No Facebook Pixel
- No tracking cookies
- No advertising networks

---

## 11. Cookies & Tracking

### 11.1 Essential Cookies

**Session Cookies:**
- Used for authentication (JWT tokens)
- Required for system functionality
- Expire after 15 minutes of inactivity

**No Non-Essential Cookies:**
- No advertising cookies
- No tracking cookies
- No social media cookies

### 11.2 Local Storage

**IndexedDB & Service Workers:**
- Used for offline-first functionality (PWA)
- Data encrypted locally
- User can clear browser data at any time

---

## 12. International & Regional Compliance

### 12.1 GDPR Compliance (European Standard)

**GDPR Principles Applied:**
- **Lawfulness, Fairness, Transparency** (Article 5(1)(a))
- **Purpose Limitation** (Article 5(1)(b))
- **Data Minimization** (Article 5(1)(c))
- **Accuracy** (Article 5(1)(d))
- **Storage Limitation** (Article 5(1)(e))
- **Integrity & Confidentiality** (Article 5(1)(f))
- **Accountability** (Article 5(2))

**Legal Bases:**
- **Legal Obligation** (Article 6(1)(c)) - Criminal case management
- **Legitimate Interest** (Article 6(1)(f)) - Law enforcement operations

### 12.2 Malabo Convention Compliance (African Standard)

**African Union Convention on Cyber Security and Personal Data Protection:**
- **Article 12:** Data protection principles (lawfulness, fairness, purpose limitation)
- **Article 13:** Security of processing
- **Article 14:** Rights of data subjects
- **Article 15:** Obligations of data controllers
- **Article 16:** Cross-border data flows

**Ratification Status:** Varies by country (Sierra Leone status TBD)

### 12.3 Country-Specific Laws

**Adaptable Compliance:**
- Each deployment must comply with local data protection laws
- Examples:
  - **Ghana:** Data Protection Act, 2012 (Act 843)
  - **Kenya:** Data Protection Act, 2019
  - **Nigeria:** Nigeria Data Protection Regulation (NDPR), 2019
  - **South Africa:** Protection of Personal Information Act (POPIA), 2013

**Implementation:**
- Review local laws before deployment
- Adapt retention policies, consent mechanisms, and rights procedures
- Appoint local Data Protection Officer

---

## 13. Data Breach Notification

### 13.1 Breach Response Procedure

**In the Event of a Data Breach:**
1. **Immediate Containment:** Isolate affected systems
2. **Investigation:** Determine scope, cause, and impact
3. **Notification:** Notify affected parties within 72 hours (GDPR requirement)
4. **Remediation:** Fix vulnerabilities, restore systems
5. **Documentation:** Log incident in audit trail

### 13.2 Notification Requirements

**Notify:**
- **Data Protection Authority** (within 72 hours)
- **Affected Individuals** (without undue delay)
- **Supervisory Officers** (immediate notification)

**Breach Report Includes:**
- Nature of breach
- Categories of data affected
- Number of individuals affected
- Potential consequences
- Mitigation measures taken

---

## 14. Data Protection Officer (DPO)

### 14.1 DPO Responsibilities

Each deploying agency must appoint a Data Protection Officer responsible for:
- Monitoring GDPR/Malabo Convention compliance
- Conducting Data Protection Impact Assessments (DPIAs)
- Handling data subject requests (access, rectification, etc.)
- Liaising with supervisory authorities
- Training staff on data protection

### 14.2 Contact DPO

**Sierra Leone (Pilot):**
- **Name:** [To Be Appointed]
- **Email:** dpo@sierraleonepol.gov.sl (placeholder)
- **Phone:** [To Be Assigned]

**Other Countries:**
- Contact your country's deploying law enforcement agency DPO

---

## 15. Multi-Country Adaptability

### 15.1 Configuration for Local Laws

**Customizable Elements:**
1. **Data Retention Periods:** Adjust per country's legal requirements
2. **Consent Mechanisms:** Adapt for local consent laws
3. **Data Subject Rights:** Configure per local data protection laws
4. **Cross-Border Transfer Rules:** Set per country's transfer regulations
5. **Breach Notification Timelines:** Adjust per local requirements (e.g., 72 hours GDPR, may vary)

### 15.2 Localization

**Language Support:**
- Privacy policy translated to local languages
- English, French, Portuguese, Arabic, Swahili, Amharic, etc.

**Cultural Considerations:**
- Adapt terminology and examples to local context
- Respect cultural norms around privacy and data sharing

---

## 16. Changes to This Privacy Policy

### 16.1 Policy Updates

This privacy policy may be updated to reflect:
- Changes in legal requirements
- New features or functionality
- Improved data protection measures

**Notification:**
- Users notified of material changes via system notification
- Updated version posted at `/PRIVACY_POLICY.md`
- Effective date updated at top of document

### 16.2 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2025 | Initial privacy policy for DPG submission |

---

## 17. Contact & Complaints

### 17.1 Contact Information

**For Privacy Questions or Concerns:**
- **Data Protection Officer:** See Section 14
- **General Inquiries:** Contact deploying law enforcement agency

**For Open-Source Software Issues:**
- **GitHub Repository:** https://github.com/[repo-url] (to be added)
- **Security Issues:** See SECURITY.md

### 17.2 Supervisory Authority

**Right to Lodge a Complaint:**
- Individuals have the right to lodge a complaint with their country's data protection supervisory authority
- **Sierra Leone:** [Supervisory Authority TBD]
- **Other Countries:** Contact local data protection authority

---

## 18. Accountability & Transparency

### 18.1 Transparency Commitment

CRMS is committed to transparency in data processing:
- Open-source codebase (MIT License) - anyone can audit
- Public documentation of security measures
- Regular security audits
- Community-driven improvements

### 18.2 Accountability

**Record of Processing Activities:**
- Maintained per GDPR Article 30 / Malabo Convention Article 15
- Documents all processing operations
- Available to supervisory authorities upon request

---

## 19. Special Categories of Data

### 19.1 Criminal Convictions & Offences

CRMS processes data relating to criminal convictions and offences under:
- **GDPR Article 10:** Processing of personal data relating to criminal convictions
- **Malabo Convention Article 12:** Processing under official authority

**Legal Basis:** Processing carried out under official authority of law enforcement agencies.

### 19.2 Biometric Data

Biometric data (fingerprints, biometric hashes) processed under:
- **GDPR Article 9(2)(f):** Processing necessary for legal claims
- **GDPR Article 10:** Criminal convictions data
- **Malabo Convention Article 12:** Special categories of data

**Safeguards:** Hashing (SHA-256), encryption, access controls, audit logging.

---

## 20. Conclusion

CRMS is designed with **Privacy by Design** and **Security by Default** principles. We are committed to protecting the personal data of all individuals while fulfilling the legitimate law enforcement needs of African countries.

**Key Takeaways:**
- ✅ GDPR & Malabo Convention compliant
- ✅ End-to-end encryption for PII
- ✅ Role-based access controls
- ✅ Comprehensive audit logging
- ✅ Individual rights respected (within legal limitations)
- ✅ Multi-country adaptable
- ✅ Open-source transparency

**Questions?** Contact your Data Protection Officer or supervisory authority.

---

**Document Status:** DPG Submission Ready
**Review Date:** Annually (January 2026)
**License:** This privacy policy template is MIT licensed (same as CRMS software)

