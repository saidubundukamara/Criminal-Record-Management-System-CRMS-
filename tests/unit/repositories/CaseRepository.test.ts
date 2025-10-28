/**
 * CaseRepository Unit Tests
 *
 * Tests for Case repository with mocked Prisma client
 */
import { CaseRepository } from '@/src/repositories/implementations/CaseRepository';
import { prismaMock } from '../../mocks/prisma.mock';
import { mockCasePrisma } from '../../fixtures/test-data';

describe('CaseRepository', () => {
  let caseRepository: CaseRepository;

  beforeEach(() => {
    caseRepository = new CaseRepository(prismaMock);
  });

  describe('findById', () => {
    it('should return case when found', async () => {
      // Arrange
      prismaMock.case.findUnique.mockResolvedValue(mockCasePrisma as any);

      // Act
      const result = await caseRepository.findById('case-123', false);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('case-123');
      expect(result?.caseNumber).toBe('HQ-2025-000001');
      expect(prismaMock.case.findUnique).toHaveBeenCalledWith({
        where: { id: 'case-123' },
        include: undefined,
      });
    });

    it('should return case with relations when requested', async () => {
      // Arrange
      const caseWithRelations = {
        ...mockCasePrisma,
        officer: { id: 'officer-123', name: 'Test Officer', badge: 'SA-00001' },
        station: { id: 'station-hq', name: 'HQ Station', code: 'HQ' },
        _count: { persons: 2, evidence: 3, notes: 1 },
      };

      prismaMock.case.findUnique.mockResolvedValue(caseWithRelations as any);

      // Act
      const result = await caseRepository.findById('case-123', true);

      // Assert
      expect(result).toBeDefined();
      expect(prismaMock.case.findUnique).toHaveBeenCalledWith({
        where: { id: 'case-123' },
        include: expect.objectContaining({
          officer: expect.any(Object),
          station: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
    });

    it('should return null when case not found', async () => {
      // Arrange
      prismaMock.case.findUnique.mockResolvedValue(null);

      // Act
      const result = await caseRepository.findById('invalid-id', false);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByCaseNumber', () => {
    it('should return case when found', async () => {
      // Arrange
      prismaMock.case.findUnique.mockResolvedValue(mockCasePrisma as any);

      // Act
      const result = await caseRepository.findByCaseNumber('HQ-2025-000001');

      // Assert
      expect(result).toBeDefined();
      expect(result?.caseNumber).toBe('HQ-2025-000001');
      expect(prismaMock.case.findUnique).toHaveBeenCalledWith({
        where: { caseNumber: 'HQ-2025-000001' },
      });
    });

    it('should return null when case not found', async () => {
      // Arrange
      prismaMock.case.findUnique.mockResolvedValue(null);

      // Act
      const result = await caseRepository.findByCaseNumber('INVALID-001');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all cases with default limit', async () => {
      // Arrange
      const cases = [mockCasePrisma];
      const casesWithRelations = cases.map(c => ({
        ...c,
        officer: { id: 'officer-123', name: 'Test Officer', badge: 'SA-00001' },
        station: { id: 'station-hq', name: 'HQ Station', code: 'HQ' },
        _count: { persons: 1, evidence: 1, notes: 0 },
      }));

      prismaMock.case.findMany.mockResolvedValue(casesWithRelations as any);

      // Act
      const result = await caseRepository.findAll();

      // Assert
      expect(result).toHaveLength(1);
      expect(prismaMock.case.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should filter cases by status', async () => {
      // Arrange
      prismaMock.case.findMany.mockResolvedValue([]);

      // Act
      await caseRepository.findAll({ status: 'open' });

      // Assert
      expect(prismaMock.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'open' },
        })
      );
    });

    it('should filter cases by multiple statuses', async () => {
      // Arrange
      prismaMock.case.findMany.mockResolvedValue([]);

      // Act
      await caseRepository.findAll({ status: ['open', 'investigating'] });

      // Assert
      expect(prismaMock.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { in: ['open', 'investigating'] } },
        })
      );
    });

    it('should filter cases by search term', async () => {
      // Arrange
      prismaMock.case.findMany.mockResolvedValue([]);

      // Act
      await caseRepository.findAll({ search: 'theft' });

      // Assert
      expect(prismaMock.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { caseNumber: { contains: 'theft', mode: 'insensitive' } },
              { title: { contains: 'theft', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should apply limit and offset', async () => {
      // Arrange
      prismaMock.case.findMany.mockResolvedValue([]);

      // Act
      await caseRepository.findAll({ limit: 10, offset: 20 });

      // Assert
      expect(prismaMock.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });
  });

  describe('findByStationId', () => {
    it('should return cases for station', async () => {
      // Arrange
      prismaMock.case.findMany.mockResolvedValue([mockCasePrisma] as any);

      // Act
      const result = await caseRepository.findByStationId('station-hq');

      // Assert
      expect(result).toHaveLength(1);
      expect(prismaMock.case.findMany).toHaveBeenCalledWith({
        where: { stationId: 'station-hq' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findByOfficerId', () => {
    it('should return cases for officer', async () => {
      // Arrange
      prismaMock.case.findMany.mockResolvedValue([mockCasePrisma] as any);

      // Act
      const result = await caseRepository.findByOfficerId('officer-123');

      // Assert
      expect(result).toHaveLength(1);
      expect(prismaMock.case.findMany).toHaveBeenCalledWith({
        where: { officerId: 'officer-123' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('count', () => {
    it('should return count of cases', async () => {
      // Arrange
      prismaMock.case.count.mockResolvedValue(42);

      // Act
      const result = await caseRepository.count();

      // Assert
      expect(result).toBe(42);
      expect(prismaMock.case.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should return count with filters', async () => {
      // Arrange
      prismaMock.case.count.mockResolvedValue(10);

      // Act
      const result = await caseRepository.count({ status: 'open' });

      // Assert
      expect(result).toBe(10);
      expect(prismaMock.case.count).toHaveBeenCalledWith({
        where: { status: 'open' },
      });
    });
  });

  describe('create', () => {
    it('should create a case with generated case number', async () => {
      // Arrange
      const createData = {
        title: 'New Case',
        description: 'Case description',
        category: 'theft',
        severity: 'minor' as const,
        incidentDate: new Date('2025-01-20'),
        location: 'Freetown',
        stationId: 'station-hq',
        officerId: 'officer-123',
      };

      prismaMock.station.findUnique.mockResolvedValue({
        id: 'station-hq',
        code: 'HQ',
      } as any);

      prismaMock.case.count.mockResolvedValue(5);
      prismaMock.case.create.mockResolvedValue(mockCasePrisma as any);

      // Act
      const result = await caseRepository.create(createData);

      // Assert
      expect(result).toBeDefined();
      expect(prismaMock.station.findUnique).toHaveBeenCalledWith({
        where: { id: 'station-hq' },
        select: { code: true },
      });
      expect(prismaMock.case.count).toHaveBeenCalled();
      expect(prismaMock.case.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          caseNumber: expect.stringContaining('HQ-2025-'),
          title: 'New Case',
          status: 'open',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update a case', async () => {
      // Arrange
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      prismaMock.case.update.mockResolvedValue({
        ...mockCasePrisma,
        ...updateData,
      } as any);

      // Act
      const result = await caseRepository.update('case-123', updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Title');
      expect(prismaMock.case.update).toHaveBeenCalledWith({
        where: { id: 'case-123' },
        data: updateData,
      });
    });
  });

  describe('updateStatus', () => {
    it('should update case status', async () => {
      // Arrange
      prismaMock.case.update.mockResolvedValue({
        ...mockCasePrisma,
        status: 'investigating',
      } as any);

      // Act
      const result = await caseRepository.updateStatus('case-123', 'investigating');

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('investigating');
      expect(prismaMock.case.update).toHaveBeenCalledWith({
        where: { id: 'case-123' },
        data: { status: 'investigating' },
      });
    });
  });

  describe('delete', () => {
    it('should delete a case', async () => {
      // Arrange
      prismaMock.case.delete.mockResolvedValue(mockCasePrisma as any);

      // Act
      await caseRepository.delete('case-123');

      // Assert
      expect(prismaMock.case.delete).toHaveBeenCalledWith({
        where: { id: 'case-123' },
      });
    });
  });

  describe('generateCaseNumber', () => {
    it('should generate case number with correct format', async () => {
      // Arrange
      prismaMock.station.findUnique.mockResolvedValue({
        id: 'station-hq',
        code: 'HQ',
      } as any);

      prismaMock.case.count.mockResolvedValue(5);

      // Act
      const result = await caseRepository.generateCaseNumber('station-hq');

      // Assert
      const year = new Date().getFullYear();
      expect(result).toBe(`HQ-${year}-000006`);
    });

    it('should throw error when station not found', async () => {
      // Arrange
      prismaMock.station.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        caseRepository.generateCaseNumber('invalid-station')
      ).rejects.toThrow('Station not found');
    });
  });

  describe('assignOfficer', () => {
    it('should assign officer to case', async () => {
      // Arrange
      prismaMock.case.update.mockResolvedValue({
        ...mockCasePrisma,
        officerId: 'officer-456',
      } as any);

      // Act
      const result = await caseRepository.assignOfficer('case-123', 'officer-456');

      // Assert
      expect(result).toBeDefined();
      expect(result.officerId).toBe('officer-456');
      expect(prismaMock.case.update).toHaveBeenCalledWith({
        where: { id: 'case-123' },
        data: { officerId: 'officer-456' },
      });
    });
  });

  describe('getCountByStatus', () => {
    it('should return count by status', async () => {
      // Arrange
      const groupByResult = [
        { status: 'open', _count: { status: 10 } },
        { status: 'investigating', _count: { status: 5 } },
        { status: 'closed', _count: { status: 20 } },
      ];

      prismaMock.case.groupBy.mockResolvedValue(groupByResult as any);

      // Act
      const result = await caseRepository.getCountByStatus();

      // Assert
      expect(result.open).toBe(10);
      expect(result.investigating).toBe(5);
      expect(result.closed).toBe(20);
      expect(result.charged).toBe(0);
      expect(result.court).toBe(0);
    });

    it('should filter by station', async () => {
      // Arrange
      prismaMock.case.groupBy.mockResolvedValue([]);

      // Act
      await caseRepository.getCountByStatus('station-hq');

      // Assert
      expect(prismaMock.case.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { stationId: 'station-hq' },
        _count: { status: true },
      });
    });
  });

  describe('getCountBySeverity', () => {
    it('should return count by severity', async () => {
      // Arrange
      const groupByResult = [
        { severity: 'minor', _count: { severity: 15 } },
        { severity: 'major', _count: { severity: 8 } },
        { severity: 'critical', _count: { severity: 2 } },
      ];

      prismaMock.case.groupBy.mockResolvedValue(groupByResult as any);

      // Act
      const result = await caseRepository.getCountBySeverity();

      // Assert
      expect(result.minor).toBe(15);
      expect(result.major).toBe(8);
      expect(result.critical).toBe(2);
    });
  });

  describe('getStaleCases', () => {
    it('should return stale cases', async () => {
      // Arrange
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);

      const staleCase = {
        ...mockCasePrisma,
        status: 'open',
        updatedAt: oldDate,
      };

      prismaMock.case.findMany.mockResolvedValue([staleCase] as any);

      // Act
      const result = await caseRepository.getStaleCases(undefined, 30);

      // Assert
      expect(result).toHaveLength(1);
      expect(prismaMock.case.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: { not: 'closed' },
          updatedAt: { lt: expect.any(Date) },
        }),
        orderBy: { updatedAt: 'asc' },
      });
    });
  });
});
