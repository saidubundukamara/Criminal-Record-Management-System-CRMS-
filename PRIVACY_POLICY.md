# Privacy Policy

**Effective Date:** November 8, 2025  
**Last Updated:** November 8, 2025  
**Version:** 1.0

---

## 1. Introduction

The Criminal Record Management System (CRMS) is a Pan-African Digital Public Good designed for law enforcement agencies across the African continent. This Privacy Policy explains how we collect, use, store, and protect personal data in compliance with international and local data protection laws.

CRMS is committed to:
- **Privacy by Design** - Data protection built into the system architecture
- **Data Sovereignty** - Each country controls its own data
- **Transparency** - Open-source code for public audit
- **Compliance** - GDPR, Malabo Convention, and country-specific laws

### Scope

This policy applies to all CRMS deployments across Africa. Each country deployment operates independently with its own data controller and policies based on local laws.

---

## 2. Data Controller

### Country-Specific Controllers

CRMS operates on a **decentralized model**. Each country deployment has its own Data Controller:

**Sierra Leone (Pilot Implementation):**
- **Data Controller:** Sierra Leone Police Force
- **Address:** Police Headquarters, Freetown, Sierra Leone
- **Contact:** dpo@police.gov.sl
- **Data Protection Officer (DPO):** [To be appointed per country]

**Other Deployments:**

Each country deploying CRMS must designate:
- A Data Controller (typically the national police force)
- A Data Protection Officer (DPO)
- Contact information for data subject requests

---

## 3. Legal Basis for Processing

CRMS processes personal data under the following legal bases:

### 3.1 International Frameworks

- **General Data Protection Regulation (GDPR)** - Articles 6(1)(e) and 9(2)(f) for law enforcement processing
- **African Union Malabo Convention on Cyber Security and Personal Data Protection** (2014)
- **Directive on the Protection of Personal Data** within law enforcement contexts

### 3.2 Country-Specific Laws

Each deployment must comply with local data protection legislation:

- **Sierra Leone:** Data Protection Act, 2023
- **Ghana:** Data Protection Act, 2012 (Act 843)
- **Nigeria:** Nigeria Data Protection Regulation (NDPR), 2019
- **Kenya:** Data Protection Act, 2019
- **South Africa:** Protection of Personal Information Act (POPIA), 2013

### 3.3 Law Enforcement Exception

CRMS processes sensitive personal data (including biometric data, criminal records, and personal identifiers) under the **law enforcement exception** for:
- Prevention, investigation, detection, or prosecution of criminal offenses
- Execution of criminal penalties
- Safeguarding against and prevention of threats to public security

---

## 4. Data We Collect

### 4.1 Person Records (Suspects, Victims, Witnesses)

**Basic Information:**
- National identification number (NIN, Ghana Card, Huduma Namba, SA ID, etc.)
- Full name (first, middle, last), aliases
- Date of birth, gender, nationality
- Photographs (for identification purposes)

**Contact Information (Encrypted):**
- Residential address (AES-256 encrypted)
- Phone number (AES-256 encrypted)
- Email address (AES-256 encrypted)

**Biometric Data:**
- Fingerprints (stored as SHA-256 hash, not reversible)
- Biometric template hash (for identification systems)

**Case-Related Information:**
- Role in case (suspect, victim, witness, informant)
- Statements provided
- Relationships to other persons in the database

### 4.2 Officer Data

**Professional Information:**
- Badge number, name, rank
- Station assignment, role
- Work phone number, work email

**Authentication Data:**
- PIN (stored as Argon2id hash, irreversible)
- USSD Quick PIN (stored as Argon2id hash)
- Multi-Factor Authentication (MFA) secrets (encrypted)
- Session tokens (temporary, auto-expiring)

**Activity Data:**
- Login history (timestamps, IP addresses)
- Actions performed (via audit logs)
- USSD query logs (for field officer tools)

### 4.3 Case Data

- Case number, title, description
- Category (theft, assault, fraud, etc.), severity, status
- Incident date, location
- Investigation notes, case updates
- Links to persons, evidence, officers

### 4.4 Evidence Data

- Evidence type (photo, document, video, physical, digital)
- Description, collection details
- QR codes for physical evidence tracking
- File hashes (SHA-256 for integrity verification)
- Chain of custody records (who handled, when, where)

### 4.5 Background Check Requests

