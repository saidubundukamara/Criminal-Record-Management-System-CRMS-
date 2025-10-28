# Contributing to CRMS

Thank you for considering contributing to the Criminal Record Management System!
As a Pan-African Digital Public Good, CRMS benefits from contributions across the continent and beyond.

## 🌍 How to Contribute

### Reporting Bugs

1. **Check existing issues** in [Issues](https://github.com/african-digital-goods/crms/issues)
2. If not found, **create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Screenshots/logs (if applicable)
   - Environment details (OS, browser, Node.js version, database version)
   - Your deployment context (country, station type, etc.)

**Template:**
```
**Bug Description:**
[Clear description of the bug]

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- OS: [e.g., Ubuntu 22.04, macOS 13, Windows 11]
- Browser: [e.g., Chrome 120, Firefox 115]
- Node.js: [e.g., 20.11.0]
- PostgreSQL: [e.g., 15.3]
- Deployment: [e.g., Sierra Leone, Docker, localhost]

**Screenshots/Logs:**
[If applicable]
```

### Suggesting Features

1. **Check existing discussions** in [Discussions](https://github.com/african-digital-goods/crms/discussions)
2. Create a **new discussion** in the "Ideas" category with:
   - Use case and problem it solves
   - Proposed solution
   - Alternative solutions considered
   - Impact on existing functionality
   - Relevance to multi-country deployments

**Remember:** CRMS is designed for deployment across Africa. Features should be:
- **Country-agnostic** (not hardcoded to one legal system)
- **Configurable** (adaptable without code changes)
- **Offline-first** (work in low-connectivity environments)
- **Accessible** (USSD support where applicable)

### Pull Requests

#### 1. Fork the Repository

```bash
git clone https://github.com/YOUR_USERNAME/crms.git
cd crms
git remote add upstream https://github.com/african-digital-goods/crms.git
```

#### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# Or for bug fixes:
git checkout -b fix/issue-description
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

#### 3. Make Your Changes

- Follow the [Service-Repository Architecture](docs/SERVICE_REPOSITORY_ARCHITECTURE.md)
- Write or update tests
- Update documentation if needed
- Follow code style guidelines (see below)

#### 4. Test Your Changes

```bash
# Run linting
npm run lint

# Run tests (when available in Phase 11)
npm test

# Test database changes
npx prisma db push
npx prisma db seed

# Manual testing
npm run dev
```

#### 5. Commit Your Changes

We follow **[Conventional Commits](https://www.conventionalcommits.org/)**:

```bash
# Format:
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring (no functional change)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (dependencies, config, etc.)
- `perf:` - Performance improvements
- `ci:` - CI/CD pipeline changes

**Examples:**
```bash
feat(auth): add MFA with SMS OTP support
fix(cases): resolve case number duplicate generation
docs(readme): update installation instructions for Ghana deployment
refactor(repositories): extract base repository pattern
test(services): add unit tests for AuthService
chore(deps): update Prisma to 6.18.0
```

**Commit Message Guidelines:**
- Use present tense ("add feature" not "added feature")
- Use imperative mood ("fix bug" not "fixes bug")
- Be concise but descriptive
- Reference issues/PRs when applicable (#123)

#### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

#### 7. Create a Pull Request

Go to https://github.com/african-digital-goods/crms/pulls and create a PR with:

**PR Title:** Follow conventional commit format
```
feat(auth): add MFA with SMS OTP support
```

**PR Description Template:**
```markdown
## Description
[Clear description of what this PR does]

## Motivation and Context
[Why is this change needed? What problem does it solve?]
[Link to related issue: Fixes #123]

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
[Describe the tests you ran]
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing (describe scenario)

## Deployment Context
[Where was this tested?]
- Environment: [e.g., Sierra Leone pilot, local Docker, Ghana deployment]
- Database: [e.g., PostgreSQL 15.3]
- Browser: [e.g., Chrome 120, USSD simulation]

## Checklist
- [ ] My code follows the Service-Repository architecture
- [ ] I have updated the documentation accordingly
- [ ] I have added tests that prove my fix/feature works
- [ ] All new and existing tests pass
- [ ] My changes are country-agnostic (configurable, not hardcoded)
- [ ] I have checked my code for security vulnerabilities
- [ ] I have considered offline-first scenarios
- [ ] I have tested in low-connectivity environments (if applicable)

## Screenshots (if applicable)
[Add screenshots to demonstrate UI changes]

## Additional Notes
[Any additional context or information]
```

#### 8. Address Review Feedback

- Respond to reviewer comments
- Make requested changes in new commits
- Push updates to your branch
- Re-request review when ready

---

## 💻 Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional)
- Git

### Local Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/crms.git
cd crms

# Add upstream remote
git remote add upstream https://github.com/african-digital-goods/crms.git

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npx prisma db push
npx prisma db seed

# Run development server
npm run dev
```

### Docker Setup

```bash
# Start PostgreSQL + MinIO + App
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

---

## 📝 Code Style Guidelines

### TypeScript

- Use **TypeScript** for all code (strict mode enabled)
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- Avoid `any` (use `unknown` if needed)

**Good:**
```typescript
interface CreateCaseDto {
  title: string;
  description?: string;
  category: CaseCategory;
}

async function createCase(data: CreateCaseDto): Promise<Case> {
  // ...
}
```

**Bad:**
```typescript
function createCase(data: any): any {
  // ...
}
```

### Service-Repository Pattern

- **Controllers (API routes):** HTTP concerns only, no business logic
- **Services:** Business logic, validation, coordination
- **Repositories:** Database access only, no business logic
- **Entities:** Domain models with domain methods

See [docs/SERVICE_REPOSITORY_ARCHITECTURE.md](docs/SERVICE_REPOSITORY_ARCHITECTURE.md) for full guidance.

### Naming Conventions

- **Variables/Functions:** `camelCase`
- **Classes/Interfaces:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Files:** `kebab-case.ts` or `PascalCase.ts` (for classes)
- **Directories:** `kebab-case`

### Comments

- Use **JSDoc** for functions and classes
- Explain **why**, not **what** (code should be self-explanatory)
- Add `TODO:` comments for future improvements

```typescript
/**
 * Creates a new case and assigns it to the current officer's station.
 * Generates a unique case number in the format: {StationCode}-{Year}-{SequentialNumber}
 *
 * @param data - Case creation data
 * @param officerId - ID of the officer creating the case
 * @returns The newly created case
 * @throws ValidationError if data is invalid
 * @throws ForbiddenError if officer lacks permissions
 */
async createCase(data: CreateCaseDto, officerId: string): Promise<Case> {
  // Implementation
}
```

### Formatting

- **Indentation:** 2 spaces (not tabs)
- **Line Length:** 80-120 characters (flexible)
- **Semicolons:** Required
- **Quotes:** Double quotes for strings
- **Trailing Commas:** Yes (for multi-line)

We use **ESLint** and **Prettier** (configured in the project):

```bash
# Auto-fix formatting
npm run lint -- --fix
```

---

## 🧪 Testing

### Unit Tests (Phase 11)

```bash
npm test
```

- Test services in isolation by mocking repositories
- Test repository methods with test database
- Aim for 80%+ code coverage

### Integration Tests (Phase 11)

```bash
npm run test:integration
```

- Test API routes with mocked services
- Test full request/response cycles

### E2E Tests (Phase 11)

```bash
npm run test:e2e
```

- Test complete user flows with Playwright
- Test in different browsers

---

## 🌍 Multi-Country Considerations

When contributing, ensure your changes support CRMS's pan-African mission:

### 1. Avoid Hardcoding

**Bad:**
```typescript
const nationalIdLabel = "NIN"; // Hardcoded to Sierra Leone
```

**Good:**
```typescript
const nationalIdLabel = config.nationalIdSystem.displayName; // Configurable
```

### 2. Support Multiple Languages

**Bad:**
```typescript
const message = "Case created successfully";
```

**Good:**
```typescript
const message = t("case.created.success"); // i18n key
```

### 3. Consider Offline Scenarios

**Bad:**
```typescript
const response = await fetch("/api/cases"); // Fails offline
```

**Good:**
```typescript
const response = await fetchWithOffline("/api/cases"); // Queue if offline
```

### 4. Respect Data Sovereignty

- Don't hardcode external API endpoints
- Support self-hosted infrastructure
- Enable data residency options

### 5. Test Across Contexts

- Test with different country configurations
- Test in low-bandwidth scenarios
- Test USSD flows (if applicable)

---

## 📚 Documentation

### When to Update Documentation

- **Always:** When adding new features or changing behavior
- **Code Comments:** Explain complex logic or "why" decisions
- **README.md:** Update for major feature additions
- **CLAUDE.md:** Update for architectural changes
- **API Docs:** Document all new endpoints

### Documentation Structure

```
docs/
├── IMPLEMENTATION_PLAN.md         # 26-week plan
├── SERVICE_REPOSITORY_ARCHITECTURE.md  # Architecture guide
├── CRMS_REQUIREMENTS_SPECIFICATION.md  # Full spec
└── INTEROPERABILITY.md            # Regional integration
```

---

## 🤝 Community Guidelines

### Code of Conduct

We follow our [Code of Conduct](CODE_OF_CONDUCT.md). Key principles:

- **Be respectful** - Treat everyone with kindness
- **Be inclusive** - Welcome diverse perspectives
- **Be collaborative** - Work together, not against
- **Be patient** - Remember language and cultural differences
- **Be constructive** - Provide helpful, actionable feedback

### Communication Channels

- **GitHub Issues** - Bug reports, feature requests
- **GitHub Discussions** - Questions, ideas, showcases
- **Email** - dev@crms-africa.org

### Response Times

- **Issues:** 2-3 business days
- **Pull Requests:** 5-7 business days (complex PRs may take longer)
- **Security Issues:** 48 hours (see [SECURITY.md](SECURITY.md))

---

## 🏆 Recognition

Contributors are recognized in:

1. **GitHub Contributors** - Automatic recognition
2. **Release Notes** - Major contributions highlighted
3. **README Acknowledgments** - Significant contributors listed

---

## 📞 Questions?

- **GitHub Discussions** - https://github.com/african-digital-goods/crms/discussions
- **Email** - dev@crms-africa.org
- **Documentation** - See `docs/` folder

---

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Digital Public Goods Standard](https://digitalpublicgoods.net/standard/)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

---

Thank you for contributing to CRMS! Together, we're building a safer, more just Africa. 🌍

**Built with ❤️ by contributors across Africa and beyond**
