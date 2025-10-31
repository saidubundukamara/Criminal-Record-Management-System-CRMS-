/**
 * Performance Metrics API
 *
 * Endpoint for collecting Web Vitals and custom performance metrics.
 * Stores metrics in database for analysis and monitoring.
 *
 * Pan-African Design:
 * - Accepts metrics from low-bandwidth environments
 * - Supports batch metric submission
 * - Tracks network conditions for context
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { container } from '@/src/di/container';

export interface PerformanceMetricInput {
  metric: {
    id: string;
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    navigationType: string;
    timestamp: number;
  };
  context: {
    url: string;
    userAgent: string;
    connection: {
      effectiveType: string;
      downlink: number;
      rtt: number;
      saveData: boolean;
    };
    device: {
      memory: number;
      hardwareConcurrency: number;
    };
    viewport: {
      width: number;
      height: number;
    };
  };
  sessionId: string;
  userId?: string;
}

/**
 * POST /api/performance
 * Submit performance metrics
 */
export async function POST(request: NextRequest) {
  try {
    // Optional authentication - metrics can be collected from unauthenticated pages
    const session = await getServerSession(authOptions);

    const body = await request.json();

    // Validate input
    if (!body.metric || !body.context || !body.sessionId) {
      return NextResponse.json(
        { error: 'Invalid performance metric data' },
        { status: 400 }
      );
    }

    const metricData: PerformanceMetricInput = body;

    // Use authenticated user ID if available, otherwise use provided userId
    const userId = session?.user?.id || metricData.userId;

    // Store metric via PerformanceService
    await container.performanceService.recordMetric({
      userId,
      sessionId: metricData.sessionId,
      metricName: metricData.metric.name,
      value: metricData.metric.value,
      rating: metricData.metric.rating,
      url: metricData.context.url,
      connectionType: metricData.context.connection.effectiveType,
      deviceMemory: metricData.context.device.memory,
      timestamp: new Date(metricData.metric.timestamp),
    });

    return NextResponse.json(
      { success: true, message: 'Performance metric recorded' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording performance metric:', error);
    return NextResponse.json(
      { error: 'Failed to record performance metric' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/performance
 * Get aggregated performance metrics (for dashboard)
 * Requires authentication and admin permissions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Require authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require admin permissions
    if (!['SuperAdmin', 'Admin'].includes(session.user.roleName)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const metricName = searchParams.get('metric') || undefined;

    // Get aggregated metrics from PerformanceService
    const metrics = await container.performanceService.getAggregatedMetrics({
      days,
      metricName,
    });

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}