- National ID number (for verification)
- Request type (officer, citizen, employer, visa)
- Requester information (officer ID or phone number)
- Results (full for officers, redacted for citizens)

### 4.6 Alert Data

**Amber Alerts (Missing Persons):**
- Missing person's name, age, gender, description
- Last seen location and date
- Contact information for tips

**Wanted Persons:**
- Name, aliases, charges
- Photo, description, danger level
- Warrant information, reward (if applicable)

---

## 5. How We Use Your Data

### 5.1 Primary Purposes

CRMS uses personal data **exclusively for law enforcement purposes**:

1. **Criminal Investigations** - Track suspects, victims, witnesses in active cases
2. **Case Management** - Manage investigations from report to prosecution
3. **Evidence Management** - Maintain chain of custody for legal proceedings
4. **Background Checks** - Verify criminal records for employment, visas, court proceedings
5. **Public Safety Alerts** - Issue Amber Alerts and wanted person notices
6. **Cross-Border Cooperation** - Share information with other law enforcement agencies (with proper legal agreements)
7. **Operational Analytics** - Generate statistics for resource allocation and crime prevention
8. **Audit & Accountability** - Track all system actions for oversight and investigations

### 5.2 Secondary Uses

- **Training** - Anonymized/redacted data for officer training (no real identities)
- **System Improvement** - Performance monitoring, bug fixes (no personal data analysis)
- **Research** - Anonymized crime statistics for public policy (aggregate data only)

### 5.3 Uses We DO NOT Permit

- ❌ **Commercial purposes** - No selling or marketing of data
- ❌ **Unauthorized surveillance** - No mass surveillance or profiling outside active investigations
- ❌ **Discrimination** - No use for discriminatory practices
- ❌ **Political purposes** - No use for political targeting or persecution

---

## 6. Data Security

### 6.1 Technical Safeguards

**Encryption:**
- **At Rest:** AES-256-GCM encryption for PII (addresses, phone numbers, emails)
- **In Transit:** TLS 1.3 for all network communication
- **Passwords/PINs:** Argon2id hashing (OWASP recommended, GPU-resistant)
- **Biometrics:** SHA-256 one-way hashing (irreversible)

**Access Controls:**
- **Role-Based Access Control (RBAC):** 6 role levels with granular permissions
- **Multi-Factor Authentication (MFA):** SMS OTP and TOTP for sensitive accounts
- **Session Management:** 15-minute auto-expiry, secure httpOnly cookies
- **Account Lockout:** 5 failed login attempts trigger 30-minute lockout

**Infrastructure Security:**
- **Database:** PostgreSQL with SSL/TLS connections, backups encrypted
- **File Storage:** S3-compatible storage with server-side encryption
- **Network:** Firewalls, VPN access for remote stations, DDoS protection
- **Updates:** Regular security patches, automated vulnerability scanning

### 6.2 Organizational Safeguards

**Audit Logging:**
- Every action logged (who, what, when, where)
- Immutable audit trail (cannot be deleted or modified)
- Real-time monitoring for suspicious activity
- Quarterly audit reviews by oversight bodies

**Personnel Security:**
- Background checks for all officers with system access
- Security awareness training (annual mandatory)
- Principle of least privilege (minimum access needed)
- Immediate account deactivation upon termination

**Physical Security:**
- Server rooms with restricted access, surveillance cameras
- Evidence storage with QR code tracking, tamper-evident seals
- Backup systems in geographically separate locations

### 6.3 Data Breach Response

In the event of a data breach:

1. **Detection & Containment** - Within 24 hours
2. **Assessment** - Determine scope and impact within 72 hours
3. **Notification** - Affected individuals and supervisory authority within 72 hours (GDPR requirement)
4. **Remediation** - Patch vulnerabilities, enhance security
5. **Review** - Post-incident analysis and policy updates

**Contact for Security Incidents:** security@crms-africa.org

---

## 7. Data Retention

### 7.1 Retention Periods

| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| **Active Cases** | Until case closure + 10 years | Criminal Procedure Acts |
| **Closed Cases** | 25 years (serious crimes), 10 years (minor crimes) | Evidence preservation for appeals |
| **Person Records** | Lifetime (criminal records), 10 years (witnesses) | Background check requirements |
| **Evidence** | Until case closure + statute of limitations | Legal proceedings |
| **Audit Logs** | 7 years minimum | Compliance and oversight |
| **Background Checks** | 3 years | Record-keeping for disputes |
| **Amber Alerts** | 30 days after resolution | Operational necessity |
| **Wanted Persons** | Until capture or warrant expiry | Ongoing law enforcement need |
| **Officer Accounts** | Duration of employment + 5 years | Personnel records |

