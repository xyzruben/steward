#!/usr/bin/env ts-node

/**
 * Batch Duplicate Detection Script
 *
 * Scans all receipts for a user (or all users) and detects duplicates.
 * Can optionally auto-mark high-confidence duplicates.
 *
 * Usage:
 *   npm run detect-duplicates                    # Interactive mode
 *   npm run detect-duplicates -- --user <userId> # Specific user
 *   npm run detect-duplicates -- --all           # All users
 *   npm run detect-duplicates -- --auto-mark     # Auto-mark duplicates
 *   npm run detect-duplicates -- --dry-run       # Preview only
 *
 * Examples:
 *   npm run detect-duplicates -- --user abc-123 --auto-mark
 *   npm run detect-duplicates -- --all --dry-run
 */

import { PrismaClient } from '@prisma/client'
import { detectDuplicatesForUser } from '../src/lib/services/duplicateDetection'
import * as readline from 'readline'

const prisma = new PrismaClient()

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

interface CLIOptions {
  userId?: string
  all: boolean
  autoMark: boolean
  dryRun: boolean
  confidenceThreshold: number
  interactive: boolean
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {
    all: false,
    autoMark: false,
    dryRun: false,
    confidenceThreshold: 0.80,
    interactive: args.length === 0
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--user':
        options.userId = args[++i]
        options.interactive = false
        break
      case '--all':
        options.all = true
        options.interactive = false
        break
      case '--auto-mark':
        options.autoMark = true
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--confidence':
        options.confidenceThreshold = parseFloat(args[++i])
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
      default:
        console.error(`Unknown option: ${arg}`)
        printHelp()
        process.exit(1)
    }
  }

  return options
}

function printHelp() {
  console.log(`
Batch Duplicate Detection Script

Usage:
  npm run detect-duplicates [options]

Options:
  --user <userId>          Scan receipts for specific user
  --all                    Scan receipts for all users
  --auto-mark              Automatically mark high-confidence duplicates (≥90%)
  --dry-run                Preview duplicates without marking them
  --confidence <number>    Set confidence threshold (default: 0.80)
  -h, --help               Show this help message

Examples:
  npm run detect-duplicates
  npm run detect-duplicates -- --user abc-123 --auto-mark
  npm run detect-duplicates -- --all --dry-run
  npm run detect-duplicates -- --user abc-123 --confidence 0.85
  `)
}

// ============================================================================
// INTERACTIVE MODE
// ============================================================================

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function interactiveMode(): Promise<CLIOptions> {
  console.log('🔍 Batch Duplicate Detection - Interactive Mode\n')

  const mode = await promptUser('Scan for (1) specific user, (2) all users? [1/2]: ')

  const options: CLIOptions = {
    all: mode === '2',
    autoMark: false,
    dryRun: false,
    confidenceThreshold: 0.80,
    interactive: true
  }

  if (mode === '1') {
    const userId = await promptUser('Enter user ID: ')
    if (!userId) {
      console.error('❌ User ID is required')
      process.exit(1)
    }
    options.userId = userId
  }

  const autoMarkAnswer = await promptUser('Auto-mark high-confidence duplicates (≥90%)? [y/N]: ')
  options.autoMark = autoMarkAnswer.toLowerCase() === 'y'

  const dryRunAnswer = await promptUser('Dry run (preview only)? [y/N]: ')
  options.dryRun = dryRunAnswer.toLowerCase() === 'y'

  return options
}

// ============================================================================
// DUPLICATE DETECTION FUNCTIONS
// ============================================================================

