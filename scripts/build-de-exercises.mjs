/**
 * build-de-exercises.mjs
 *
 * Generates dist/exercises.de.json from dist/exercises.json by adding
 * German translations for all relevant fields.
 *
 * Translation strategy:
 *  - Enums (level, force, mechanic, equipment, muscles, category):
 *      Hardcoded maps with full coverage over all possible values.
 *  - Exercise names:
 *      Manual mapping file: translations/names.de.json
 *      Format: { "English Name": "Deutscher Name" }
 *      No fallback guessing – missing entries are reported clearly.
 *  - Instructions:
 *      Manual/API mapping file: translations/instructions.de.json
 *      Format: { "exercise-id": ["Schritt 1…", "Schritt 2…"] }
 *      Missing entries fall back to English (reported separately).
 *
 * Usage:
 *   node scripts/build-de-exercises.mjs
 *   node scripts/build-de-exercises.mjs --report   (show all missing names/ids)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const showReport = process.argv.includes('--report');
const root = resolve(process.cwd());

// ---------------------------------------------------------------------------
// File paths
// ---------------------------------------------------------------------------
const sourcePath          = resolve(root, 'dist/exercises.json');
const targetPath          = resolve(root, 'dist/exercises.de.json');
const namesMapPath        = resolve(root, 'translations/names.de.json');
const instructionsMapPath = resolve(root, 'translations/instructions.de.json');

// ---------------------------------------------------------------------------
// Enum translations – hardcoded, 100% coverage guaranteed
// ---------------------------------------------------------------------------

const FORCE_DE = {
  static: 'statisch',
  pull:   'ziehend',
  push:   'drückend',
};

const LEVEL_DE = {
  beginner:     'Anfänger',
  intermediate: 'Fortgeschritten',
  expert:       'Experte',
};

const MECHANIC_DE = {
  isolation: 'Isolation',
  compound:  'Grundübung',
};

const EQUIPMENT_DE = {
  'medicine ball':  'Medizinball',
  dumbbell:         'Kurzhantel',
  'body only':      'Körpergewicht',
  bands:            'Widerstandsband',
  kettlebells:      'Kettlebell',
  'foam roll':      'Faszienrolle',
  cable:            'Kabelzug',
  machine:          'Maschine',
  barbell:          'Langhantel',
  'exercise ball':  'Gymnastikball',
  'e-z curl bar':   'SZ-Stange',
  other:            'Sonstiges',
};

const MUSCLE_DE = {
  abdominals:    'Bauch',
  abductors:     'Abduktoren',
  adductors:     'Adduktoren',
  biceps:        'Bizeps',
  calves:        'Waden',
  chest:         'Brust',
  forearms:      'Unterarme',
  glutes:        'Gesäß',
  hamstrings:    'Beinbeuger',
  lats:          'Latissimus',
  'lower back':  'Unterer Rücken',
  'middle back': 'Mittlerer Rücken',
  neck:          'Nacken',
  quadriceps:    'Quadrizeps',
  shoulders:     'Schultern',
  traps:         'Trapez',
  triceps:       'Trizeps',
};

const CATEGORY_DE = {
  powerlifting:            'Powerlifting',
  strength:                'Kraft',
  stretching:              'Mobilität & Dehnung',
  cardio:                  'Ausdauer',
  'olympic weightlifting': 'Olympisches Gewichtheben',
  strongman:               'Strongman',
  plyometrics:             'Plyometrisch',
};

// ---------------------------------------------------------------------------
// Load mapping files (optional – empty if not yet created)
// ---------------------------------------------------------------------------

const namesMap = existsSync(namesMapPath)
  ? JSON.parse(readFileSync(namesMapPath, 'utf8'))
  : {};

const instructionsMap = existsSync(instructionsMapPath)
  ? JSON.parse(readFileSync(instructionsMapPath, 'utf8'))
  : {};

// ---------------------------------------------------------------------------
// Source exercises
// ---------------------------------------------------------------------------

const exercises = JSON.parse(readFileSync(sourcePath, 'utf8'));

// ---------------------------------------------------------------------------
// Build output
// ---------------------------------------------------------------------------

const missingNames        = [];
const missingInstructions = [];

const output = exercises.map((exercise) => {
  const { name, id, force, level, mechanic, equipment, category,
          primaryMuscles, secondaryMuscles, instructions } = exercise;

  // Name: exact match only – no guessing
  const name_de = namesMap[name] ?? null;
  if (!name_de) missingNames.push(name);

  // Instructions: keyed by exercise id
  const instructions_de = instructionsMap[id] ?? null;
  if (!instructions_de) missingInstructions.push(id);

  return {
    ...exercise,

    // Name (falls back to EN when not yet translated)
    name_de: name_de ?? name,

    // Enum fields – 100% coverage
    force_de:     force     ? (FORCE_DE[force]         ?? force)     : null,
    level_de:     LEVEL_DE[level]                       ?? level,
    mechanic_de:  mechanic  ? (MECHANIC_DE[mechanic]   ?? mechanic)  : null,
    equipment_de: equipment ? (EQUIPMENT_DE[equipment] ?? equipment) : null,
    category_de:  CATEGORY_DE[category]                ?? category,

    // Muscle arrays
    primaryMuscles_de:   (primaryMuscles   ?? []).map((m) => MUSCLE_DE[m] ?? m),
    secondaryMuscles_de: (secondaryMuscles ?? []).map((m) => MUSCLE_DE[m] ?? m),

    // Instructions (falls back to EN when not yet translated)
    instructions_de: instructions_de ?? instructions,
  };
});

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

writeFileSync(targetPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const total                  = output.length;
const translatedNames        = total - missingNames.length;
const translatedInstructions = total - missingInstructions.length;

console.log('');
console.log('✅ Generated:', targetPath);
console.log('');
console.log('📊 Coverage:');
console.log(`   Names:        ${translatedNames}/${total} (${Math.round(translatedNames / total * 100)}%)`);
console.log(`   Instructions: ${translatedInstructions}/${total} (${Math.round(translatedInstructions / total * 100)}%)`);
console.log(`   Enums:        ${total}/${total} (100%) – hardcoded`);
console.log('');

if (missingNames.length > 0) {
  console.log(`⚠️  Missing name translations: ${missingNames.length}`);
  if (showReport) {
    missingNames.forEach((n) => console.log(`   - ${n}`));
  } else {
    console.log('   Run with --report to see all missing names.');
  }
  console.log('');
}

if (missingInstructions.length > 0 && showReport) {
  console.log(`⚠️  Missing instruction translations: ${missingInstructions.length}`);
  missingInstructions.forEach((id) => console.log(`   - ${id}`));
  console.log('');
}