### 7.2 Deletion Procedures

After retention periods expire:
- **Automated Deletion** - System flags records for review
- **Manual Review** - DPO or designated officer reviews before deletion
- **Secure Deletion** - Cryptographic erasure, overwriting (DoD 5220.22-M standard)
- **Audit Trail** - Deletion events logged for accountability

### 7.3 Exceptions

Data may be retained longer if:
- Subject to active legal proceedings or appeals
- Required by court order or legal hold
- Necessary for ongoing investigations
- Subject to public records laws

---

## 8. Your Rights (Data Subject Rights)

Under GDPR, Malabo Convention, and local data protection laws, individuals have the following rights:

### 8.1 Right to Access (GDPR Article 15)

**You can request:**
- Confirmation of whether we process your data
- Copy of your personal data
- Information about how we use your data

**How to request:** Submit written request to country DPO  
**Response time:** 30 days (may extend to 60 days for complex requests)  
**Fee:** Free for first request; reasonable fee for excessive/repetitive requests

### 8.2 Right to Rectification (GDPR Article 16)

**You can request:**
- Correction of inaccurate personal data
- Completion of incomplete data

**Limitation:** Must not compromise ongoing investigations

### 8.3 Right to Erasure / "Right to be Forgotten" (GDPR Article 17)

**You can request deletion if:**
- Data no longer necessary for law enforcement purposes
- You were wrongly included in database (mistaken identity)
- Retention period has expired

**Limitation:** Does not apply to:
- Active criminal investigations or prosecutions
- Legal obligations (evidence preservation)
- Public interest (public safety)
- Exercise of official authority

### 8.4 Right to Restriction of Processing (GDPR Article 18)

**You can request temporary halt to processing if:**
- You contest the accuracy of data (pending verification)
- Processing is unlawful but you don't want deletion
- You need data for legal claims

### 8.5 Right to Data Portability (GDPR Article 20)

**You can request:**
- Copy of your data in structured, machine-readable format (JSON, CSV)
- Transfer to another system (if technically feasible)

**Limitation:** May be restricted for law enforcement data

### 8.6 Right to Object (GDPR Article 21)

**You can object to processing based on:**
- Your particular situation (case-by-case review)
- Direct marketing (not applicable to CRMS)

**Limitation:** Law enforcement processing may override objection if legally justified

### 8.7 Right to Lodge a Complaint

**You can file a complaint with:**
- National Data Protection Authority (DPA) in your country
- African Union Data Protection Authority (when established)
- Courts of law