async function detectDuplicatesForSingleUser(
  userId: string,
  options: CLIOptions
) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🔍 Scanning receipts for user: ${userId}`)
  console.log(`${'='.repeat(80)}\n`)

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true }
  })

  if (!user) {
    console.error(`❌ User not found: ${userId}`)
    return
  }

  console.log(`👤 User: ${user.name || user.email}\n`)

  // Run detection
  const result = await detectDuplicatesForUser(userId, {
    autoMark: options.dryRun ? false : options.autoMark,
    confidenceThreshold: options.confidenceThreshold
  })

  // Display results
  console.log(`\n📊 Results:`)
  console.log(`   Total receipts scanned: ${result.totalScanned}`)
  console.log(`   Duplicates found: ${result.duplicatesFound}`)

  if (result.duplicatesFound > 0) {
    const highConfidence = result.duplicates.filter(d => d.confidence >= 0.90).length
    const mediumConfidence = result.duplicates.filter(d => d.confidence >= 0.80 && d.confidence < 0.90).length

    console.log(`   High confidence (≥90%): ${highConfidence}`)
    console.log(`   Medium confidence (80-89%): ${mediumConfidence}`)

    if (options.autoMark && !options.dryRun) {
      console.log(`   ✅ Auto-marked: ${highConfidence}`)
    }

    // Show sample duplicates
    console.log(`\n🔖 Sample duplicates:`)
    result.duplicates.slice(0, 10).forEach((match, index) => {
      console.log(`\n   ${index + 1}. ${match.receipt.merchant}`)
      console.log(`      Amount: $${match.receipt.total}`)
      console.log(`      Date: ${match.receipt.purchaseDate.toISOString().split('T')[0]}`)
      console.log(`      Confidence: ${(match.confidence * 100).toFixed(1)}%`)
      console.log(`      Reasons: ${match.reasons.join(', ')}`)
    })
  }

  if (options.dryRun) {
    console.log(`\n⚠️  DRY RUN - No receipts were marked as duplicates`)
  }
}

async function detectDuplicatesForAllUsers(options: CLIOptions) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🔍 Scanning receipts for ALL users`)
  console.log(`${'='.repeat(80)}\n`)

  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  })

  console.log(`Found ${users.length} users\n`)

  let totalScanned = 0
  let totalDuplicates = 0
  let totalAutoMarked = 0

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    console.log(`\n[${i + 1}/${users.length}] Processing: ${user.name || user.email}`)

    try {
      const result = await detectDuplicatesForUser(user.id, {
        autoMark: options.dryRun ? false : options.autoMark,
        confidenceThreshold: options.confidenceThreshold
      })

      totalScanned += result.totalScanned
      totalDuplicates += result.duplicatesFound

      if (!options.dryRun && options.autoMark) {
        const autoMarked = result.duplicates.filter(d => d.confidence >= 0.90).length
        totalAutoMarked += autoMarked
      }

      console.log(`   Scanned: ${result.totalScanned}, Duplicates: ${result.duplicatesFound}`)

    } catch (error) {
      console.error(`   ❌ Error processing user ${user.email}:`, error)
    }
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log(`📊 OVERALL RESULTS`)
  console.log(`${'='.repeat(80)}`)
  console.log(`Total users processed: ${users.length}`)
  console.log(`Total receipts scanned: ${totalScanned}`)
  console.log(`Total duplicates found: ${totalDuplicates}`)

  if (options.autoMark && !options.dryRun) {
    console.log(`Total auto-marked: ${totalAutoMarked}`)
  }

  if (options.dryRun) {
    console.log(`\n⚠️  DRY RUN - No receipts were marked as duplicates`)
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  console.log('🚀 Batch Duplicate Detection Script\n')

  try {
    // Parse command line arguments or run interactive mode
    let options: CLIOptions

    if (process.argv.length <= 2) {
      options = await interactiveMode()
    } else {
      options = parseArgs()
    }

    // Display options
    console.log('\n⚙️  Options:')
    if (options.userId) {
      console.log(`   User ID: ${options.userId}`)
    } else if (options.all) {
      console.log(`   Mode: All users`)
    }
    console.log(`   Auto-mark: ${options.autoMark ? 'Yes' : 'No'}`)
    console.log(`   Dry run: ${options.dryRun ? 'Yes' : 'No'}`)
    console.log(`   Confidence threshold: ${options.confidenceThreshold}`)

    // Confirm before proceeding
    if (!options.dryRun && options.autoMark) {
      console.log('\n⚠️  WARNING: This will automatically mark duplicates!')
      const confirm = await promptUser('Continue? [y/N]: ')
      if (confirm.toLowerCase() !== 'y') {
        console.log('Cancelled.')
        process.exit(0)
      }
    }

    // Run detection
    if (options.userId) {
      await detectDuplicatesForSingleUser(options.userId, options)
    } else if (options.all) {
      await detectDuplicatesForAllUsers(options)
    } else {
      console.error('❌ Please specify --user <userId> or --all')
      process.exit(1)
    }

    console.log('\n✅ Duplicate detection completed successfully!\n')

  } catch (error) {
    console.error('\n💥 Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main()
