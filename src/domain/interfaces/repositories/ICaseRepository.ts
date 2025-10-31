/**
 * Case Repository Interface
 *
 * Contract for case data access operations.
 * Pan-African Design: Supports any country's legal framework and case workflows
 */
import { Case, CaseStatus, CaseSeverity, CaseCategory } from "@/src/domain/entities/Case";

export interface CreateCaseDto {
  title: string;
  description?: string;
  category: CaseCategory;
  severity: CaseSeverity;
  incidentDate: Date;
  location?: string;
  stationId: string;
  officerId: string;
}

export interface UpdateCaseDto {
  title?: string;
  description?: string;
  category?: CaseCategory;
  severity?: CaseSeverity;
  status?: CaseStatus;
  location?: string;
  officerId?: string; // For reassigning investigating officer
}

export interface CaseFilters {
  status?: CaseStatus | CaseStatus[];
  category?: CaseCategory | CaseCategory[];
  severity?: CaseSeverity | CaseSeverity[];
  stationId?: string;
  officerId?: string;
  startDate?: Date; // Filter by incidentDate
  endDate?: Date;
  search?: string; // Search by case number, title
  limit?: number;
  offset?: number;
}

export interface CaseWithRelations extends Case {
  officer?: {
    id: string;
    name: string;
    badge: string;
  };
  station?: {
    id: string;
    name: string;
    code: string;
  };
  personsCount?: number;
  evidenceCount?: number;
  notesCount?: number;
}

export interface ICaseRepository {
  // Queries
  findById(id: string, includeRelations?: boolean): Promise<CaseWithRelations | null>;
  findByCaseNumber(caseNumber: string): Promise<Case | null>;
  findAll(filters?: CaseFilters): Promise<CaseWithRelations[]>;
  findByStationId(stationId: string, filters?: CaseFilters): Promise<Case[]>;
  findByOfficerId(officerId: string, filters?: CaseFilters): Promise<Case[]>;
  findByPersonId(personId: string): Promise<Case[]>;
  count(filters?: CaseFilters): Promise<number>;

  // Commands
  create(data: CreateCaseDto): Promise<Case>;
  update(id: string, data: UpdateCaseDto): Promise<Case>;
  updateStatus(id: string, status: CaseStatus): Promise<Case>;
  delete(id: string): Promise<void>;

  // Case-specific operations
  generateCaseNumber(stationId: string): Promise<string>;
  assignOfficer(caseId: string, officerId: string): Promise<Case>;

  // Statistics
  getCountByStatus(stationId?: string): Promise<Record<CaseStatus, number>>;
  getCountBySeverity(stationId?: string): Promise<Record<CaseSeverity, number>>;
  getStaleCases(stationId?: string, days?: number): Promise<Case[]>;
}