**Sierra Leone DPA:** [To be established per Data Protection Act, 2023]  
**Ghana DPA:** Data Protection Commission (https://dataprotection.org.gh)  
**Nigeria DPA:** Nigeria Data Protection Bureau (NDPB)  
**Kenya DPA:** Office of the Data Protection Commissioner  
**South Africa DPA:** Information Regulator

### 8.8 How to Exercise Your Rights

**Contact the Data Protection Officer:**

For Sierra Leone deployment:
- **Email:** dpo@police.gov.sl
- **Mail:** Data Protection Officer, Sierra Leone Police Force, Police Headquarters, Freetown, Sierra Leone
- **In-Person:** Visit Police Headquarters (bring valid ID)

**Include in your request:**
1. Your full name and national ID number
2. Contact information (email, phone, address)
3. Specific right you wish to exercise
4. Description of your request
5. Proof of identity (government-issued ID)

**Response time:** 30 days (extendable to 60 days for complex requests)

---

## 9. Data Sharing & Cross-Border Transfers

### 9.1 Domestic Sharing

CRMS shares data **within the country** with:

- **Other Police Stations** - Case coordination, resource sharing
- **Courts & Prosecutors** - Legal proceedings, evidence presentation
- **Government Agencies** - Immigration, national security (with legal basis)
- **Oversight Bodies** - Parliament, human rights commissions (audit purposes)

**Safeguards:**
- Secure, encrypted channels (VPN, TLS 1.3)
- Audit logging of all data access
- Access controls based on need-to-know

### 9.2 Cross-Border Sharing (International)

CRMS may share data with other countries **only when**:

1. **Legal Agreement Exists** - Bilateral treaty, ECOWAS/SADC/AU agreement, Interpol cooperation
2. **Adequate Protection** - Receiving country has equivalent data protection laws
3. **Specific Purpose** - Defined reason (manhunt, Interpol Red Notice, extradition)
4. **Proportionate** - Minimal data necessary for the purpose
5. **Logged** - All cross-border queries audited

**Examples of legitimate cross-border sharing:**
- Interpol Red Notices (wanted fugitives)
- Amber Alerts (cross-border child abduction)
- Mutual Legal Assistance Treaties (MLAT)
- ECOWAS cooperation for transnational crime
- SADC regional security protocols

**Safeguards:**
- Encrypted API communication (TLS 1.3, mutual authentication)
- Country-by-country authorization (no blanket access)
- Purpose limitation (data used only for stated reason)
- Deletion after purpose fulfilled

### 9.3 Third-Party Service Providers

CRMS may use third-party providers for:

- **Cloud Hosting** - AWS, Azure, Google Cloud (data residency ensured)
- **SMS/USSD Gateway** - Africa's Talking, Twilio (encrypted messages)
- **Backup Services** - Encrypted off-site backups

**Contractual Requirements:**
- Data Processing Agreement (DPA)
- GDPR-compliant terms
- Prohibition on unauthorized use
- Deletion upon contract termination

### 9.4 Public Disclosures

CRMS may publicly disclose:

- **Wanted Person Alerts** - With court warrant or legal authorization
- **Amber Alerts** - For missing children (public safety)
- **Anonymized Crime Statistics** - Aggregate data, no personal identifiers

**No disclosure of:**
- Victim identities (protected by law)
- Witness identities (protected by law)
- Ongoing investigation details (operational security)

---

## 10. Cookies & Tracking

### 10.1 What We Use

CRMS uses **minimal cookies and tracking**:

**Essential Cookies:**
- **Session Cookies** - Authentication, session management (httpOnly, secure)
- **CSRF Tokens** - Security against cross-site request forgery
- **PWA Tokens** - Offline functionality, service worker management

**No Marketing Cookies:**
- We DO NOT use tracking cookies, analytics cookies, or advertising cookies

### 10.2 Cookie Duration

- **Session Cookies:** 15 minutes (auto-expire)
- **"Remember Me":** 30 days (optional, officer accounts only)
- **PWA Cache:** Managed by service worker (configurable)

### 10.3 Local Storage

CRMS uses **browser local storage** for:
- Offline case data (IndexedDB) - encrypted, auto-sync when online
- User preferences (theme, language) - non-sensitive
- Pending sync queue - encrypted, cleared on logout

**Control:** Clear browser data to delete local storage

---

## 11. Children's Privacy

CRMS is a **law enforcement system**, not intended for use by children under 18.

**Minors in the Database:**
- Minors may appear as victims, witnesses, or suspects in cases
- Enhanced privacy protections apply (consent from guardian where applicable)
- Juvenile records sealed or expunged per local laws
- Special handling for child abuse cases (restricted access)

**Parental Rights:**
- Parents/guardians can request access to minor's data
- Must provide proof of guardianship
- Subject to law enforcement exceptions (e.g., ongoing abuse investigation)

---

## 12. Automated Decision-Making & Profiling

### 12.1 Current Use

CRMS does **NOT currently use** automated decision-making or profiling that significantly affects individuals.

**No Automated Decisions For:**
- Arrest or detention
- Prosecution or sentencing
- Bail or parole decisions

**Human Review Required:**
- All case decisions made by human officers
- All background check results reviewed by humans
- No AI/ML systems making legal judgments

### 12.2 Future Use

If CRMS implements AI/ML in the future (e.g., facial recognition, risk scoring):

- **Transparency:** Clear notice of automated processing
- **Explainability:** Right to explanation of decisions
- **Human Oversight:** Right to human review and appeal
- **Bias Testing:** Regular audits for discriminatory bias
- **Opt-Out:** Right to object (where legally permissible)

**Commitment:** CRMS will never deploy opaque "black box" AI systems without rigorous testing and oversight.

---

## 13. Open Source Transparency

CRMS is an **open-source system** (MIT License), meaning:

### 13.1 Code Transparency

- **Public Repository:** https://github.com/african-digital-goods/crms
- **Auditable Code:** Anyone can inspect security and privacy implementations
- **Community Review:** Security researchers can identify vulnerabilities
- **No Hidden Backdoors:** All code is publicly visible

### 13.2 Data Transparency

- **Data Stays Local:** Each country hosts its own database (no central server)
- **No Telemetry:** CRMS does not "phone home" or send usage data to developers
- **No Vendor Lock-In:** Countries own their data, can export at any time

### 13.3 Contribution Privacy

- **Contributors:** GitHub usernames public, but no personal data required
- **Issue Reports:** Do not include real personal data in bug reports
- **Test Data:** All test/demo data is fictional

---

## 14. Updates to This Policy

### 14.1 Change Process

This Privacy Policy may be updated to reflect:
- Changes in data protection laws
- New features in CRMS
- Feedback from data protection authorities
- Security improvements

### 14.2 Notification

**Significant changes:**
- Posted on CRMS website/repository
- Notified to country DPOs (email)
- 30-day notice before taking effect
- Version history maintained on GitHub

**Minor changes:**
- Updated version number and date
- Published on GitHub
- No prior notice required

### 14.3 Version Control

- **Current Version:** 1.0 (November 8, 2025)
- **Previous Versions:** [GitHub commit history]
- **Change Log:** See CHANGELOG.md

---

## 15. Contact Information

### 15.1 Data Protection Inquiries

**For Sierra Leone Deployment:**
- **Data Protection Officer (DPO):** [To be appointed]
- **Email:** dpo@police.gov.sl
- **Phone:** +232-XXX-XXXX
- **Address:** Data Protection Officer, Sierra Leone Police Force, Police Headquarters, Freetown, Sierra Leone

**For Other Country Deployments:**

Each country must provide DPO contact information specific to their deployment.

### 15.2 Security Incidents

**Report security vulnerabilities or data breaches:**
- **Email:** security@crms-africa.org
- **Response Time:** 48 hours for acknowledgment
- **PGP Key:** [To be published]

### 15.3 General Inquiries

**For questions about CRMS:**
- **Website:** https://crms-africa.org
- **GitHub:** https://github.com/african-digital-goods/crms
- **Email:** info@crms-africa.org

### 15.4 Supervisory Authority

**For complaints about data processing:**

File a complaint with your national Data Protection Authority:

- **Sierra Leone:** [DPA to be established]
- **Ghana:** Data Protection Commission - https://dataprotection.org.gh
- **Nigeria:** Nigeria Data Protection Bureau - https://ndpb.gov.ng
- **Kenya:** Office of the Data Protection Commissioner - https://odpc.go.ke
- **South Africa:** Information Regulator - https://inforegulator.org.za

---

## 16. Legal References

This Privacy Policy is based on:

1. **Regulation (EU) 2016/679** - General Data Protection Regulation (GDPR)
2. **Directive (EU) 2016/680** - Law Enforcement Directive
3. **African Union Malabo Convention** on Cyber Security and Personal Data Protection (2014)
4. **Country-Specific Laws:**
   - Sierra Leone: Data Protection Act, 2023
   - Ghana: Data Protection Act, 2012 (Act 843)
   - Nigeria: Nigeria Data Protection Regulation (NDPR), 2019
   - Kenya: Data Protection Act, 2019
   - South Africa: Protection of Personal Information Act (POPIA), 2013

---

## 17. Acknowledgments

This Privacy Policy was developed with input from:
- Data protection experts across Africa
- Law enforcement professionals
- Civil society organizations
- Digital rights advocates
- Open-source community contributors

Special thanks to the Digital Public Goods Alliance for guidance on DPG compliance.

---

**Last Updated:** November 8, 2025  
**Next Review:** November 8, 2026 (annual review)

---

🔒 **Your privacy is our priority. CRMS is designed with privacy by default and transparency by design.**

For questions or concerns, contact your country's Data Protection Officer.

---

**Digital Public Good Notice:**

This privacy policy is part of CRMS, a Pan-African Digital Public Good licensed under MIT License. The policy template is freely available for adaptation by any African country deploying CRMS. Each deployment must customize Section 2 (Data Controller), Section 8.8 (DPO Contact), and Section 15 (Contact Information) with country-specific details.

---

**END OF PRIVACY POLICY**
