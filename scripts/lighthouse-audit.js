#!/usr/bin/env node

/**
 * Lighthouse Audit Script
 *
 * Automated Lighthouse audits for CRMS PWA.
 * Runs audits on desktop and mobile devices with different network conditions.
 *
 * Usage:
 *   node scripts/lighthouse-audit.js
 *   node scripts/lighthouse-audit.js --url=http://localhost:3000
 *   node scripts/lighthouse-audit.js --output=./lighthouse-results
 *
 * Pan-African Design:
 * - Tests 2G, 3G, 4G network conditions
 * - Mobile and desktop audits
 * - PWA compliance checks
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const config = {
  url: process.argv.find((arg) => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000',
  outputDir: process.argv.find((arg) => arg.startsWith('--output='))?.split('=')[1] || './lighthouse-results',
  runs: process.argv.find((arg) => arg.startsWith('--runs='))?.split('=')[1] || 1,
};

// Lighthouse configurations for different scenarios
const configs = {
  // Desktop audit
  desktop: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'desktop',
      screenEmulation: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        mobile: false,
      },
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
      },
    },
  },

  // Mobile audit (4G network)
  mobile4G: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'mobile',
      screenEmulation: {
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        mobile: true,
      },
      throttling: {
        rttMs: 150,
        throughputKbps: 1600,
        cpuSlowdownMultiplier: 4,
      },
    },
  },

  // Mobile audit (3G network - common in Africa)
  mobile3G: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'mobile',
      screenEmulation: {
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        mobile: true,
      },
      throttling: {
        rttMs: 300,
        throughputKbps: 700,
        cpuSlowdownMultiplier: 4,
      },
    },
  },

  // Mobile audit (2G network - low-connectivity areas in Africa)
  mobile2G: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'mobile',
      screenEmulation: {
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        mobile: true,
      },
      throttling: {
        rttMs: 850,
        throughputKbps: 50,
        cpuSlowdownMultiplier: 4,
      },
    },
  },
};

/**
 * Run Lighthouse audit
 */
async function runLighthouse(url, config, name) {
  console.log(`\n🔍 Running Lighthouse audit: ${name}...`);

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  });

  try {
    const options = {
      logLevel: 'info',
      output: 'html',
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options, config);

    // Extract scores
    const { lhr } = runnerResult;
    const scores = {
      performance: lhr.categories.performance.score * 100,
      accessibility: lhr.categories.accessibility.score * 100,
      bestPractices: lhr.categories['best-practices'].score * 100,
      seo: lhr.categories.seo.score * 100,
      pwa: lhr.categories.pwa.score * 100,
    };

    console.log(`\n📊 Scores for ${name}:`);
    console.log(`  Performance:    ${scores.performance.toFixed(0)}`);
    console.log(`  Accessibility:  ${scores.accessibility.toFixed(0)}`);
    console.log(`  Best Practices: ${scores.bestPractices.toFixed(0)}`);
    console.log(`  SEO:            ${scores.seo.toFixed(0)}`);
    console.log(`  PWA:            ${scores.pwa.toFixed(0)}`);

    // Check if meets targets
    const targets = {
      performance: 90,
      accessibility: 100,
      bestPractices: 100,
      seo: 100,
      pwa: 100,
    };

    const passing = Object.entries(targets).every(
      ([key, target]) => scores[key] >= target
    );

    if (passing) {
      console.log('\n✅ All targets met!');
    } else {
      console.log('\n⚠️  Some targets not met:');
      Object.entries(targets).forEach(([key, target]) => {
        if (scores[key] < target) {
          console.log(`  ${key}: ${scores[key].toFixed(0)} / ${target} (need ${(target - scores[key]).toFixed(0)} more)`);
        }
      });
    }

    return {
      name,
      scores,
      passing,
      report: runnerResult.report,
      lhr,
    };
  } finally {
    await chrome.kill();
  }
}

/**
 * Save results
 */
async function saveResults(results) {
  // Create output directory
  await fs.mkdir(config.outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

  // Save individual HTML reports
  for (const result of results) {
    const filename = `${result.name}-${timestamp}.html`;
    const filepath = path.join(config.outputDir, filename);
    await fs.writeFile(filepath, result.report);
    console.log(`\n💾 Saved report: ${filepath}`);
  }

  // Save summary JSON
  const summary = {
    timestamp,
    url: config.url,
    results: results.map((r) => ({
      name: r.name,
      scores: r.scores,
      passing: r.passing,
    })),
    overall: {
      allPassing: results.every((r) => r.passing),
      averageScores: {
        performance: average(results.map((r) => r.scores.performance)),
        accessibility: average(results.map((r) => r.scores.accessibility)),
        bestPractices: average(results.map((r) => r.scores.bestPractices)),
        seo: average(results.map((r) => r.scores.seo)),
        pwa: average(results.map((r) => r.scores.pwa)),
      },
    },
  };

  const summaryPath = path.join(config.outputDir, `summary-${timestamp}.json`);
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\n💾 Saved summary: ${summaryPath}`);

  return summary;
}

/**
 * Calculate average
 */
function average(numbers) {
  return Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10) / 10;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 CRMS Lighthouse Audit');
  console.log(`URL: ${config.url}`);
  console.log(`Output: ${config.outputDir}`);
  console.log(`Runs per config: ${config.runs}`);

  const results = [];

  // Run audits for each configuration
  for (const [name, lighthouseConfig] of Object.entries(configs)) {
    const result = await runLighthouse(config.url, lighthouseConfig, name);
    results.push(result);
  }

  // Save results
  const summary = await saveResults(results);

  // Print final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nAverage Scores:`);
  console.log(`  Performance:    ${summary.overall.averageScores.performance}`);
  console.log(`  Accessibility:  ${summary.overall.averageScores.accessibility}`);
  console.log(`  Best Practices: ${summary.overall.averageScores.bestPractices}`);
  console.log(`  SEO:            ${summary.overall.averageScores.seo}`);
  console.log(`  PWA:            ${summary.overall.averageScores.pwa}`);

  if (summary.overall.allPassing) {
    console.log('\n✅ ALL AUDITS PASSED!');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME AUDITS FAILED');
    console.log('\nFailed audits:');
    results.forEach((r) => {
      if (!r.passing) {
        console.log(`  - ${r.name}`);
      }
    });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Error running Lighthouse audit:', error);
    process.exit(1);
  });
}

module.exports = { runLighthouse, saveResults };
